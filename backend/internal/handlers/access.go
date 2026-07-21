package handlers

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// canAccessLease reports whether the given user may view/act on a lease:
// the landlord who owns it, the tenant it belongs to, or an admin.
func canAccessLease(db *pgxpool.Pool, leaseID, userID, role string) bool {
	if role == "admin" {
		return true
	}
	ctx := context.Background()
	if role == "landlord" {
		var count int
		db.QueryRow(ctx, `SELECT COUNT(*) FROM leases WHERE id=$1 AND landlord_id=$2`, leaseID, userID).Scan(&count)
		return count > 0
	}
	if role == "tenant" {
		var count int
		db.QueryRow(ctx, `
			SELECT COUNT(*) FROM leases l JOIN tenants t ON t.id = l.tenant_id
			WHERE l.id=$1 AND t.user_id=$2
		`, leaseID, userID).Scan(&count)
		return count > 0
	}
	return false
}
