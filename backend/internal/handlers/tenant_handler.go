package handlers

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/httpx"
	"realestate-backend/internal/middleware"
	"realestate-backend/internal/models"
)

type TenantHandler struct {
	DB *pgxpool.Pool
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
		var t models.Tenant
		if err := rows.Scan(&t.ID, &t.UserID, &t.FullName, &t.Phone, &t.Email, &t.NidaNumber, &t.EmergencyContact, &t.CreatedAt); err != nil {
			continue
		}
		tenants = append(tenants, t)
	}
	httpx.JSON(w, http.StatusOK, tenants)
}

func (h *TenantHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var t models.Tenant
	err := h.DB.QueryRow(context.Background(), `
		SELECT id, user_id, full_name, phone, email, nida_number, emergency_contact, created_at
		FROM tenants WHERE id=$1
	`, id).Scan(&t.ID, &t.UserID, &t.FullName, &t.Phone, &t.Email, &t.NidaNumber, &t.EmergencyContact, &t.CreatedAt)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "tenant not found")
		return
	}
	httpx.JSON(w, http.StatusOK, t)
}

// GetForTenantUser resolves the tenant record linked to the logged-in tenant user account.
func (h *TenantHandler) GetForTenantUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	var t models.Tenant
	err := h.DB.QueryRow(context.Background(), `
		SELECT id, user_id, full_name, phone, email, nida_number, emergency_contact, created_at
		FROM tenants WHERE user_id=$1
	`, userID).Scan(&t.ID, &t.UserID, &t.FullName, &t.Phone, &t.Email, &t.NidaNumber, &t.EmergencyContact, &t.CreatedAt)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "no tenant record linked to this account yet")
		return
	}
	httpx.JSON(w, http.StatusOK, t)
}
