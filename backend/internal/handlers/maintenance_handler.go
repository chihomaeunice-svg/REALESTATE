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

type MaintenanceHandler struct {
	DB *pgxpool.Pool
}

// CreateForTenant lets a tenant submit a maintenance request for one of their leased units.
func (h *MaintenanceHandler) CreateForTenant(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	var req struct {
		UnitID      string  `json:"unit_id"`
		Title       string  `json:"title"`
		Description *string `json:"description"`
		Priority    string  `json:"priority"`
	}
	if err := httpx.Decode(r, &req); err != nil || req.UnitID == "" || req.Title == "" {
		httpx.Error(w, http.StatusBadRequest, "unit_id and title are required")
		return
	}
	priority := "medium"
	if req.Priority == "low" || req.Priority == "high" || req.Priority == "urgent" {
		priority = req.Priority
	}

	// Verify the tenant has an active lease on this unit.
	var count int
	h.DB.QueryRow(context.Background(), `
		SELECT COUNT(*) FROM leases l JOIN tenants t ON t.id = l.tenant_id
		WHERE l.unit_id=$1 AND t.user_id=$2 AND l.status IN ('draft','active')
	`, req.UnitID, userID).Scan(&count)
	if count == 0 {
		httpx.Error(w, http.StatusForbidden, "you do not have an active lease on this unit")
		return
	}

	var m models.MaintenanceRequest
	err := h.DB.QueryRow(context.Background(), `
		INSERT INTO maintenance_requests (unit_id, tenant_user_id, title, description, priority)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id, unit_id, tenant_user_id, title, description, priority, status, created_at, updated_at
	`, req.UnitID, userID, req.Title, req.Description, priority).Scan(
		&m.ID, &m.UnitID, &m.TenantUserID, &m.Title, &m.Description, &m.Priority, &m.Status, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create request: "+err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, m)
}

// ListForTenant returns all maintenance requests submitted by the authenticated tenant.
func (h *MaintenanceHandler) ListForTenant(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT mr.id, mr.unit_id, mr.tenant_user_id, mr.title, mr.description, mr.priority, mr.status, mr.created_at, mr.updated_at,
		       u.unit_label, p.title
		FROM maintenance_requests mr
		JOIN units u ON u.id = mr.unit_id
		JOIN properties p ON p.id = u.property_id
		WHERE mr.tenant_user_id=$1
		ORDER BY mr.created_at DESC
	`, userID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	requests := []models.MaintenanceRequest{}
	for rows.Next() {
		var m models.MaintenanceRequest
		if err := rows.Scan(&m.ID, &m.UnitID, &m.TenantUserID, &m.Title, &m.Description, &m.Priority, &m.Status, &m.CreatedAt, &m.UpdatedAt,
			&m.UnitLabel, &m.PropertyTitle); err != nil {
			continue
		}
		requests = append(requests, m)
	}
	httpx.JSON(w, http.StatusOK, requests)
}

// ListForLandlord returns all maintenance requests across a landlord's properties.
func (h *MaintenanceHandler) ListForLandlord(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT mr.id, mr.unit_id, mr.tenant_user_id, mr.title, mr.description, mr.priority, mr.status, mr.created_at, mr.updated_at,
		       u.unit_label, p.title, usr.full_name
		FROM maintenance_requests mr
		JOIN units u ON u.id = mr.unit_id
		JOIN properties p ON p.id = u.property_id
		JOIN users usr ON usr.id = mr.tenant_user_id
		WHERE p.owner_id=$1
		ORDER BY mr.created_at DESC
	`, userID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	requests := []models.MaintenanceRequest{}
	for rows.Next() {
		var m models.MaintenanceRequest
		if err := rows.Scan(&m.ID, &m.UnitID, &m.TenantUserID, &m.Title, &m.Description, &m.Priority, &m.Status, &m.CreatedAt, &m.UpdatedAt,
			&m.UnitLabel, &m.PropertyTitle, &m.TenantName); err != nil {
			continue
		}
		requests = append(requests, m)
	}
	httpx.JSON(w, http.StatusOK, requests)
}

// UpdateStatus lets a landlord update the status of a maintenance request on their property.
func (h *MaintenanceHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := middleware.UserID(r)
	var req struct {
		Status string `json:"status"`
	}
	if err := httpx.Decode(r, &req); err != nil || req.Status == "" {
		httpx.Error(w, http.StatusBadRequest, "status is required")
		return
	}

	var m models.MaintenanceRequest
	err := h.DB.QueryRow(context.Background(), `
		UPDATE maintenance_requests mr
		SET status=$1, updated_at=now()
		FROM units u JOIN properties p ON p.id = u.property_id
		WHERE mr.id=$2 AND mr.unit_id = u.id AND p.owner_id=$3
		RETURNING mr.id, mr.unit_id, mr.tenant_user_id, mr.title, mr.description, mr.priority, mr.status, mr.created_at, mr.updated_at
	`, req.Status, id, userID).Scan(
		&m.ID, &m.UnitID, &m.TenantUserID, &m.Title, &m.Description, &m.Priority, &m.Status, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "not found or not authorized")
		return
	}
	httpx.JSON(w, http.StatusOK, m)
}
