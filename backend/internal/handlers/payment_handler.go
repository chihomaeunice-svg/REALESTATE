package handlers

import (
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/httpx"
	"realestate-backend/internal/middleware"
	"realestate-backend/internal/models"
)

type PaymentHandler struct {
	DB *pgxpool.Pool
}

func (h *PaymentHandler) ListSchedulesForLease(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "id")
	if !canAccessLease(h.DB, leaseID, middleware.UserID(r), middleware.Role(r)) {
		httpx.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	rows, err := h.DB.Query(context.Background(), `
		SELECT id, lease_id, period_start, period_end, amount_due, due_date, status, created_at
		FROM payment_schedules WHERE lease_id=$1 ORDER BY due_date ASC, period_start ASC
	`, leaseID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	schedules := []models.PaymentSchedule{}
	for rows.Next() {
		var s models.PaymentSchedule
		if err := rows.Scan(&s.ID, &s.LeaseID, &s.PeriodStart, &s.PeriodEnd, &s.AmountDue, &s.DueDate, &s.Status, &s.CreatedAt); err != nil {
			continue
		}
		schedules = append(schedules, s)
	}
	httpx.JSON(w, http.StatusOK, schedules)
}

func (h *PaymentHandler) ListPaymentsForLease(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "id")
	if !canAccessLease(h.DB, leaseID, middleware.UserID(r), middleware.Role(r)) {
		httpx.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	rows, err := h.DB.Query(context.Background(), `
		SELECT id, lease_id, schedule_id, amount, method, mpesa_receipt, phone_number, status, paid_at, created_at
		FROM payments WHERE lease_id=$1 ORDER BY created_at DESC
	`, leaseID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	payments := []models.Payment{}
	for rows.Next() {
		var p models.Payment
		if err := rows.Scan(&p.ID, &p.LeaseID, &p.ScheduleID, &p.Amount, &p.Method, &p.MpesaReceipt, &p.PhoneNumber, &p.Status, &p.PaidAt, &p.CreatedAt); err != nil {
			continue
		}
		payments = append(payments, p)
	}
	httpx.JSON(w, http.StatusOK, payments)
}

type manualPaymentRequest struct {
	LeaseID    string  `json:"lease_id"`
	ScheduleID *string `json:"schedule_id"`
	Amount     float64 `json:"amount"`
}

// LogManual records a cash/bank payment entered directly by the landlord.
func (h *PaymentHandler) LogManual(w http.ResponseWriter, r *http.Request) {
	var req manualPaymentRequest
	if err := httpx.Decode(r, &req); err != nil || req.LeaseID == "" || req.Amount <= 0 {
		httpx.Error(w, http.StatusBadRequest, "lease_id and amount are required")
		return
	}
	if !canAccessLease(h.DB, req.LeaseID, middleware.UserID(r), middleware.Role(r)) {
		httpx.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	payment, err := recordPayment(h.DB, req.LeaseID, req.ScheduleID, req.Amount, "cash", nil, nil)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not record payment: "+err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, payment)
}

type stkPushRequest struct {
	LeaseID     string  `json:"lease_id"`
	ScheduleID  *string `json:"schedule_id"`
	Amount      float64 `json:"amount"`
	PhoneNumber string  `json:"phone_number"`
}

// StkPush simulates a Vodacom M-Pesa (or aggregator) STK push: the tenant's
// phone would normally receive a PIN prompt; here we complete the payment
// synchronously so the prototype is demoable without real telco sandbox access.
// Swap this handler's body for a real call to the chosen aggregator (Selcom/
// ClickPesa/AzamPay) — the request/response contract below matches what those
// aggregators expect (phone, amount, account reference) and callback shape.
func (h *PaymentHandler) StkPush(w http.ResponseWriter, r *http.Request) {
	var req stkPushRequest
	if err := httpx.Decode(r, &req); err != nil || req.LeaseID == "" || req.Amount <= 0 || req.PhoneNumber == "" {
		httpx.Error(w, http.StatusBadRequest, "lease_id, amount, and phone_number are required")
		return
	}
	if !canAccessLease(h.DB, req.LeaseID, middleware.UserID(r), middleware.Role(r)) {
		httpx.Error(w, http.StatusForbidden, "forbidden")
		return
	}

	receipt := mockMpesaReceipt()
	payment, err := recordPayment(h.DB, req.LeaseID, req.ScheduleID, req.Amount, "mpesa", &receipt, &req.PhoneNumber)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not process payment: "+err.Error())
		return
	}

	logSMS(h.DB, req.PhoneNumber, fmt.Sprintf(
		"Umepokea risiti ya malipo ya kodi TZS %.0f. Nambari ya muamala: %s. Asante. / Rent payment of TZS %.0f received. Receipt: %s. Thank you.",
		req.Amount, receipt, req.Amount, receipt,
	))

	httpx.JSON(w, http.StatusCreated, map[string]interface{}{
		"payment":      payment,
		"mpesa_receipt": receipt,
		"message":      "STK push simulated and confirmed (sandbox mode)",
	})
}

func recordPayment(db *pgxpool.Pool, leaseID string, scheduleID *string, amount float64, method string, receipt, phone *string) (models.Payment, error) {
	ctx := context.Background()
	tx, err := db.Begin(ctx)
	if err != nil {
		return models.Payment{}, err
	}
	defer tx.Rollback(ctx)

	var p models.Payment
	err = tx.QueryRow(ctx, `
		INSERT INTO payments (lease_id, schedule_id, amount, method, mpesa_receipt, phone_number, status, paid_at)
		VALUES ($1,$2,$3,$4,$5,$6,'completed', now())
		RETURNING id, lease_id, schedule_id, amount, method, mpesa_receipt, phone_number, status, paid_at, created_at
	`, leaseID, scheduleID, amount, method, receipt, phone).Scan(
		&p.ID, &p.LeaseID, &p.ScheduleID, &p.Amount, &p.Method, &p.MpesaReceipt, &p.PhoneNumber, &p.Status, &p.PaidAt, &p.CreatedAt,
	)
	if err != nil {
		return models.Payment{}, err
	}

	if scheduleID != nil {
		if _, err = tx.Exec(ctx, `UPDATE payment_schedules SET status='paid' WHERE id=$1`, *scheduleID); err != nil {
			return models.Payment{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return models.Payment{}, err
	}
	return p, nil
}

func mockMpesaReceipt() string {
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	rnd := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, 3)
	for i := range b {
		b[i] = letters[rnd.Intn(len(letters))]
	}
	return fmt.Sprintf("%s%d", string(b), 1000000+rnd.Intn(8999999))
}

func logSMS(db *pgxpool.Pool, phone, message string) {
	db.Exec(context.Background(), `INSERT INTO sms_logs (recipient_phone, message) VALUES ($1,$2)`, phone, message)
}

// ArrearsForLandlord lists overdue schedules across all of a landlord's leases.
func (h *PaymentHandler) ArrearsForLandlord(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	_, err := h.DB.Exec(context.Background(), `
		UPDATE payment_schedules SET status='overdue'
		WHERE status='pending' AND due_date < CURRENT_DATE
		AND lease_id IN (SELECT id FROM leases WHERE landlord_id=$1)
	`, landlordID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}

	rows, err := h.DB.Query(context.Background(), `
		SELECT ps.id, ps.lease_id, ps.period_start, ps.period_end, ps.amount_due, ps.due_date, ps.status, ps.created_at,
		       t.full_name, t.phone, u.unit_label, p.title
		FROM payment_schedules ps
		JOIN leases l ON l.id = ps.lease_id
		JOIN tenants t ON t.id = l.tenant_id
		JOIN units u ON u.id = l.unit_id
		JOIN properties p ON p.id = u.property_id
		WHERE l.landlord_id = $1 AND ps.status = 'overdue'
		ORDER BY ps.due_date ASC
	`, landlordID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error: "+err.Error())
		return
	}
	defer rows.Close()

	type arrearsView struct {
		models.PaymentSchedule
		TenantName    string `json:"tenant_name"`
		TenantPhone   string `json:"tenant_phone"`
		UnitLabel     string `json:"unit_label"`
		PropertyTitle string `json:"property_title"`
	}
	out := []arrearsView{}
	for rows.Next() {
		var a arrearsView
		if err := rows.Scan(&a.ID, &a.LeaseID, &a.PeriodStart, &a.PeriodEnd, &a.AmountDue, &a.DueDate, &a.Status, &a.CreatedAt,
			&a.TenantName, &a.TenantPhone, &a.UnitLabel, &a.PropertyTitle); err != nil {
			continue
		}
		out = append(out, a)
	}
	httpx.JSON(w, http.StatusOK, out)
}
