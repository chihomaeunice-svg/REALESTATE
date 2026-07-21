package handlers

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/httpx"
	"realestate-backend/internal/middleware"
	"realestate-backend/internal/models"
)

type TenantHandler struct {
	DB *pgxpool.Pool
}

const tenantSelectFields = `id, user_id, full_name, phone, email, nida_number, emergency_contact, created_at`

func scanTenant(row interface{ Scan(dest ...any) error }) (models.Tenant, error) {
	var t models.Tenant
	err := row.Scan(&t.ID, &t.UserID, &t.FullName, &t.Phone, &t.Email, &t.NidaNumber, &t.EmergencyContact, &t.CreatedAt)
	return t, err
}

// ListForLandlord returns every tenant with an active/past lease under this landlord.
func (h *TenantHandler) ListForLandlord(w http.ResponseWriter, r *http.Request) {
	ownerID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT DISTINCT t.id, t.user_id, t.full_name, t.phone, t.email, t.nida_number, t.emergency_contact, t.created_at
		FROM tenants t
		JOIN leases l ON l.tenant_id = t.id
		WHERE l.landlord_id = $1
		ORDER BY t.created_at DESC
	`, ownerID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	tenants := []models.Tenant{}
	for rows.Next() {
		t, err := scanTenant(rows)
		if err != nil {
			continue
		}
		tenants = append(tenants, t)
	}
	httpx.JSON(w, http.StatusOK, tenants)
}

func (h *TenantHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	row := h.DB.QueryRow(context.Background(), `SELECT `+tenantSelectFields+` FROM tenants WHERE id=$1`, id)
	t, err := scanTenant(row)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "tenant not found")
		return
	}
	httpx.JSON(w, http.StatusOK, t)
}

// GetForTenantUser resolves the tenant record linked to the logged-in tenant user account.
func (h *TenantHandler) GetForTenantUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	row := h.DB.QueryRow(context.Background(), `SELECT `+tenantSelectFields+` FROM tenants WHERE user_id=$1`, userID)
	t, err := scanTenant(row)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "no tenant record linked to this account yet")
		return
	}
	httpx.JSON(w, http.StatusOK, t)
}

type tenantProfileRequest struct {
	FullName         string  `json:"full_name"`
	Phone            string  `json:"phone"`
	Email            *string `json:"email"`
	NidaNumber       *string `json:"nida_number"`
	EmergencyContact *string `json:"emergency_contact"`
}

// UpsertMyProfile lets a tenant fill in their own record ahead of any lease —
// so when a landlord later drafts a lease for this phone number, LookupByPhone
// (and the lease-creation find-or-create) picks it up instead of the landlord
// re-entering everything from scratch.
func (h *TenantHandler) UpsertMyProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	var req tenantProfileRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.FullName == "" || req.Phone == "" {
		httpx.Error(w, http.StatusBadRequest, "full_name and phone are required")
		return
	}

	ctx := context.Background()

	var existingID string
	err := h.DB.QueryRow(ctx, `SELECT id FROM tenants WHERE user_id=$1`, userID).Scan(&existingID)
	if err == pgx.ErrNoRows {
		err = h.DB.QueryRow(ctx, `SELECT id FROM tenants WHERE phone=$1 AND user_id IS NULL`, req.Phone).Scan(&existingID)
	}

	var row interface{ Scan(dest ...any) error }
	if err == nil {
		row = h.DB.QueryRow(ctx, `
			UPDATE tenants SET user_id=$1, full_name=$2, phone=$3, email=$4, nida_number=$5, emergency_contact=$6
			WHERE id=$7
			RETURNING `+tenantSelectFields+`
		`, userID, req.FullName, req.Phone, req.Email, req.NidaNumber, req.EmergencyContact, existingID)
	} else {
		row = h.DB.QueryRow(ctx, `
			INSERT INTO tenants (user_id, full_name, phone, email, nida_number, emergency_contact)
			VALUES ($1,$2,$3,$4,$5,$6)
			RETURNING `+tenantSelectFields+`
		`, userID, req.FullName, req.Phone, req.Email, req.NidaNumber, req.EmergencyContact)
	}

	t, scanErr := scanTenant(row)
	if scanErr != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not save profile: "+scanErr.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, t)
}

// LookupByPhone lets a landlord check whether a prospective tenant already has
// a self-service profile before drafting a lease, so the form can pre-fill
// instead of asking the landlord to type details the tenant already gave.
func (h *TenantHandler) LookupByPhone(w http.ResponseWriter, r *http.Request) {
	phone := r.URL.Query().Get("phone")
	if phone == "" {
		httpx.Error(w, http.StatusBadRequest, "phone query parameter is required")
		return
	}
	row := h.DB.QueryRow(context.Background(), `SELECT `+tenantSelectFields+` FROM tenants WHERE phone=$1 LIMIT 1`, phone)
	t, err := scanTenant(row)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "no profile found for this phone number")
		return
	}
	httpx.JSON(w, http.StatusOK, t)
}
