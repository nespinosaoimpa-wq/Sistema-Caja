-- Migration 029: Make customer_phone optional in online_orders table
ALTER TABLE public.online_orders ALTER COLUMN customer_phone DROP NOT NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
