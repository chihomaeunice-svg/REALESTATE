-- Adds land as a listable property type, land-specific attributes, and a
-- booking.com-style favorites/wishlist table available to any logged-in user.

ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'land';

ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_size_acres NUMERIC(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_deed_status TEXT;

CREATE TABLE IF NOT EXISTS favorites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
