-- 0005: Amenities on units, under_renovation status, maintenance requests

-- 1. Add 'under_renovation' to unit_status enum
ALTER TYPE unit_status ADD VALUE IF NOT EXISTS 'under_renovation';

-- 2. Add amenity columns to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS meter_type       TEXT;          -- LUKU, shared, prepaid
ALTER TABLE units ADD COLUMN IF NOT EXISTS water_source     TEXT;          -- DAWASA, borehole, well
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_fence        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_security_gate BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_balcony      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS master_bedrooms  INT NOT NULL DEFAULT 0;
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_parking      BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Add amenity columns to properties table (property-level amenities)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_fence        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_security_gate BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_parking      BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    tenant_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    priority        TEXT NOT NULL DEFAULT 'medium',
    status          TEXT NOT NULL DEFAULT 'open',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_unit ON maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant ON maintenance_requests(tenant_user_id);
