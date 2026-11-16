-- Migration 033: Set default trial period to 15 days
ALTER TABLE tenants ALTER COLUMN trial_ends_at SET DEFAULT (NOW() + INTERVAL '15 days');

