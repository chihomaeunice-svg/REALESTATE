package handlers

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/httpx"
	"realestate-backend/internal/models"
)

type AdminHandler struct {
	DB *pgxpool.Pool
}

// PendingUsers lists landlords/agents awaiting manual identity verification
// (NIDA number or business license on file, not yet confirmed by an admin).
func (h *AdminHandler) PendingUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(context.Background(), `
		SELECT id, phone, email, full_name, role, nida_number, business_license, verification, created_at
		FROM users WHERE verification='pending' ORDER BY created_at ASC
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Phone, &u.Email, &u.FullName, &u.Role, &u.NidaNumber, &u.BusinessLicense, &u.Verification, &u.CreatedAt); err != nil {
			continue
		}
		users = append(users, u)
	}
	httpx.JSON(w, http.StatusOK, users)
}

func (h *AdminHandler) PendingProperties(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(context.Background(), `
		SELECT id, owner_id, title, description, property_type, district, ward, address_line, city, latitude, longitude, verification, created_at
		FROM properties WHERE verification='pending' ORDER BY created_at ASC
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	properties := []models.Property{}
	for rows.Next() {
		var p models.Property
		if err := rows.Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.District, &p.Ward, &p.AddressLine, &p.City, &p.Latitude, &p.Longitude, &p.Verification, &p.CreatedAt); err != nil {
			continue
		}
		properties = append(properties, p)
	}
	httpx.JSON(w, http.StatusOK, properties)
}

type verifyDecisionRequest struct {
	Approve bool    `json:"approve"`
	Note    *string `json:"note"`
}

func (h *AdminHandler) DecideUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req verifyDecisionRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	status := "rejected"
	if req.Approve {
		status = "verified"
	}
	_, err := h.DB.Exec(context.Background(), `UPDATE users SET verification=$1, verification_note=$2 WHERE id=$3`, status, req.Note, id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"status": status})
}

func (h *AdminHandler) DecideProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req verifyDecisionRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	status := "rejected"
	if req.Approve {
		status = "verified"
	}
	_, err := h.DB.Exec(context.Background(), `UPDATE properties SET verification=$1 WHERE id=$2`, status, id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"status": status})
}
