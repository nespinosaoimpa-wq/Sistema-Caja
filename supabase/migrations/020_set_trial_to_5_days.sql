-- Migration 020: Set default trial duration to 5 days
ALTER TABLE tenants ALTER COLUMN trial_ends_at SET DEFAULT (NOW() + INTERVAL '5 days');
