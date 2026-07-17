package handlers

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/httpx"
	"realestate-backend/internal/middleware"
	"realestate-backend/internal/models"
)

type SubscriptionHandler struct {
	DB *pgxpool.Pool
}

// pricePerUnit implements the tiered TZS-per-unit-per-month pricing from the spec:
// 1 unit is free to seed adoption, 1-5 and 6-20 and 21+ step down per-unit price.
func pricePerUnit(unitCount int) (tier string, perUnit float64) {
	switch {
	case unitCount <= 1:
		return "free", 0
	case unitCount <= 5:
		return "starter", 10000
	case unitCount <= 20:
		return "growth", 8000
	default:
		return "scale", 6000
	}
}

func (h *SubscriptionHandler) GetMine(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	ctx := context.Background()

	var unitCount int
	h.DB.QueryRow(ctx, `
		SELECT COUNT(*) FROM units u JOIN properties p ON p.id = u.property_id WHERE p.owner_id=$1
	`, landlordID).Scan(&unitCount)

	tier, perUnit := pricePerUnit(unitCount)
	price := perUnit * float64(unitCount)

	var sub models.Subscription
	err := h.DB.QueryRow(ctx, `
		SELECT id, landlord_id, tier, unit_count, price_tzs, created_at FROM subscriptions WHERE landlord_id=$1
	`, landlordID).Scan(&sub.ID, &sub.LandlordID, &sub.Tier, &sub.UnitCount, &sub.PriceTZS, &sub.CreatedAt)

	if err == pgx.ErrNoRows {
		err = h.DB.QueryRow(ctx, `
			INSERT INTO subscriptions (landlord_id, tier, unit_count, price_tzs) VALUES ($1,$2,$3,$4)
			RETURNING id, landlord_id, tier, unit_count, price_tzs, created_at
		`, landlordID, tier, unitCount, price).Scan(&sub.ID, &sub.LandlordID, &sub.Tier, &sub.UnitCount, &sub.PriceTZS, &sub.CreatedAt)
	} else if err == nil && (sub.Tier != tier || sub.UnitCount != unitCount) {
		h.DB.Exec(ctx, `UPDATE subscriptions SET tier=$1, unit_count=$2, price_tzs=$3, updated_at=now() WHERE landlord_id=$4`, tier, unitCount, price, landlordID)
		sub.Tier, sub.UnitCount, sub.PriceTZS = tier, unitCount, price
	}

	if err != nil && err != pgx.ErrNoRows {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}

	httpx.JSON(w, http.StatusOK, sub)
}
