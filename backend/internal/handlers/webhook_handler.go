package handlers

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/email"
	"realestate-backend/internal/httpx"
	"realestate-backend/internal/payment"
)

type WebhookHandler struct {
	DB     *pgxpool.Pool
	Snippe *payment.SnippeClient
	Email  *email.Client
}

type snippeWebhookPayload struct {
	Event string `json:"event"`
	Data  struct {
		Reference string `json:"reference"`
		Status    string `json:"status"`
	} `json:"data"`
}

// SnippeWebhook handles POST /api/webhooks/snippe.
func (h *WebhookHandler) SnippeWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "could not read body")
		return
	}

	// Verify HMAC signature
	signature := r.Header.Get("X-Snippe-Signature")
	if h.Snippe != nil && !h.Snippe.VerifyWebhookSignature(body, signature) {
		httpx.Error(w, http.StatusUnauthorized, "invalid signature")
		return
	}

	var payload snippeWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if payload.Event == "payment.completed" {
		h.handlePaymentCompleted(payload.Data.Reference)
	}

	httpx.JSON(w, http.StatusOK, map[string]bool{"received": true})
}

func (h *WebhookHandler) handlePaymentCompleted(reference string) {
	ctx := context.Background()
	now := time.Now()

	// Find the payment by Snippe reference
	var paymentID, subID string
	var periodStart, periodEnd time.Time
	err := h.DB.QueryRow(ctx, `
		SELECT id, subscription_id, period_start, period_end
		FROM subscription_payments
		WHERE snippe_reference=$1 AND status='pending'
	`, reference).Scan(&paymentID, &subID, &periodStart, &periodEnd)
	if err != nil {
		log.Printf("webhook: payment not found for reference %s: %v", reference, err)
		return
	}

	// Mark payment as completed
	h.DB.Exec(ctx, `UPDATE subscription_payments SET status='completed', paid_at=$1 WHERE id=$2`, now, paymentID)

	// Activate subscription
	h.DB.Exec(ctx, `
		UPDATE subscriptions
		SET status='active', current_period_start=$1, current_period_end=$2,
			grace_ends_at=NULL, last_grace_email_day=0, updated_at=now()
		WHERE id=$3
	`, now, now.Add(30*24*time.Hour), subID)

	// Send activation email
	if h.Email != nil {
		var landlordID string
		var tier string
		h.DB.QueryRow(ctx, `SELECT landlord_id, tier FROM subscriptions WHERE id=$1`, subID).Scan(&landlordID, &tier)

		var userEmail *string
		var fullName string
		h.DB.QueryRow(ctx, `SELECT email, full_name FROM users WHERE id=$1`, landlordID).Scan(&userEmail, &fullName)

		if userEmail != nil && *userEmail != "" {
			endDate := now.Add(30 * 24 * time.Hour).Format("2 Jan 2006")
			if err := h.Email.SendSubscriptionActivated(*userEmail, fullName, tier, endDate); err != nil {
				log.Printf("failed to send activation email for %s: %v", landlordID, err)
			}
		}
	}
}
