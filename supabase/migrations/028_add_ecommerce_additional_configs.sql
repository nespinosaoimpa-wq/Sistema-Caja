-- Migration 028: Add ecommerce hours, out-of-stock settings, and Tiendanube integration columns to tenants, products and product_variants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ecommerce_hours JSONB DEFAULT '{"enabled": false, "days": {"monday": {"from": "09:00", "to": "18:00", "closed": false}, "tuesday": {"from": "09:00", "to": "18:00", "closed": false}, "wednesday": {"from": "09:00", "to": "18:00", "closed": false}, "thursday": {"from": "09:00", "to": "18:00", "closed": false}, "friday": {"from": "09:00", "to": "18:00", "closed": false}, "saturday": {"from": "09:00", "to": "14:00", "closed": false}, "sunday": {"from": "09:00", "to": "18:00", "closed": true}}}'::jsonb;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ecommerce_show_out_of_stock BOOLEAN DEFAULT true;

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tiendanube_store_id TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tiendanube_access_token TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tiendanube_last_sync TIMESTAMPTZ;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tiendanube_id TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS tiendanube_id TEXT;

-- Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
