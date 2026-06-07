-- Migration 012: Add variants and ecommerce columns and tables to products, tenants, sale_items, and create product_variants and online_orders

-- 1. Add columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_in_store BOOLEAN DEFAULT false;

-- 2. Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  color_hex TEXT,
  sku TEXT,
  stock_quantity DECIMAL(12,3) DEFAULT 0,
  extra_price DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant variant access" ON public.product_variants;
CREATE POLICY "Tenant variant access" ON public.product_variants FOR ALL USING (tenant_id = get_my_tenant_id());
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_tenant ON public.product_variants(tenant_id);

-- 3. Add columns to sale_items
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS variant_label TEXT;

-- 4. Add columns to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ecommerce_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ecommerce_banner TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ecommerce_description TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ecommerce_whatsapp TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ecommerce_delivery_modes TEXT[] DEFAULT '{"pickup"}';

-- 5. Create online_orders table
CREATE TABLE IF NOT EXISTS public.online_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  delivery_mode TEXT DEFAULT 'pickup' CHECK (delivery_mode IN ('pickup','delivery')),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','partial')),
  source TEXT DEFAULT 'online' CHECK (source IN ('online','whatsapp','phone')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for online_orders
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant sees own online orders" ON public.online_orders;
CREATE POLICY "Tenant sees own online orders" ON public.online_orders FOR ALL USING (tenant_id = get_my_tenant_id());
CREATE INDEX IF NOT EXISTS idx_online_orders_tenant ON public.online_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_status ON public.online_orders(tenant_id, status);

-- Trigger for online_orders updated_at
CREATE OR REPLACE TRIGGER update_online_orders_updated_at 
  BEFORE UPDATE ON public.online_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
