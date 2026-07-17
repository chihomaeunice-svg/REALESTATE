package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/httpx"
	"realestate-backend/internal/middleware"
	"realestate-backend/internal/models"
)

type LeaseHandler struct {
	DB *pgxpool.Pool
}

type leaseTenantInput struct {
	FullName         string  `json:"full_name"`
	Phone            string  `json:"phone"`
	Email            *string `json:"email"`
	NidaNumber       *string `json:"nida_number"`
	EmergencyContact *string `json:"emergency_contact"`
}

type leaseRequest struct {
	UnitID        string            `json:"unit_id"`
	Tenant        leaseTenantInput  `json:"tenant"`
	Language      string            `json:"language"`
	StartDate     string            `json:"start_date"`
	RentAmount    float64           `json:"rent_amount"`
	AdvanceMonths int               `json:"advance_months"`
	DepositAmount float64           `json:"deposit_amount"`
	TermMonths    int               `json:"term_months"`
}

func (h *LeaseHandler) Create(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	var req leaseRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.UnitID == "" || req.Tenant.FullName == "" || req.Tenant.Phone == "" || req.RentAmount <= 0 || req.StartDate == "" {
		httpx.Error(w, http.StatusBadRequest, "unit_id, tenant details, rent_amount, and start_date are required")
		return
	}
	if req.Language != "en" {
		req.Language = "sw"
	}
	if req.AdvanceMonths <= 0 {
		req.AdvanceMonths = 6
	}
	if req.TermMonths <= 0 {
		req.TermMonths = 12
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "start_date must be YYYY-MM-DD")
		return
	}
	endDate := startDate.AddDate(0, req.TermMonths, 0)

	ctx := context.Background()
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer tx.Rollback(ctx)

	// Find-or-create the tenant record, linking an existing tenant user account by phone if one exists.
	var tenantID string
	err = tx.QueryRow(ctx, `SELECT id FROM tenants WHERE phone=$1`, req.Tenant.Phone).Scan(&tenantID)
	if err != nil {
		var linkedUserID *string
		var uid string
		lookupErr := tx.QueryRow(ctx, `SELECT id FROM users WHERE phone=$1 AND role='tenant'`, req.Tenant.Phone).Scan(&uid)
		if lookupErr == nil {
			linkedUserID = &uid
		}
		err = tx.QueryRow(ctx, `
			INSERT INTO tenants (user_id, full_name, phone, email, nida_number, emergency_contact)
			VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
		`, linkedUserID, req.Tenant.FullName, req.Tenant.Phone, req.Tenant.Email, req.Tenant.NidaNumber, req.Tenant.EmergencyContact).Scan(&tenantID)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not create tenant: "+err.Error())
			return
		}
	}

	var lease models.Lease
	err = tx.QueryRow(ctx, `
		INSERT INTO leases (unit_id, tenant_id, landlord_id, language, start_date, end_date, rent_amount, advance_months, deposit_amount, status, landlord_signed_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft', now())
		RETURNING id, unit_id, tenant_id, landlord_id, language, start_date, end_date, rent_amount, advance_months, deposit_amount, status, landlord_signed_at, created_at
	`, req.UnitID, tenantID, landlordID, req.Language, startDate, endDate, req.RentAmount, req.AdvanceMonths, req.DepositAmount).Scan(
		&lease.ID, &lease.UnitID, &lease.TenantID, &lease.LandlordID, &lease.Language, &lease.StartDate, &lease.EndDate,
		&lease.RentAmount, &lease.AdvanceMonths, &lease.DepositAmount, &lease.Status, &lease.LandlordSignedAt, &lease.CreatedAt,
	)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create lease: "+err.Error())
		return
	}

	// Generate the payment schedule: the first `advance_months` periods are bundled into
	// one upfront due date (the Tanzanian advance-rent norm), then rebill every advance block.
	cursor := startDate
	for month := 0; month < req.TermMonths; month++ {
		periodStart := cursor
		periodEnd := cursor.AddDate(0, 1, 0)
		blockIndex := month / req.AdvanceMonths
		dueDate := startDate.AddDate(0, blockIndex*req.AdvanceMonths, 0)
		_, err = tx.Exec(ctx, `
			INSERT INTO payment_schedules (lease_id, period_start, period_end, amount_due, due_date, status)
			VALUES ($1,$2,$3,$4,$5,'pending')
		`, lease.ID, periodStart, periodEnd, req.RentAmount, dueDate)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not create schedule: "+err.Error())
			return
		}
		cursor = periodEnd
	}

	if _, err = tx.Exec(ctx, `UPDATE units SET status='occupied' WHERE id=$1`, req.UnitID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update unit status")
		return
	}

	if err := tx.Commit(ctx); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not finalize lease")
		return
	}

	httpx.JSON(w, http.StatusCreated, lease)
}

func (h *LeaseHandler) ListForLandlord(w http.ResponseWriter, r *http.Request) {
	landlordID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT l.id, l.unit_id, l.tenant_id, l.landlord_id, l.language, l.start_date, l.end_date, l.rent_amount,
		       l.advance_months, l.deposit_amount, l.status, l.tenant_signature_name, l.tenant_signed_at,
		       l.tenant_signature_ip, l.landlord_signed_at, l.created_at,
		       t.full_name, u.unit_label, p.title
		FROM leases l
		JOIN tenants t ON t.id = l.tenant_id
		JOIN units u ON u.id = l.unit_id
		JOIN properties p ON p.id = u.property_id
		WHERE l.landlord_id = $1
		ORDER BY l.created_at DESC
	`, landlordID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error: "+err.Error())
		return
	}
	defer rows.Close()

	type leaseView struct {
		models.Lease
		TenantName    string `json:"tenant_name"`
		UnitLabel     string `json:"unit_label"`
		PropertyTitle string `json:"property_title"`
	}
	leases := []leaseView{}
	for rows.Next() {
		var lv leaseView
		if err := rows.Scan(
			&lv.ID, &lv.UnitID, &lv.TenantID, &lv.LandlordID, &lv.Language, &lv.StartDate, &lv.EndDate, &lv.RentAmount,
			&lv.AdvanceMonths, &lv.DepositAmount, &lv.Status, &lv.TenantSignatureName, &lv.TenantSignedAt,
			&lv.TenantSignatureIP, &lv.LandlordSignedAt, &lv.CreatedAt,
			&lv.TenantName, &lv.UnitLabel, &lv.PropertyTitle,
		); err != nil {
			continue
		}
		leases = append(leases, lv)
	}
	httpx.JSON(w, http.StatusOK, leases)
}

// ListForTenant returns leases belonging to the tenant record linked to the logged-in user.
func (h *LeaseHandler) ListForTenant(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	rows, err := h.DB.Query(context.Background(), `
		SELECT l.id, l.unit_id, l.tenant_id, l.landlord_id, l.language, l.start_date, l.end_date, l.rent_amount,
		       l.advance_months, l.deposit_amount, l.status, l.tenant_signature_name, l.tenant_signed_at,
		       l.tenant_signature_ip, l.landlord_signed_at, l.created_at,
		       u.unit_label, p.title, p.district, p.ward
		FROM leases l
		JOIN tenants t ON t.id = l.tenant_id
		JOIN units u ON u.id = l.unit_id
		JOIN properties p ON p.id = u.property_id
		WHERE t.user_id = $1
		ORDER BY l.created_at DESC
	`, userID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	type leaseView struct {
		models.Lease
		UnitLabel     string `json:"unit_label"`
		PropertyTitle string `json:"property_title"`
		District      string `json:"district"`
		Ward          string `json:"ward"`
	}
	leases := []leaseView{}
	for rows.Next() {
		var lv leaseView
		if err := rows.Scan(
			&lv.ID, &lv.UnitID, &lv.TenantID, &lv.LandlordID, &lv.Language, &lv.StartDate, &lv.EndDate, &lv.RentAmount,
			&lv.AdvanceMonths, &lv.DepositAmount, &lv.Status, &lv.TenantSignatureName, &lv.TenantSignedAt,
			&lv.TenantSignatureIP, &lv.LandlordSignedAt, &lv.CreatedAt,
			&lv.UnitLabel, &lv.PropertyTitle, &lv.District, &lv.Ward,
		); err != nil {
			continue
		}
		leases = append(leases, lv)
	}
	httpx.JSON(w, http.StatusOK, leases)
}

type signRequest struct {
	SignatureName string `json:"signature_name"`
}

func (h *LeaseHandler) Sign(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !canAccessLease(h.DB, id, middleware.UserID(r), middleware.Role(r)) {
		httpx.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	var req signRequest
	if err := httpx.Decode(r, &req); err != nil || req.SignatureName == "" {
		httpx.Error(w, http.StatusBadRequest, "signature_name is required")
		return
	}
	ip := r.RemoteAddr

	_, err := h.DB.Exec(context.Background(), `
		UPDATE leases SET tenant_signature_name=$1, tenant_signed_at=now(), tenant_signature_ip=$2, status='active'
		WHERE id=$3
	`, req.SignatureName, ip, id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not sign lease")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "signed"})
}

// Document renders the bilingual lease template with an audit trail footer as HTML,
// suitable for the browser's print-to-PDF. This is the "signed-PDF-plus-audit-trail"
// approach called for in the spec rather than a formally certified e-signature.
func (h *LeaseHandler) Document(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !canAccessLease(h.DB, id, middleware.UserID(r), middleware.Role(r)) {
		httpx.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	ctx := context.Background()

	var lease models.Lease
	var tenantName, tenantPhone, unitLabel, propertyTitle, district, ward, landlordName string
	err := h.DB.QueryRow(ctx, `
		SELECT l.id, l.language, l.start_date, l.end_date, l.rent_amount, l.advance_months, l.deposit_amount,
		       l.status, l.tenant_signature_name, l.tenant_signed_at, l.tenant_signature_ip, l.landlord_signed_at,
		       t.full_name, t.phone, u.unit_label, p.title, p.district, p.ward, lo.full_name
		FROM leases l
		JOIN tenants t ON t.id = l.tenant_id
		JOIN units u ON u.id = l.unit_id
		JOIN properties p ON p.id = u.property_id
		JOIN users lo ON lo.id = l.landlord_id
		WHERE l.id = $1
	`, id).Scan(
		&lease.ID, &lease.Language, &lease.StartDate, &lease.EndDate, &lease.RentAmount, &lease.AdvanceMonths, &lease.DepositAmount,
		&lease.Status, &lease.TenantSignatureName, &lease.TenantSignedAt, &lease.TenantSignatureIP, &lease.LandlordSignedAt,
		&tenantName, &tenantPhone, &unitLabel, &propertyTitle, &district, &ward, &landlordName,
	)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "lease not found")
		return
	}

	html := renderLeaseHTML(lease, tenantName, tenantPhone, unitLabel, propertyTitle, district, ward, landlordName)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(html))
}

func renderLeaseHTML(l models.Lease, tenantName, tenantPhone, unitLabel, propertyTitle, district, ward, landlordName string) string {
	signed := "Not yet signed / Bado haijasainiwa"
	if l.TenantSignedAt != nil {
		ipVal := ""
		if l.TenantSignatureIP != nil {
			ipVal = *l.TenantSignatureIP
		}
		nameVal := ""
		if l.TenantSignatureName != nil {
			nameVal = *l.TenantSignatureName
		}
		signed = fmt.Sprintf("Signed electronically by %s at %s (IP: %s)", nameVal, l.TenantSignedAt.Format(time.RFC1123), ipVal)
	}
	landlordSignedStr := "not yet"
	if l.LandlordSignedAt != nil {
		landlordSignedStr = l.LandlordSignedAt.Format(time.RFC1123)
	}

	title := "LEASE AGREEMENT / MKATABA WA UPANGAJI"
	body := fmt.Sprintf(`
		<p><strong>Property / Mali:</strong> %s, %s Ward, %s District</p>
		<p><strong>Unit / Kitengo:</strong> %s</p>
		<p><strong>Landlord / Mwenye Nyumba:</strong> %s</p>
		<p><strong>Tenant / Mpangaji:</strong> %s (%s)</p>
		<p><strong>Term / Muda:</strong> %s to %s</p>
		<p><strong>Monthly Rent / Kodi ya Mwezi:</strong> TZS %.0f</p>
		<p><strong>Advance Payment Terms / Malipo ya Awali:</strong> %d months paid in advance, as is customary. Deposit / Amana: TZS %.0f</p>
		<h3>Terms / Masharti</h3>
		<ol>
			<li>The tenant agrees to pay rent in advance in blocks of %d months. / Mpangaji anakubali kulipa kodi mapema kwa vipindi vya miezi %d.</li>
			<li>The tenant shall maintain the property in good condition. / Mpangaji atatunza mali katika hali nzuri.</li>
			<li>Either party may terminate with 30 days written notice after the term. / Upande wowote unaweza kusitisha mkataba kwa taarifa ya siku 30 baada ya muda kuisha.</li>
			<li>Disputes shall be resolved per the laws of the United Republic of Tanzania. / Migogoro itatatuliwa kwa mujibu wa sheria za Jamhuri ya Muungano wa Tanzania.</li>
		</ol>
		<h3>Audit Trail / Ushahidi wa Kielektroniki</h3>
		<p>Landlord countersigned at creation: %v</p>
		<p>%s</p>
	`, propertyTitle, ward, district, unitLabel, landlordName, tenantName, tenantPhone,
		l.StartDate.Format("2 Jan 2006"), l.EndDate.Format("2 Jan 2006"), l.RentAmount, l.AdvanceMonths, l.DepositAmount,
		l.AdvanceMonths, l.AdvanceMonths, landlordSignedStr, signed)

	return fmt.Sprintf(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>%s</title>
		<style>body{font-family: Georgia, serif; max-width: 720px; margin: 40px auto; line-height: 1.6; color:#1a1a1a}
		h1{font-size:1.4rem; text-align:center} h3{margin-top:2rem; border-top:1px solid #ccc; padding-top:1rem}</style>
		</head><body><h1>%s</h1>%s</body></html>`, title, title, body)
}
