-- Nyumba Yangu (working name) — Tanzania Hybrid Real Estate Platform
-- Core schema: Layer 1 (Listings) + Layer 2 (Management Suite) + Layer 3 (Tenant Portal)
-- Postgres. Designed to run identically on Supabase.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('landlord', 'tenant', 'agent', 'admin');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'room', 'office', 'shop');
CREATE TYPE listing_purpose AS ENUM ('rent', 'sale');
CREATE TYPE listing_status AS ENUM ('active', 'paused', 'let', 'sold', 'expired');
CREATE TYPE unit_status AS ENUM ('vacant', 'occupied', 'maintenance');
CREATE TYPE lease_status AS ENUM ('draft', 'active', 'terminated', 'expired');
CREATE TYPE lease_language AS ENUM ('sw', 'en');
CREATE TYPE schedule_status AS ENUM ('pending', 'paid', 'partial', 'overdue');
CREATE TYPE payment_method AS ENUM ('mpesa', 'cash', 'bank');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'converted', 'closed');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'growth', 'scale');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE,
    phone           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'landlord',
    nida_number     TEXT,
    business_license TEXT,
    verification    verification_status NOT NULL DEFAULT 'unverified',
    verification_note TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    property_type   property_type NOT NULL,
    district        TEXT NOT NULL,
    ward            TEXT NOT NULL,
    address_line    TEXT,
    city            TEXT NOT NULL DEFAULT 'Dar es Salaam',
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    verification    verification_status NOT NULL DEFAULT 'unverified',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE units (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_label      TEXT NOT NULL,
    bedrooms        INT NOT NULL DEFAULT 0,
    bathrooms       INT NOT NULL DEFAULT 0,
    size_sqm        NUMERIC(8,2),
    rent_amount     NUMERIC(14,2) NOT NULL,
    status          unit_status NOT NULL DEFAULT 'vacant',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
    purpose         listing_purpose NOT NULL DEFAULT 'rent',
    title           TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(14,2) NOT NULL,
    price_period    TEXT NOT NULL DEFAULT 'month',
    status          listing_status NOT NULL DEFAULT 'active',
    contact_phone   TEXT NOT NULL,
    view_count      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE listing_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE inquiries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    seeker_name     TEXT NOT NULL,
    seeker_phone    TEXT NOT NULL,
    message         TEXT,
    status          inquiry_status NOT NULL DEFAULT 'new',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name       TEXT NOT NULL,
    phone           TEXT NOT NULL,
    email           TEXT,
    nida_number     TEXT,
    emergency_contact TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE leases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    landlord_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language        lease_language NOT NULL DEFAULT 'sw',
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    rent_amount     NUMERIC(14,2) NOT NULL,
    advance_months  INT NOT NULL DEFAULT 6,
    deposit_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
    status          lease_status NOT NULL DEFAULT 'draft',
    tenant_signature_name TEXT,
    tenant_signed_at      TIMESTAMPTZ,
    tenant_signature_ip   TEXT,
    landlord_signed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id        UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    amount_due      NUMERIC(14,2) NOT NULL,
    due_date        DATE NOT NULL,
    status          schedule_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id        UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    schedule_id     UUID REFERENCES payment_schedules(id) ON DELETE SET NULL,
    amount          NUMERIC(14,2) NOT NULL,
    method          payment_method NOT NULL DEFAULT 'mpesa',
    mpesa_receipt   TEXT,
    phone_number    TEXT,
    status          payment_status NOT NULL DEFAULT 'pending',
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sms_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_phone TEXT NOT NULL,
    message         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier            subscription_tier NOT NULL DEFAULT 'free',
    unit_count      INT NOT NULL DEFAULT 0,
    price_tzs       NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_listings_property ON listings(property_id);
CREATE INDEX idx_listings_district ON listings(status) INCLUDE (price);
CREATE INDEX idx_leases_landlord ON leases(landlord_id);
CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_schedules_lease ON payment_schedules(lease_id);
CREATE INDEX idx_payments_lease ON payments(lease_id);
