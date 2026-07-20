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

type FavoriteHandler struct {
	DB *pgxpool.Pool
}

// List returns the full listing objects the logged-in user has saved, most recent first.
func (h *FavoriteHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT `+listingSelectFields+`
		FROM favorites f
		JOIN listings l ON l.id = f.listing_id
		JOIN properties p ON p.id = l.property_id
		LEFT JOIN units u ON u.id = l.unit_id
		WHERE f.user_id = $1
		ORDER BY f.created_at DESC
	`, userID)
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

type favoriteRequest struct {
	ListingID string `json:"listing_id"`
}

func (h *FavoriteHandler) Add(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	var req favoriteRequest
	if err := httpx.Decode(r, &req); err != nil || req.ListingID == "" {
		httpx.Error(w, http.StatusBadRequest, "listing_id is required")
		return
	}
	_, err := h.DB.Exec(context.Background(), `
		INSERT INTO favorites (user_id, listing_id) VALUES ($1,$2)
		ON CONFLICT (user_id, listing_id) DO NOTHING
	`, userID, req.ListingID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not save favorite: "+err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]string{"status": "saved"})
}

func (h *FavoriteHandler) Remove(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	listingID := chi.URLParam(r, "listingID")
	_, err := h.DB.Exec(context.Background(), `DELETE FROM favorites WHERE user_id=$1 AND listing_id=$2`, userID, listingID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not remove favorite")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

// IDs returns just the listing IDs the user has saved, for cheap client-side "is this saved?" checks.
func (h *FavoriteHandler) IDs(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `SELECT listing_id FROM favorites WHERE user_id=$1`, userID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	ids := []string{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		ids = append(ids, id)
	}
	httpx.JSON(w, http.StatusOK, ids)
}

// SyncRequest lets the frontend merge an anonymous localStorage wishlist into
// the account the moment a user logs in, so nothing gets lost across the login boundary.
type syncFavoritesRequest struct {
	ListingIDs []string `json:"listing_ids"`
}

func (h *FavoriteHandler) Sync(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	var req syncFavoritesRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	ctx := context.Background()
	for _, listingID := range req.ListingIDs {
		h.DB.Exec(ctx, `
			INSERT INTO favorites (user_id, listing_id) VALUES ($1,$2)
			ON CONFLICT (user_id, listing_id) DO NOTHING
		`, userID, listingID)
	}
	h.IDs(w, r)
}
