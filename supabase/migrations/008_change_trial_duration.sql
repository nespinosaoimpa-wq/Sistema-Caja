-- Update trial duration default to 5 days instead of 14 days
ALTER TABLE tenants ALTER COLUMN trial_ends_at SET DEFAULT (NOW() + INTERVAL '5 days');
