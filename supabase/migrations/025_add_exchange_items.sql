-- ============================================================
-- SMART CAJA - Migration 025: Add Exchange/Return items to sales
-- Circuito de Cambios/Devoluciones en el POS
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add exchange_items column to sales table
-- Stores returned products as JSONB array so no stock triggers fire on them
-- (returned goods were already deducted from stock when originally sold)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS exchange_items JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS exchange_total DECIMAL(12,2) DEFAULT 0;

-- Comments for documentation
COMMENT ON COLUMN public.sales.exchange_items IS 
  'Productos devueltos/recambiados en esta venta. Array JSON: [{product_id, product_name, quantity, unit_price, cost_price, subtotal, variant_id, variant_label, reason}]. No descuenta stock (ya fue descontado en venta original).';

COMMENT ON COLUMN public.sales.exchange_total IS 
  'Valor total de los productos devueltos/recambiados (se resta del subtotal para obtener el total neto cobrado).';

-- Index for querying sales that have exchanges (for waste/loss reports)
CREATE INDEX IF NOT EXISTS idx_sales_has_exchange 
  ON public.sales(tenant_id, created_at) 
  WHERE exchange_items IS NOT NULL;
