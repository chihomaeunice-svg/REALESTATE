-- Adds listing-level columns for the "accepts monthly rent" flag and
-- direct bedroom/bathroom counts (for land/property listings without units).

ALTER TABLE listings ADD COLUMN IF NOT EXISTS accepts_monthly_rent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bedrooms INT NOT NULL DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bathrooms INT NOT NULL DEFAULT 0;
