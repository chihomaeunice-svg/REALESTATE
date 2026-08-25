-- Subscription billing: lifecycle status, payment tracking, Snippe integration

-- 1. Add new tier values to subscription_tier enum
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'professional';
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'enterprise';

-- 2. Add subscription status enum
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'grace', 'expired');

-- 2. Extend subscriptions table with lifecycle columns
ALTER TABLE subscriptions
    ADD COLUMN status          subscription_status NOT NULL DEFAULT 'trial',
    ADD COLUMN trial_ends_at   TIMESTAMPTZ,
    ADD COLUMN current_period_start TIMESTAMPTZ,
    ADD COLUMN current_period_end   TIMESTAMPTZ,
    ADD COLUMN grace_ends_at   TIMESTAMPTZ,
    ADD COLUMN last_grace_email_day INT NOT NULL DEFAULT 0;

-- 3. Create subscription_payments table
CREATE TABLE subscription_payments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id  UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    snippe_reference TEXT,
    amount           NUMERIC(14,2) NOT NULL,
    currency         TEXT NOT NULL DEFAULT 'TZS',
    phone_number     TEXT NOT NULL,
    status           payment_status NOT NULL DEFAULT 'pending',
    idempotency_key  TEXT UNIQUE NOT NULL,
    period_start     TIMESTAMPTZ NOT NULL,
    period_end       TIMESTAMPTZ NOT NULL,
    paid_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_payments_sub ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_ref ON subscription_payments(snippe_reference);

-- 4. Migrate existing subscriptions to active with 30 days runway
UPDATE subscriptions
SET status              = 'active',
    current_period_start = now(),
    current_period_end   = now() + INTERVAL '30 days'
WHERE id IS NOT NULL;
