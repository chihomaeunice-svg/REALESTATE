package handlers

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/httpx"
	"realestate-backend/internal/middleware"
)

type ReportHandler struct {
	DB *pgxpool.Pool
}

type incomeSummary struct {
	TotalUnits       int     `json:"total_units"`
	OccupiedUnits    int     `json:"occupied_units"`
	VacantUnits      int     `json:"vacant_units"`
	ActiveLeases     int     `json:"active_leases"`
	CollectedThisYTD float64 `json:"collected_ytd"`
	OverdueAmount    float64 `json:"overdue_amount"`
	OverdueCount     int     `json:"overdue_count"`
}

type buildingIncome struct {
	PropertyID   string  `json:"property_id"`
	PropertyName string  `json:"property_name"`
	Collected    float64 `json:"collected"`
	Overdue      float64 `json:"overdue"`
	Units        int     `json:"units"`
}

func (h *ReportHandler) Summary(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	ctx := context.Background()
	var s incomeSummary

	h.DB.QueryRow(ctx, `
		SELECT COUNT(*), COUNT(*) FILTER (WHERE u.status='occupied')
		FROM units u JOIN properties p ON p.id = u.property_id WHERE p.owner_id = $1
	`, landlordID).Scan(&s.TotalUnits, &s.OccupiedUnits)
	s.VacantUnits = s.TotalUnits - s.OccupiedUnits

	h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM leases WHERE landlord_id=$1 AND status='active'`, landlordID).Scan(&s.ActiveLeases)

	h.DB.QueryRow(ctx, `
		SELECT COALESCE(SUM(pay.amount),0) FROM payments pay
		JOIN leases l ON l.id = pay.lease_id
		WHERE l.landlord_id=$1 AND pay.status='completed' AND date_part('year', pay.paid_at) = date_part('year', CURRENT_DATE)
	`, landlordID).Scan(&s.CollectedThisYTD)

	h.DB.QueryRow(ctx, `
		SELECT COALESCE(SUM(ps.amount_due),0), COUNT(*) FROM payment_schedules ps
		JOIN leases l ON l.id = ps.lease_id
		WHERE l.landlord_id=$1 AND ps.status IN ('overdue','pending') AND ps.due_date < CURRENT_DATE
	`, landlordID).Scan(&s.OverdueAmount, &s.OverdueCount)

	httpx.JSON(w, http.StatusOK, s)
}

func (h *ReportHandler) ByBuilding(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT p.id, p.title,
		       COALESCE((SELECT SUM(pay.amount) FROM payments pay
		                 JOIN leases l ON l.id = pay.lease_id JOIN units u2 ON u2.id = l.unit_id
		                 WHERE u2.property_id = p.id AND pay.status='completed'), 0) AS collected,
		       COALESCE((SELECT SUM(ps.amount_due) FROM payment_schedules ps
		                 JOIN leases l2 ON l2.id = ps.lease_id JOIN units u3 ON u3.id = l2.unit_id
		                 WHERE u3.property_id = p.id AND ps.status IN ('overdue','pending') AND ps.due_date < CURRENT_DATE), 0) AS overdue,
		       (SELECT COUNT(*) FROM units u4 WHERE u4.property_id = p.id) AS units
		FROM properties p
		WHERE p.owner_id = $1
		ORDER BY p.created_at DESC
	`, landlordID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error: "+err.Error())
		return
	}
	defer rows.Close()

	out := []buildingIncome{}
	for rows.Next() {
		var b buildingIncome
		if err := rows.Scan(&b.PropertyID, &b.PropertyName, &b.Collected, &b.Overdue, &b.Units); err != nil {
			continue
		}
		out = append(out, b)
	}
	httpx.JSON(w, http.StatusOK, out)
}
