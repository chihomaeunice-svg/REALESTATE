package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/email"
	"realestate-backend/internal/httpx"
	"realestate-backend/internal/middleware"
	"realestate-backend/internal/models"
	"realestate-backend/internal/payment"
)

type SubscriptionHandler struct {
	DB      *pgxpool.Pool
	Snippe  *payment.SnippeClient
	Email   *email.Client
	BaseURL string
}

// tierPrice returns the tier name and flat monthly price in TZS.
// 1 unit = free (1 month only), 2-10 = 20,000, 11-25 = 35,000, 26-50 = 50,000, 51+ = 75,000.
func tierPrice(unitCount int) (tier string, price float64) {
	switch {
	case unitCount <= 1:
		return "free", 0
	case unitCount <= 10:
		return "starter", 20000
	case unitCount <= 25:
		return "growth", 35000
	case unitCount <= 50:
		return "professional", 50000
	default:
		return "enterprise", 75000
	}
}

const subSelectFields = `id, landlord_id, tier, unit_count, price_tzs, status,
	trial_ends_at, current_period_start, current_period_end, grace_ends_at,
	last_grace_email_day, created_at`

func scanSubscription(row interface{ Scan(dest ...any) error }) (models.Subscription, error) {
	var s models.Subscription
	err := row.Scan(
		&s.ID, &s.LandlordID, &s.Tier, &s.UnitCount, &s.PriceTZS, &s.Status,
		&s.TrialEndsAt, &s.CurrentPeriodStart, &s.CurrentPeriodEnd, &s.GraceEndsAt,
		&s.LastGraceEmailDay, &s.CreatedAt,
	)
	return s, err
}

// GetMine returns the landlord's subscription with lifecycle transitions applied.
func (h *SubscriptionHandler) GetMine(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	ctx := context.Background()

	// Count units
	var unitCount int
	h.DB.QueryRow(ctx, `
		SELECT COUNT(*) FROM units u JOIN properties p ON p.id = u.property_id WHERE p.owner_id=$1
	`, landlordID).Scan(&unitCount)

	tier, price := tierPrice(unitCount)

	// Fetch or create subscription
	sub, err := h.getOrCreateSubscription(ctx, landlordID, tier, unitCount, price)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}

	// Update tier/price if unit count changed
	if sub.Tier != tier || sub.UnitCount != unitCount {
		h.DB.Exec(ctx, `UPDATE subscriptions SET tier=$1, unit_count=$2, price_tzs=$3, updated_at=now() WHERE id=$4`,
			tier, unitCount, price, sub.ID)
		sub.Tier, sub.UnitCount, sub.PriceTZS = tier, unitCount, price
	}

	// Apply lifecycle transitions
	now := time.Now()
	sub = h.applyTransitions(ctx, sub, now)

	// Fetch payment history
	payments := h.fetchPayments(ctx, sub.ID)

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"subscription": sub,
		"payments":     payments,
	})
}

func (h *SubscriptionHandler) getOrCreateSubscription(ctx context.Context, landlordID, tier string, unitCount int, price float64) (models.Subscription, error) {
	row := h.DB.QueryRow(ctx, `SELECT `+subSelectFields+` FROM subscriptions WHERE landlord_id=$1`, landlordID)
	sub, err := scanSubscription(row)

	if err == pgx.ErrNoRows {
		// New landlord — start trial
		trialEnd := time.Now().Add(14 * 24 * time.Hour)
		row = h.DB.QueryRow(ctx, `
			INSERT INTO subscriptions (landlord_id, tier, unit_count, price_tzs, status, trial_ends_at)
			VALUES ($1,$2,$3,$4,'trial',$5)
			RETURNING `+subSelectFields,
			landlordID, tier, unitCount, price, trialEnd,
		)
		sub, err = scanSubscription(row)
	}

	return sub, err
}

// applyTransitions checks trial/active/grace expiry and transitions status.
func (h *SubscriptionHandler) applyTransitions(ctx context.Context, sub models.Subscription, now time.Time) models.Subscription {
	switch sub.Status {
	case "trial":
		if sub.TrialEndsAt != nil && now.After(*sub.TrialEndsAt) {
			// Trial expired — check if 1 unit free month applies
			if sub.UnitCount <= 1 {
				// 1 unit gets 1 free month, then must pay
				freeEnd := sub.TrialEndsAt.Add(30 * 24 * time.Hour)
				if now.After(freeEnd) {
					// Free month also expired — grace
					graceEnd := freeEnd.Add(5 * 24 * time.Hour)
					h.DB.Exec(ctx, `UPDATE subscriptions SET status='grace', grace_ends_at=$1, updated_at=now() WHERE id=$2`,
						graceEnd, sub.ID)
					sub.Status = "grace"
					sub.GraceEndsAt = &graceEnd
				} else {
					// Still in free month — mark active
					h.DB.Exec(ctx, `UPDATE subscriptions SET status='active', current_period_start=$1, current_period_end=$2, updated_at=now() WHERE id=$3`,
						sub.TrialEndsAt, freeEnd, sub.ID)
					sub.Status = "active"
					sub.CurrentPeriodStart = sub.TrialEndsAt
					sub.CurrentPeriodEnd = &freeEnd
				}
			} else {
				// >1 unit: trial expired → grace
				graceEnd := sub.TrialEndsAt.Add(5 * 24 * time.Hour)
				h.DB.Exec(ctx, `UPDATE subscriptions SET status='grace', grace_ends_at=$1, updated_at=now() WHERE id=$2`,
					graceEnd, sub.ID)
				sub.Status = "grace"
				sub.GraceEndsAt = &graceEnd
			}
		}

	case "active":
		if sub.CurrentPeriodEnd != nil && now.After(*sub.CurrentPeriodEnd) {
			// Active period expired → grace
			graceEnd := sub.CurrentPeriodEnd.Add(5 * 24 * time.Hour)
			h.DB.Exec(ctx, `UPDATE subscriptions SET status='grace', grace_ends_at=$1, updated_at=now() WHERE id=$2`,
				graceEnd, sub.ID)
			sub.Status = "grace"
			sub.GraceEndsAt = &graceEnd
		}

	case "grace":
		if sub.GraceEndsAt != nil && now.After(*sub.GraceEndsAt) {
			// Grace period expired → expired
			h.DB.Exec(ctx, `UPDATE subscriptions SET status='expired', updated_at=now() WHERE id=$1`, sub.ID)
			sub.Status = "expired"
		} else if sub.GraceEndsAt != nil {
			// Send daily grace emails
			h.sendGraceEmail(ctx, sub, now)
		}
	}

	return sub
}

func (h *SubscriptionHandler) sendGraceEmail(ctx context.Context, sub models.Subscription, now time.Time) {
	if h.Email == nil || sub.GraceEndsAt == nil {
		return
	}

	graceStart := sub.GraceEndsAt.Add(-5 * 24 * time.Hour)
	daysSinceGraceStart := int(now.Sub(graceStart).Hours()/24) + 1
	if daysSinceGraceStart < 1 {
		daysSinceGraceStart = 1
	}
	if daysSinceGraceStart > 5 {
		daysSinceGraceStart = 5
	}

	if daysSinceGraceStart <= sub.LastGraceEmailDay {
		return // Already sent for this day
	}

	// Get landlord email and name
	var userEmail *string
	var fullName string
	h.DB.QueryRow(ctx, `SELECT email, full_name FROM users WHERE id=$1`, sub.LandlordID).Scan(&userEmail, &fullName)

	if userEmail != nil && *userEmail != "" {
		err := h.Email.SendSubscriptionReminder(*userEmail, fullName, daysSinceGraceStart, sub.Tier, sub.PriceTZS)
		if err != nil {
			log.Printf("failed to send grace email day %d for %s: %v", daysSinceGraceStart, sub.LandlordID, err)
		}
	}

	h.DB.Exec(ctx, `UPDATE subscriptions SET last_grace_email_day=$1 WHERE id=$2`, daysSinceGraceStart, sub.ID)
}

// Pay initiates a Snippe mobile money payment for the current month.
func (h *SubscriptionHandler) Pay(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	ctx := context.Background()

	if h.Snippe == nil {
		httpx.Error(w, http.StatusServiceUnavailable, "payment service not configured")
		return
	}

	var req struct {
		PhoneNumber string `json:"phone_number"`
	}
	if err := httpx.Decode(r, &req); err != nil || req.PhoneNumber == "" {
		httpx.Error(w, http.StatusBadRequest, "phone_number is required")
		return
	}

	// Get subscription
	row := h.DB.QueryRow(ctx, `SELECT `+subSelectFields+` FROM subscriptions WHERE landlord_id=$1`, landlordID)
	sub, err := scanSubscription(row)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "no subscription found")
		return
	}

	if sub.PriceTZS <= 0 {
		httpx.Error(w, http.StatusBadRequest, "no payment required for free tier")
		return
	}

	// Calculate period
	periodStart := time.Now()
	periodEnd := periodStart.Add(30 * 24 * time.Hour)

	idempotencyKey := generateIdempotencyKey()

	// Create payment record
	var sp models.SubscriptionPayment
	err = h.DB.QueryRow(ctx, `
		INSERT INTO subscription_payments (subscription_id, amount, currency, phone_number, idempotency_key, period_start, period_end)
		VALUES ($1,$2,'TZS',$3,$4,$5,$6)
		RETURNING id, subscription_id, snippe_reference, amount, currency, phone_number, status, idempotency_key, period_start, period_end, paid_at, created_at
	`, sub.ID, sub.PriceTZS, req.PhoneNumber, idempotencyKey, periodStart, periodEnd).Scan(
		&sp.ID, &sp.SubscriptionID, &sp.SnippeReference, &sp.Amount, &sp.Currency,
		&sp.PhoneNumber, &sp.Status, &sp.IdempotencyKey, &sp.PeriodStart, &sp.PeriodEnd,
		&sp.PaidAt, &sp.CreatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create payment record: "+err.Error())
		return
	}

	// Initiate Snippe payment
	snippeResp, err := h.Snippe.CreatePayment(payment.CreatePaymentRequest{
		Amount:         sub.PriceTZS,
		Currency:       "TZS",
		PhoneNumber:    req.PhoneNumber,
		IdempotencyKey: idempotencyKey,
		CallbackURL:    h.BaseURL + "/api/webhooks/snippe",
		Description:    fmt.Sprintf("Nyumba Yangu %s subscription", sub.Tier),
	})
	if err != nil {
		// Mark payment as failed
		h.DB.Exec(ctx, `UPDATE subscription_payments SET status='failed' WHERE id=$1`, sp.ID)
		httpx.Error(w, http.StatusBadGateway, "payment initiation failed: "+err.Error())
		return
	}

	// Update payment with Snippe reference
	h.DB.Exec(ctx, `UPDATE subscription_payments SET snippe_reference=$1 WHERE id=$2`, snippeResp.Reference, sp.ID)
	sp.SnippeReference = &snippeResp.Reference

	httpx.JSON(w, http.StatusCreated, sp)
}

// PaymentHistory returns past subscription payments.
func (h *SubscriptionHandler) PaymentHistory(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	ctx := context.Background()

	// Get subscription ID
	var subID string
	err := h.DB.QueryRow(ctx, `SELECT id FROM subscriptions WHERE landlord_id=$1`, landlordID).Scan(&subID)
	if err != nil {
		httpx.JSON(w, http.StatusOK, []models.SubscriptionPayment{})
		return
	}

	payments := h.fetchPayments(ctx, subID)
	httpx.JSON(w, http.StatusOK, payments)
}

func (h *SubscriptionHandler) fetchPayments(ctx context.Context, subID string) []models.SubscriptionPayment {
	rows, err := h.DB.Query(ctx, `
		SELECT id, subscription_id, snippe_reference, amount, currency, phone_number, status,
			idempotency_key, period_start, period_end, paid_at, created_at
		FROM subscription_payments
		WHERE subscription_id=$1
		ORDER BY created_at DESC
	`, subID)
	if err != nil {
		return []models.SubscriptionPayment{}
	}
	defer rows.Close()

	payments := []models.SubscriptionPayment{}
	for rows.Next() {
		var p models.SubscriptionPayment
		if err := rows.Scan(
			&p.ID, &p.SubscriptionID, &p.SnippeReference, &p.Amount, &p.Currency,
			&p.PhoneNumber, &p.Status, &p.IdempotencyKey, &p.PeriodStart, &p.PeriodEnd,
			&p.PaidAt, &p.CreatedAt,
		); err != nil {
			continue
		}
		payments = append(payments, p)
	}
	return payments
}

func generateIdempotencyKey() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
