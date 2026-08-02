package handlers

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/auth"
	"realestate-backend/internal/email"
	"realestate-backend/internal/httpx"
	"realestate-backend/internal/models"
)

type AuthHandler struct {
	DB        *pgxpool.Pool
	JWTSecret string
	Email     *email.Client
}

type registerRequest struct {
	Phone           string  `json:"phone"`
	Email           *string `json:"email"`
	Password        string  `json:"password"`
	FullName        string  `json:"full_name"`
	Role            string  `json:"role"`
	NidaNumber      *string `json:"nida_number"`
	BusinessLicense *string `json:"business_license"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Phone == "" || req.Password == "" || req.FullName == "" {
		httpx.Error(w, http.StatusBadRequest, "phone, password, and full_name are required")
		return
	}
	if req.Role == "" {
		req.Role = "landlord"
	}
	if req.Role != "landlord" && req.Role != "tenant" && req.Role != "agent" {
		httpx.Error(w, http.StatusBadRequest, "invalid role")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not process password")
		return
	}

	var user models.User
	err = h.DB.QueryRow(context.Background(), `
		INSERT INTO users (phone, email, password_hash, full_name, role, nida_number, business_license)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, phone, email, full_name, role, nida_number, business_license, verification, created_at
	`, req.Phone, req.Email, hash, req.FullName, req.Role, req.NidaNumber, req.BusinessLicense).Scan(
		&user.ID, &user.Phone, &user.Email, &user.FullName, &user.Role,
		&user.NidaNumber, &user.BusinessLicense, &user.Verification, &user.CreatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusConflict, "phone or email already registered")
		return
	}

	// Landlords/agents start in "pending" verification once they submit ID docs;
	// tenants don't need lister verification.
	if req.Role == "landlord" || req.Role == "agent" {
		if req.NidaNumber != nil || req.BusinessLicense != nil {
			h.DB.Exec(context.Background(), `UPDATE users SET verification='pending' WHERE id=$1`, user.ID)
			user.Verification = "pending"
		}
	}

	if req.Role == "tenant" {
		// Link this account to any tenant record a landlord already created from an inquiry/lease.
		h.DB.Exec(context.Background(), `UPDATE tenants SET user_id=$1 WHERE phone=$2 AND user_id IS NULL`, user.ID, user.Phone)
	}

	token, err := auth.GenerateToken(h.JWTSecret, user.ID, user.Role)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not generate token")
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]interface{}{"token": token, "user": user})
}

type loginRequest struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}

	var user models.User
	err := h.DB.QueryRow(context.Background(), `
		SELECT id, phone, email, password_hash, full_name, role, nida_number, business_license, verification, created_at
		FROM users WHERE phone=$1
	`, req.Phone).Scan(
		&user.ID, &user.Phone, &user.Email, &user.PasswordHash, &user.FullName, &user.Role,
		&user.NidaNumber, &user.BusinessLicense, &user.Verification, &user.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}

	if !auth.CheckPassword(user.PasswordHash, req.Password) {
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := auth.GenerateToken(h.JWTSecret, user.ID, user.Role)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not generate token")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{"token": token, "user": user})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request, userID string) {
	var user models.User
	err := h.DB.QueryRow(context.Background(), `
		SELECT id, phone, email, full_name, role, nida_number, business_license, verification, created_at
		FROM users WHERE id=$1
	`, userID).Scan(
		&user.ID, &user.Phone, &user.Email, &user.FullName, &user.Role,
		&user.NidaNumber, &user.BusinessLicense, &user.Verification, &user.CreatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "user not found")
		return
	}
	httpx.JSON(w, http.StatusOK, user)
}

// --- OTP Email Login ---

type otpSendRequest struct {
	Email string `json:"email"`
}

// generateOTP returns a cryptographically random 6-digit code.
func generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// SendOTP handles POST /api/auth/otp/send.
// Generates a 6-digit code, stores it in DB, and sends it via Resend.
// If the email doesn't have an account yet, one is created automatically.
func (h *AuthHandler) SendOTP(w http.ResponseWriter, r *http.Request) {
	var req otpSendRequest
	if err := httpx.Decode(r, &req); err != nil || req.Email == "" {
		httpx.Error(w, http.StatusBadRequest, "email is required")
		return
	}

	if h.Email == nil {
		httpx.Error(w, http.StatusServiceUnavailable, "email service not configured")
		return
	}

	code, err := generateOTP()
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not generate code")
		return
	}

	ctx := context.Background()
	expiresAt := time.Now().Add(10 * time.Minute)

	// Invalidate any unused codes for this email.
	h.DB.Exec(ctx, `UPDATE otp_codes SET used = true WHERE email = $1 AND used = false`, req.Email)

	// Store new code.
	_, err = h.DB.Exec(ctx, `
		INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)
	`, req.Email, code, expiresAt)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not store code")
		return
	}

	// Send email.
	if err := h.Email.SendOTP(req.Email, code); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not send email: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "code sent"})
}

type otpVerifyRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

// VerifyOTP handles POST /api/auth/otp/verify.
// Checks the code, finds or creates the user, and returns a JWT.
func (h *AuthHandler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req otpVerifyRequest
	if err := httpx.Decode(r, &req); err != nil || req.Email == "" || req.Code == "" {
		httpx.Error(w, http.StatusBadRequest, "email and code are required")
		return
	}

	ctx := context.Background()

	// Find a valid, unused code.
	var otpID string
	err := h.DB.QueryRow(ctx, `
		SELECT id FROM otp_codes
		WHERE email = $1 AND code = $2 AND used = false AND expires_at > now()
		ORDER BY created_at DESC LIMIT 1
	`, req.Email, req.Code).Scan(&otpID)
	if err != nil {
		httpx.Error(w, http.StatusUnauthorized, "invalid or expired code")
		return
	}

	// Mark code as used.
	h.DB.Exec(ctx, `UPDATE otp_codes SET used = true WHERE id = $1`, otpID)

	// Find or create user by email.
	var user models.User
	err = h.DB.QueryRow(ctx, `
		SELECT id, phone, email, full_name, role, nida_number, business_license, verification, created_at
		FROM users WHERE email = $1
	`, req.Email).Scan(
		&user.ID, &user.Phone, &user.Email, &user.FullName, &user.Role,
		&user.NidaNumber, &user.BusinessLicense, &user.Verification, &user.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		// Auto-create account from email — user can fill in profile later.
		err = h.DB.QueryRow(ctx, `
			INSERT INTO users (email, full_name, role)
			VALUES ($1, '', 'landlord')
			RETURNING id, phone, email, full_name, role, nida_number, business_license, verification, created_at
		`, req.Email).Scan(
			&user.ID, &user.Phone, &user.Email, &user.FullName, &user.Role,
			&user.NidaNumber, &user.BusinessLicense, &user.Verification, &user.CreatedAt,
		)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not create account")
			return
		}
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}

	token, err := auth.GenerateToken(h.JWTSecret, user.ID, user.Role)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not generate token")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{"token": token, "user": user})
}
