package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/httpx"
	"realestate-backend/internal/middleware"
	"realestate-backend/internal/models"
)

type ListingHandler struct {
	DB *pgxpool.Pool
}

type listingRequest struct {
	PropertyID  string   `json:"property_id"`
	UnitID      *string  `json:"unit_id"`
	Purpose     string   `json:"purpose"`
	Title       string   `json:"title"`
	Description *string  `json:"description"`
	Price       float64  `json:"price"`
	PricePeriod *string  `json:"price_period"`
	ContactPhone string  `json:"contact_phone"`
	Images      []string `json:"images"`
}

func (h *ListingHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req listingRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.PropertyID == "" || req.Title == "" || req.Price <= 0 || req.ContactPhone == "" {
		httpx.Error(w, http.StatusBadRequest, "property_id, title, price, and contact_phone are required")
		return
	}
	purpose := req.Purpose
	if purpose == "" {
		purpose = "rent"
	}
	period := "month"
	if req.PricePeriod != nil && *req.PricePeriod != "" {
		period = *req.PricePeriod
	}

	ctx := context.Background()
	var l models.Listing
	err := h.DB.QueryRow(ctx, `
		INSERT INTO listings (property_id, unit_id, purpose, title, description, price, price_period, contact_phone)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		RETURNING id, property_id, unit_id, purpose, title, description, price, price_period, status, contact_phone, view_count, created_at
	`, req.PropertyID, req.UnitID, purpose, req.Title, req.Description, req.Price, period, req.ContactPhone).Scan(
		&l.ID, &l.PropertyID, &l.UnitID, &l.Purpose, &l.Title, &l.Description, &l.Price, &l.PricePeriod, &l.Status, &l.ContactPhone, &l.ViewCount, &l.CreatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create listing: "+err.Error())
		return
	}

	for i, url := range req.Images {
		h.DB.Exec(ctx, `INSERT INTO listing_images (listing_id, url, sort_order) VALUES ($1,$2,$3)`, l.ID, url, i)
	}
	l.Images = req.Images

	httpx.JSON(w, http.StatusCreated, l)
}

const listingSelectFields = `
	l.id, l.property_id, l.unit_id, l.purpose, l.title, l.description, l.price, l.price_period,
	l.status, l.contact_phone, l.view_count, l.created_at,
	p.district, p.ward, p.city, p.property_type, p.verification,
	u.bedrooms, u.bathrooms
`

func scanListing(row interface{ Scan(dest ...any) error }) (models.Listing, error) {
	var l models.Listing
	var bedrooms, bathrooms *int
	err := row.Scan(
		&l.ID, &l.PropertyID, &l.UnitID, &l.Purpose, &l.Title, &l.Description, &l.Price, &l.PricePeriod,
		&l.Status, &l.ContactPhone, &l.ViewCount, &l.CreatedAt,
		&l.District, &l.Ward, &l.City, &l.PropertyType, &l.Verification,
		&bedrooms, &bathrooms,
	)
	if bedrooms != nil {
		l.Bedrooms = *bedrooms
	}
	if bathrooms != nil {
		l.Bathrooms = *bathrooms
	}
	return l, err
}

// Browse is the public, unauthenticated marketplace search endpoint.
func (h *ListingHandler) Browse(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	district := q.Get("district")
	ward := q.Get("ward")
	propertyType := q.Get("property_type")
	purpose := q.Get("purpose")
	minPrice, _ := strconv.ParseFloat(q.Get("min_price"), 64)
	maxPrice, _ := strconv.ParseFloat(q.Get("max_price"), 64)

	query := `
		SELECT ` + listingSelectFields + `
		FROM listings l JOIN properties p ON p.id = l.property_id LEFT JOIN units u ON u.id = l.unit_id
		WHERE l.status = 'active'
	`
	args := []interface{}{}
	argN := 1
	if district != "" {
		query += ` AND p.district ILIKE $` + itoa(argN)
		args = append(args, district)
		argN++
	}
	if ward != "" {
		query += ` AND p.ward ILIKE $` + itoa(argN)
		args = append(args, ward)
		argN++
	}
	if propertyType != "" {
		query += ` AND p.property_type = $` + itoa(argN)
		args = append(args, propertyType)
		argN++
	}
	if purpose != "" {
		query += ` AND l.purpose = $` + itoa(argN)
		args = append(args, purpose)
		argN++
	}
	if minPrice > 0 {
		query += ` AND l.price >= $` + itoa(argN)
		args = append(args, minPrice)
		argN++
	}
	if maxPrice > 0 {
		query += ` AND l.price <= $` + itoa(argN)
		args = append(args, maxPrice)
		argN++
	}
	query += ` ORDER BY l.created_at DESC LIMIT 100`

	rows, err := h.DB.Query(context.Background(), query, args...)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error: "+err.Error())
		return
	}
	defer rows.Close()

	listings := []models.Listing{}
	ids := []string{}
	byID := map[string]*models.Listing{}
	for rows.Next() {
		l, err := scanListing(rows)
		if err != nil {
			continue
		}
		listings = append(listings, l)
		ids = append(ids, l.ID)
	}
	for i := range listings {
		byID[listings[i].ID] = &listings[i]
	}
	attachImages(h.DB, ids, byID)

	httpx.JSON(w, http.StatusOK, listings)
}

func (h *ListingHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	row := h.DB.QueryRow(context.Background(), `
		SELECT `+listingSelectFields+`
		FROM listings l JOIN properties p ON p.id = l.property_id LEFT JOIN units u ON u.id = l.unit_id
		WHERE l.id=$1
	`, id)
	l, err := scanListing(row)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "listing not found")
		return
	}
	byID := map[string]*models.Listing{l.ID: &l}
	attachImages(h.DB, []string{l.ID}, byID)

	h.DB.Exec(context.Background(), `UPDATE listings SET view_count = view_count + 1 WHERE id=$1`, id)

	httpx.JSON(w, http.StatusOK, l)
}

func attachImages(db *pgxpool.Pool, ids []string, byID map[string]*models.Listing) {
	if len(ids) == 0 {
		return
	}
	rows, err := db.Query(context.Background(), `
		SELECT listing_id, url FROM listing_images WHERE listing_id = ANY($1) ORDER BY sort_order
	`, ids)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var listingID, url string
		if err := rows.Scan(&listingID, &url); err != nil {
			continue
		}
		if l, ok := byID[listingID]; ok {
			l.Images = append(l.Images, url)
		}
	}
}

func itoa(n int) string {
	return strconv.Itoa(n)
}

// --- Inquiries: a seeker contacts a lister, seeding the Layer 2 tenant record ---

type inquiryRequest struct {
	SeekerName  string  `json:"seeker_name"`
	SeekerPhone string  `json:"seeker_phone"`
	Message     *string `json:"message"`
}

func (h *ListingHandler) CreateInquiry(w http.ResponseWriter, r *http.Request) {
	listingID := chi.URLParam(r, "id")
	var req inquiryRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.SeekerName == "" || req.SeekerPhone == "" {
		httpx.Error(w, http.StatusBadRequest, "seeker_name and seeker_phone are required")
		return
	}

	var inq models.Inquiry
	err := h.DB.QueryRow(context.Background(), `
		INSERT INTO inquiries (listing_id, seeker_name, seeker_phone, message)
		VALUES ($1,$2,$3,$4)
		RETURNING id, listing_id, seeker_name, seeker_phone, message, status, created_at
	`, listingID, req.SeekerName, req.SeekerPhone, req.Message).Scan(
		&inq.ID, &inq.ListingID, &inq.SeekerName, &inq.SeekerPhone, &inq.Message, &inq.Status, &inq.CreatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create inquiry: "+err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, inq)
}

// ListInquiriesForLandlord shows inquiries across all listings the landlord owns.
func (h *ListingHandler) ListInquiriesForLandlord(w http.ResponseWriter, r *http.Request) {
	ownerID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT i.id, i.listing_id, i.seeker_name, i.seeker_phone, i.message, i.status, i.created_at, l.title
		FROM inquiries i
		JOIN listings l ON l.id = i.listing_id
		JOIN properties p ON p.id = l.property_id
		WHERE p.owner_id = $1
		ORDER BY i.created_at DESC
	`, ownerID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	type inquiryWithListing struct {
		models.Inquiry
		ListingTitle string `json:"listing_title"`
	}
	out := []inquiryWithListing{}
	for rows.Next() {
		var i inquiryWithListing
		if err := rows.Scan(&i.ID, &i.ListingID, &i.SeekerName, &i.SeekerPhone, &i.Message, &i.Status, &i.CreatedAt, &i.ListingTitle); err != nil {
			continue
		}
		out = append(out, i)
	}
	httpx.JSON(w, http.StatusOK, out)
}
