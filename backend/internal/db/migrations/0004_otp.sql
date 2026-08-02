-- OTP codes for passwordless email login.
CREATE TABLE IF NOT EXISTS otp_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    code        TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_email ON otp_codes(email, used, expires_at);

-- Allow users to register/login without a password (OTP-only flow).
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Allow OTP-registered users to have no phone initially.
-- Drop the unique constraint, re-add as partial (non-empty phones stay unique).
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone) WHERE phone IS NOT NULL AND phone != '';
