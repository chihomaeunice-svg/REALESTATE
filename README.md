# Nyumba Yangu — Tanzania Hybrid Real Estate Platform

A working prototype of the platform described in the product spec: a free rental/sale
listings marketplace (Layer 1) that funnels landlords into a paid rent-management
suite (Layer 2), with a lightweight tenant portal (Layer 3) that makes the landlord
product sticky.

**Stack:** React + Vite + TypeScript + Tailwind CSS (frontend) · Go + chi + pgx (backend)
· PostgreSQL (schema is Supabase-compatible — point `DATABASE_URL` at a Supabase
Postgres connection string and it runs unchanged; auth here is custom JWT rather than
Supabase Auth, since the spec's identity model — NIDA/business-license verification,
tenant/landlord/agent/admin roles — is bespoke).

## What's implemented

- **Listings marketplace** — free, public, searchable by district/ward/type/price.
  Verification badges tied to landlord NIDA/business-license review and property
  review (both go through a manual admin queue, matching the spec's MVP approach).
- **Inquiries** — a seeker contacting a lister creates the tenant record that
  Layer 2 builds on.
- **Management suite** — Property → Unit → Lease → Tenant → PaymentSchedule → Payment
  data model. Digital leases (Swahili/English) render as a printable HTML document
  with a signed-audit-trail footer (signer name, timestamp, IP) rather than a
  certified e-signature, per the spec's guidance. Advance-rent payment schedules are
  modeled natively: schedules are generated in monthly periods but bundled into a
  single due date per advance block (default 6 months), matching how Tanzanian
  landlords actually collect rent.
- **M-Pesa payments** — a mock STK-push endpoint (`POST /api/payments/mpesa/stk-push`)
  that completes synchronously and logs an SMS receipt, standing in for a real
  aggregator (Selcom/ClickPesa/AzamPay) integration. The request/response shape
  mirrors what those aggregators expect, so swapping in a real client is a
  contained change inside `internal/handlers/payment_handler.go`.
- **Reports & arrears** — income-by-building chart, arrears list, YTD collection.
- **Subscription tiers** — free (1 unit) / starter / growth / scale, computed from
  the landlord's actual unit count per the spec's pricing.
- **Tenant portal** — lease view, e-signature, payment history, pay-by-M-Pesa.
- **Admin verification queue** — approve/reject pending landlords and properties.

**Explicitly deferred** (per the spec's MVP scope): agent tools, sale-transaction
workflows, land listings, mortgage content, tenant screening scores, maintenance
ticketing, and real telco/SMS integration.

## Project layout

```
backend/    Go API (cmd/api, cmd/seed, internal/{config,db,models,auth,middleware,handlers})
frontend/   React app (src/{pages,components,lib})
```

## Running it locally

### 1. Database

```bash
createdb realestate
# or, against Supabase: use its connection string as DATABASE_URL below
```

### 2. Backend

```bash
cd backend
go build ./...
DATABASE_URL="postgres://postgres:postgres@localhost:5432/realestate?sslmode=disable" \
JWT_SECRET="change-me" \
go run ./cmd/seed   # optional: wipes and loads Dar es Salaam demo data
DATABASE_URL="postgres://postgres:postgres@localhost:5432/realestate?sslmode=disable" \
JWT_SECRET="change-me" \
go run ./cmd/api    # migrations run automatically on boot, listens on :8080
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173, proxies /api to :8080
```

### Demo accounts (after `go run ./cmd/seed`)

| Role | Phone | Password |
|---|---|---|
| Admin | +255700000000 | admin123 |
| Landlord (Amina Juma — Mikocheni/Msasani, has an active tenant) | +255712000001 | password123 |
| Landlord (Elias Mwakalinga — Upanga/Kariakoo, has an overdue tenant) | +255712000002 | password123 |
| Landlord (Grace Kileo — Kigamboni/Ubungo) | +255712000003 | password123 |
| Tenant (Baraka Mushi — active lease + payment history) | +255755000001 | password123 |

## Key technical decisions carried over from the spec

- **Payment aggregator**: the mock STK-push endpoint is written to be swapped for
  an aggregator client (Selcom/ClickPesa/AzamPay recommended over direct Vodacom
  OpenAPI integration for multi-network coverage) without touching the schedule/
  reconciliation logic around it.
- **Lease validity**: signed-HTML-plus-audit-trail now; if formal e-signature
  certification becomes a requirement, that's an additive change to the `Document`
  and `Sign` handlers in `lease_handler.go`, not a schema change.
- **Advance-rent modeling**: `payment_schedules` rows are per-month for reporting
  granularity, but rows within the same advance block share one `due_date`, so
  the schedule view reads the way landlords actually bill (one upfront payment
  covering N months) while still supporting monthly income reporting.
