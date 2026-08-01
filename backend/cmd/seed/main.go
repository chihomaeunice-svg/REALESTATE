// Seeds demo data for local development: an admin, three landlords with
// verified Dar es Salaam properties/listings, a tenant with an active lease
// and payment history, and one overdue schedule to populate the arrears view.
package main

import (
	"context"
	"log"
	"time"

	"realestate-backend/internal/auth"
	"realestate-backend/internal/config"
	"realestate-backend/internal/db"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	tables := []string{"payments", "payment_schedules", "leases", "tenants", "inquiries", "listing_images", "listings", "units", "properties", "subscriptions", "sms_logs", "users"}
	for _, t := range tables {
		if _, err := pool.Exec(ctx, "TRUNCATE TABLE "+t+" CASCADE"); err != nil {
			log.Fatalf("truncate %s: %v", t, err)
		}
	}

	hash := func(pw string) string {
		h, err := auth.HashPassword(pw)
		if err != nil {
			log.Fatal(err)
		}
		return h
	}

	// --- Admin ---
	var adminID string
	must(pool.QueryRow(ctx, `
		INSERT INTO users (phone, email, password_hash, full_name, role, verification)
		VALUES ('+255700000000','admin@nyumbayangu.co.tz',$1,'Platform Admin','admin','verified') RETURNING id
	`, hash("admin123")).Scan(&adminID))

	// --- Landlords ---
	type landlord struct {
		id, phone, name, nida string
	}
	landlords := []landlord{
		{phone: "+255712000001", name: "Amina Juma", nida: "19850312-00001-00001-45"},
		{phone: "+255712000002", name: "Elias Mwakalinga", nida: "19780925-00002-00002-12"},
		{phone: "+255712000003", name: "Grace Kileo", nida: "19900117-00003-00003-78"},
	}
	for i := range landlords {
		must(pool.QueryRow(ctx, `
			INSERT INTO users (phone, password_hash, full_name, role, nida_number, verification)
			VALUES ($1,$2,$3,'landlord',$4,'verified') RETURNING id
		`, landlords[i].phone, hash("password123"), landlords[i].name, landlords[i].nida).Scan(&landlords[i].id))
	}

	type unitSeed struct {
		label            string
		beds, baths      int
		size, rent       float64
		listImage        string
		acceptsMonthly   bool
	}
	type propertySeed struct {
		ownerIdx                int
		title, district, ward, ptype, addr string
		units                   []unitSeed
	}

	properties := []propertySeed{
		{
			ownerIdx: 0, title: "Mikocheni Green Apartments", district: "Kinondoni", ward: "Mikocheni", ptype: "apartment", addr: "Mikocheni B, off Mwai Kibaki Rd",
			units: []unitSeed{
				{"A1", 2, 2, 85, 550000, "https://picsum.photos/seed/mikocheni1/900/600", true},
				{"A2", 3, 2, 110, 750000, "https://picsum.photos/seed/mikocheni2/900/600", false},
			},
		},
		{
			ownerIdx: 0, title: "Msasani Peninsula House", district: "Kinondoni", ward: "Msasani", ptype: "house", addr: "Msasani Peninsula",
			units: []unitSeed{
				{"Main House", 4, 3, 220, 1800000, "https://picsum.photos/seed/msasani1/900/600", false},
			},
		},
		{
			ownerIdx: 1, title: "Upanga Riverside Flats", district: "Ilala", ward: "Upanga", ptype: "apartment", addr: "Upanga West, near Muhimbili",
			units: []unitSeed{
				{"B1", 1, 1, 45, 320000, "https://picsum.photos/seed/upanga1/900/600", true},
				{"B2", 2, 1, 65, 450000, "https://picsum.photos/seed/upanga2/900/600", true},
				{"B3", 2, 1, 65, 450000, "https://picsum.photos/seed/upanga3/900/600", false},
			},
		},
		{
			ownerIdx: 1, title: "Kariakoo Commercial Shop", district: "Ilala", ward: "Kariakoo", ptype: "shop", addr: "Kariakoo Market Street",
			units: []unitSeed{
				{"Shop 12", 0, 1, 30, 400000, "https://picsum.photos/seed/kariakoo1/900/600", false},
			},
		},
		{
			ownerIdx: 2, title: "Kigamboni Beachside Rooms", district: "Kigamboni", ward: "Kigamboni", ptype: "room", addr: "Kigamboni, near the ferry",
			units: []unitSeed{
				{"R1", 1, 1, 25, 180000, "https://picsum.photos/seed/kigamboni1/900/600", true},
				{"R2", 1, 1, 25, 180000, "https://picsum.photos/seed/kigamboni2/900/600", true},
			},
		},
		{
			ownerIdx: 2, title: "Ubungo Business Office", district: "Ubungo", ward: "Ubungo", ptype: "office", addr: "Ubungo, near the interchange",
			units: []unitSeed{
				{"Suite 3", 0, 2, 90, 900000, "https://picsum.photos/seed/ubungo1/900/600", false},
			},
		},
	}

	firstUnitID := ""
	firstLandlordID := landlords[0].id

	for _, ps := range properties {
		var propID string
		must(pool.QueryRow(ctx, `
			INSERT INTO properties (owner_id, title, description, property_type, district, ward, address_line, city, verification)
			VALUES ($1,$2,$3,$4,$5,$6,$7,'Dar es Salaam','verified') RETURNING id
		`, landlords[ps.ownerIdx].id, ps.title, "A well-maintained property in "+ps.ward+", "+ps.district+".", ps.ptype, ps.district, ps.ward, ps.addr).Scan(&propID))

		for _, u := range ps.units {
			var unitID string
			must(pool.QueryRow(ctx, `
				INSERT INTO units (property_id, unit_label, bedrooms, bathrooms, size_sqm, rent_amount)
				VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
			`, propID, u.label, u.beds, u.baths, u.size, u.rent).Scan(&unitID))
			if firstUnitID == "" && ps.ownerIdx == 0 {
				firstUnitID = unitID
			}

			var listingID string
			must(pool.QueryRow(ctx, `
				INSERT INTO listings (property_id, unit_id, purpose, title, description, price, price_period, contact_phone, accepts_monthly_rent, bedrooms, bathrooms)
				VALUES ($1,$2,'rent',$3,$4,$5,'month',$6,$7,$8,$9) RETURNING id
			`, propID, unitID, ps.title+" - "+u.label, "Spacious "+itoaSeed(u.beds)+" bedroom "+ps.ptype+" in "+ps.ward+".", u.rent, landlords[ps.ownerIdx].phone, u.acceptsMonthly, u.beds, u.baths).Scan(&listingID))

			must2(pool.Exec(ctx, `INSERT INTO listing_images (listing_id, url, sort_order) VALUES ($1,$2,0)`, listingID, u.listImage))
		}
	}

	// --- One property pending verification, to populate the admin queue ---
	var pendingPropID string
	must(pool.QueryRow(ctx, `
		INSERT INTO properties (owner_id, title, description, property_type, district, ward, city, verification)
		VALUES ($1,'Tegeta New Build','Recently completed, awaiting inspection.','house','Kinondoni','Tegeta','Dar es Salaam','pending') RETURNING id
	`, landlords[1].id).Scan(&pendingPropID))

	// --- A landlord awaiting identity verification ---
	must(pool.QueryRow(ctx, `
		INSERT INTO users (phone, password_hash, full_name, role, nida_number, verification)
		VALUES ('+255712000009', $1, 'Neema Shirima', 'landlord', '19950505-00009-00009-33', 'pending') RETURNING id
	`, hash("password123")).Scan(&adminID)) // reuse var, value unused after this

	// --- Demo tenant with an active lease + payment history under landlord 0 ---
	var tenantUserID string
	must(pool.QueryRow(ctx, `
		INSERT INTO users (phone, password_hash, full_name, role, verification)
		VALUES ('+255755000001', $1, 'Baraka Mushi', 'tenant', 'unverified') RETURNING id
	`, hash("password123")).Scan(&tenantUserID))

	var tenantID string
	must(pool.QueryRow(ctx, `
		INSERT INTO tenants (user_id, full_name, phone, nida_number)
		VALUES ($1,'Baraka Mushi','+255755000001','19921203-00010-00010-21') RETURNING id
	`, tenantUserID).Scan(&tenantID))

	startDate := time.Now().AddDate(0, -2, 0)
	endDate := startDate.AddDate(1, 0, 0)
	var leaseID string
	must(pool.QueryRow(ctx, `
		INSERT INTO leases (unit_id, tenant_id, landlord_id, language, start_date, end_date, rent_amount, advance_months, deposit_amount, status, tenant_signature_name, tenant_signed_at, tenant_signature_ip, landlord_signed_at)
		VALUES ($1,$2,$3,'sw',$4,$5,550000,6,550000,'active','Baraka Mushi', now(), '41.222.10.5', now())
		RETURNING id
	`, firstUnitID, tenantID, firstLandlordID, startDate, endDate).Scan(&leaseID))

	must2(pool.Exec(ctx, `UPDATE units SET status='occupied' WHERE id=$1`, firstUnitID))

	// Two months already paid (the advance block covers 6 months, so both share due_date = start_date).
	cursor := startDate
	var firstSchedID, secondSchedID string
	for i := 0; i < 6; i++ {
		var schedID string
		status := "pending"
		must(pool.QueryRow(ctx, `
			INSERT INTO payment_schedules (lease_id, period_start, period_end, amount_due, due_date, status)
			VALUES ($1,$2,$3,550000,$4,$5) RETURNING id
		`, leaseID, cursor, cursor.AddDate(0, 1, 0), startDate, status).Scan(&schedID))
		if i == 0 {
			firstSchedID = schedID
		}
		if i == 1 {
			secondSchedID = schedID
		}
		cursor = cursor.AddDate(0, 1, 0)
	}
	// Mark the whole 6-month advance as paid in one lump M-Pesa transaction against the first period,
	// then log the remaining periods as already settled too (advance was paid up front).
	must2(pool.Exec(ctx, `UPDATE payment_schedules SET status='paid' WHERE lease_id=$1`, leaseID))
	must2(pool.Exec(ctx, `
		INSERT INTO payments (lease_id, schedule_id, amount, method, mpesa_receipt, phone_number, status, paid_at)
		VALUES ($1,$2,3300000,'mpesa','QAX2201938','+255755000001','completed', $3)
	`, leaseID, firstSchedID, startDate))
	_ = secondSchedID

	// --- A second, overdue lease under landlord 1 to populate the arrears report ---
	var tenant2ID string
	must(pool.QueryRow(ctx, `
		INSERT INTO tenants (full_name, phone, nida_number) VALUES ('Fatuma Ally','+255755000002','19881111-00011-00011-09') RETURNING id
	`).Scan(&tenant2ID))

	rows, err := pool.Query(ctx, `SELECT u.id FROM units u JOIN properties p ON p.id=u.property_id WHERE p.owner_id=$1 LIMIT 1`, landlords[1].id)
	must(err)
	var overdueUnitID string
	if rows.Next() {
		rows.Scan(&overdueUnitID)
	}
	rows.Close()

	overdueStart := time.Now().AddDate(0, -4, 0)
	var overdueLeaseID string
	must(pool.QueryRow(ctx, `
		INSERT INTO leases (unit_id, tenant_id, landlord_id, language, start_date, end_date, rent_amount, advance_months, deposit_amount, status, tenant_signature_name, tenant_signed_at, landlord_signed_at)
		VALUES ($1,$2,$3,'en',$4,$5,320000,6,320000,'active','Fatuma Ally', $6, $6)
		RETURNING id
	`, overdueUnitID, tenant2ID, landlords[1].id, overdueStart, overdueStart.AddDate(1, 0, 0), overdueStart).Scan(&overdueLeaseID))
	must2(pool.Exec(ctx, `UPDATE units SET status='occupied' WHERE id=$1`, overdueUnitID))

	must2(pool.Exec(ctx, `
		INSERT INTO payment_schedules (lease_id, period_start, period_end, amount_due, due_date, status)
		VALUES ($1,$2,$3,320000,$2,'overdue')
	`, overdueLeaseID, overdueStart, overdueStart.AddDate(0, 1, 0)))

	log.Println("Seed complete.")
	log.Println("")
	log.Println("Demo logins (all use the phone number as username):")
	log.Println("  Admin:     +255700000000 / admin123")
	log.Println("  Landlord:  +255712000001 / password123  (Amina Juma - Mikocheni/Msasani, has the active tenant)")
	log.Println("  Landlord:  +255712000002 / password123  (Elias Mwakalinga - Upanga/Kariakoo, has the overdue tenant)")
	log.Println("  Landlord:  +255712000003 / password123  (Grace Kileo - Kigamboni/Ubungo)")
	log.Println("  Tenant:    +255755000001 / password123  (Baraka Mushi - active lease + payment history)")
	_ = pendingPropID
}

func itoaSeed(n int) string {
	if n == 0 {
		return "studio"
	}
	digits := "0123456789"
	if n < 10 {
		return string(digits[n])
	}
	return "many"
}

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func must2(tag interface{}, err error) {
	if err != nil {
		log.Fatal(err)
	}
}
