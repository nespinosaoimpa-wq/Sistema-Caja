-- Update default value for subscription_plan to 'enterprise'
ALTER TABLE tenants ALTER COLUMN subscription_plan SET DEFAULT 'enterprise';

-- Update existing trial tenants to have 'enterprise' plan so they can try all features
UPDATE tenants SET subscription_plan = 'enterprise' WHERE subscription_status = 'trial';
