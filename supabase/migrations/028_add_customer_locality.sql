-- Migration 028: Add locality column to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS locality TEXT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
