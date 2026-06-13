-- Migration 019: Add latitude and longitude to tenants for georeferencing
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS longitude NUMERIC;

COMMENT ON COLUMN tenants.latitude IS 'Latitude of the business location';
COMMENT ON COLUMN tenants.longitude IS 'Longitude of the business location';
