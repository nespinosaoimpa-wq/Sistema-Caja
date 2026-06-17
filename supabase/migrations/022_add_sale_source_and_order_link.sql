-- Migration 022: Add online_order_id and source to sales

-- 1. Add columns to sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS online_order_id UUID REFERENCES public.online_orders(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'caja';

-- 2. Add check constraint for source
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_source_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_source_check CHECK (source IN ('caja', 'online', 'whatsapp', 'phone', 'pos', 'preventista'));

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_source ON public.sales(tenant_id, source);
CREATE INDEX IF NOT EXISTS idx_sales_order ON public.sales(online_order_id);

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
