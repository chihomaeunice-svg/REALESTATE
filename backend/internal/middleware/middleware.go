package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/auth"
)

type ctxKey string

const (
	ctxUserID ctxKey = "user_id"
	ctxRole   ctxKey = "role"
)

func Auth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" || !strings.HasPrefix(header, "Bearer ") {
				http.Error(w, `{"error":"missing authorization"}`, http.StatusUnauthorized)
				return
			}
			tokenStr := strings.TrimPrefix(header, "Bearer ")
			claims, err := auth.ParseToken(secret, tokenStr)
			if err != nil {
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), ctxUserID, claims.UserID)
			ctx = context.WithValue(ctx, ctxRole, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool)
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(ctxRole).(string)
			if !allowed[role] {
				http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func UserID(r *http.Request) string {
	v, _ := r.Context().Value(ctxUserID).(string)
	return v
}

func Role(r *http.Request) string {
	v, _ := r.Context().Value(ctxRole).(string)
	return v
}

// RequireActiveSubscription blocks landlords whose subscription is in grace or expired status.
// Returns HTTP 402 Payment Required so the frontend can show the payment prompt.
func RequireActiveSubscription(db *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := UserID(r)
			role := Role(r)

			// Only enforce for landlords/agents
			if role != "landlord" && role != "agent" {
				next.ServeHTTP(w, r)
				return
			}

			var status string
			err := db.QueryRow(r.Context(),
				`SELECT status FROM subscriptions WHERE landlord_id=$1`, userID,
			).Scan(&status)

			if err != nil {
				// No subscription record — treat as needing payment
				http.Error(w, `{"error":"subscription required"}`, http.StatusPaymentRequired)
				return
			}

			if status == "trial" || status == "active" {
				next.ServeHTTP(w, r)
				return
			}

			http.Error(w, `{"error":"subscription expired, please renew"}`, http.StatusPaymentRequired)
		})
	}
}
