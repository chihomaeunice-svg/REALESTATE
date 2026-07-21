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

type PropertyHandler struct {
	DB *pgxpool.Pool
}

type propertyRequest struct {
	Title           string   `json:"title"`
	Description     *string  `json:"description"`
	PropertyType    string   `json:"property_type"`
	District        string   `json:"district"`
	Ward            string   `json:"ward"`
	AddressLine     *string  `json:"address_line"`
	City            *string  `json:"city"`
	Latitude        *float64 `json:"latitude"`
	Longitude       *float64 `json:"longitude"`
	LandSizeAcres   *float64 `json:"land_size_acres"`
	TitleDeedStatus *string  `json:"title_deed_status"`
}

func (h *PropertyHandler) Create(w http.ResponseWriter, r *http.Request) {
	ownerID := middleware.UserID(r)
	var req propertyRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Title == "" || req.PropertyType == "" || req.District == "" || req.Ward == "" {
		httpx.Error(w, http.StatusBadRequest, "title, property_type, district, and ward are required")
		return
	}
	city := "Dar es Salaam"
	if req.City != nil && *req.City != "" {
		city = *req.City
	}

	var p models.Property
	err := h.DB.QueryRow(context.Background(), `
		INSERT INTO properties (owner_id, title, description, property_type, district, ward, address_line, city, latitude, longitude, land_size_acres, title_deed_status, verification)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending')
		RETURNING id, owner_id, title, description, property_type, district, ward, address_line, city, latitude, longitude, land_size_acres, title_deed_status, verification, created_at
	`, ownerID, req.Title, req.Description, req.PropertyType, req.District, req.Ward, req.AddressLine, city, req.Latitude, req.Longitude, req.LandSizeAcres, req.TitleDeedStatus).Scan(
		&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.District, &p.Ward, &p.AddressLine, &p.City, &p.Latitude, &p.Longitude, &p.LandSizeAcres, &p.TitleDeedStatus, &p.Verification, &p.CreatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create property: "+err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, p)
}

const propertySelectFields = `id, owner_id, title, description, property_type, district, ward, address_line, city, latitude, longitude, land_size_acres, title_deed_status, verification, created_at`

func scanProperty(row interface{ Scan(dest ...any) error }) (models.Property, error) {
	var p models.Property
	err := row.Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.District, &p.Ward, &p.AddressLine, &p.City, &p.Latitude, &p.Longitude, &p.LandSizeAcres, &p.TitleDeedStatus, &p.Verification, &p.CreatedAt)
	return p, err
}

func (h *PropertyHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	ownerID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT `+propertySelectFields+`
		FROM properties WHERE owner_id=$1 ORDER BY created_at DESC
	`, ownerID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	properties := []models.Property{}
	for rows.Next() {
		p, err := scanProperty(rows)
		if err != nil {
			continue
		}
		properties = append(properties, p)
	}
	httpx.JSON(w, http.StatusOK, properties)
}

func (h *PropertyHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	row := h.DB.QueryRow(context.Background(), `SELECT `+propertySelectFields+` FROM properties WHERE id=$1`, id)
	p, err := scanProperty(row)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "property not found")
		return
	}
	httpx.JSON(w, http.StatusOK, p)
}

// --- Units nested under a property ---

type unitRequest struct {
	UnitLabel  string   `json:"unit_label"`
	Bedrooms   int      `json:"bedrooms"`
	Bathrooms  int      `json:"bathrooms"`
	SizeSqm    *float64 `json:"size_sqm"`
	RentAmount float64  `json:"rent_amount"`
}

func (h *PropertyHandler) CreateUnit(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "id")
	var req unitRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.UnitLabel == "" || req.RentAmount <= 0 {
		httpx.Error(w, http.StatusBadRequest, "unit_label and rent_amount are required")
		return
	}

	var u models.Unit
	err := h.DB.QueryRow(context.Background(), `
		INSERT INTO units (property_id, unit_label, bedrooms, bathrooms, size_sqm, rent_amount)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, property_id, unit_label, bedrooms, bathrooms, size_sqm, rent_amount, status, created_at
	`, propertyID, req.UnitLabel, req.Bedrooms, req.Bathrooms, req.SizeSqm, req.RentAmount).Scan(
		&u.ID, &u.PropertyID, &u.UnitLabel, &u.Bedrooms, &u.Bathrooms, &u.SizeSqm, &u.RentAmount, &u.Status, &u.CreatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create unit: "+err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, u)
}

func (h *PropertyHandler) ListUnits(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "id")
	rows, err := h.DB.Query(context.Background(), `
		SELECT id, property_id, unit_label, bedrooms, bathrooms, size_sqm, rent_amount, status, created_at
		FROM units WHERE property_id=$1 ORDER BY created_at DESC
	`, propertyID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	units := []models.Unit{}
	for rows.Next() {
		var u models.Unit
		if err := rows.Scan(&u.ID, &u.PropertyID, &u.UnitLabel, &u.Bedrooms, &u.Bathrooms, &u.SizeSqm, &u.RentAmount, &u.Status, &u.CreatedAt); err != nil {
			continue
		}
		units = append(units, u)
	}
	httpx.JSON(w, http.StatusOK, units)
}

// ListAllUnitsForLandlord returns every unit across all of a landlord's properties (for lease creation dropdowns).
func (h *PropertyHandler) ListAllUnitsForLandlord(w http.ResponseWriter, r *http.Request) {
	ownerID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT u.id, u.property_id, u.unit_label, u.bedrooms, u.bathrooms, u.size_sqm, u.rent_amount, u.status, u.created_at,
		       p.title
		FROM units u JOIN properties p ON p.id = u.property_id
		WHERE p.owner_id=$1 ORDER BY u.created_at DESC
	`, ownerID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	type unitWithProperty struct {
		models.Unit
		PropertyTitle string `json:"property_title"`
	}
	units := []unitWithProperty{}
	for rows.Next() {
		var u unitWithProperty
		if err := rows.Scan(&u.ID, &u.PropertyID, &u.UnitLabel, &u.Bedrooms, &u.Bathrooms, &u.SizeSqm, &u.RentAmount, &u.Status, &u.CreatedAt, &u.PropertyTitle); err != nil {
			continue
		}
		units = append(units, u)
	}
	httpx.JSON(w, http.StatusOK, units)
}
