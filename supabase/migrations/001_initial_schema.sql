-- ============================================================
-- SMART CAJA - Initial Database Schema
-- Run this in Supabase SQL Editor
-- Project: cdaqvqhcfuyxitnpsesq
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TENANTS (Comercios / Negocios)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_type TEXT DEFAULT 'general', -- kiosco, supermercado, ropa, lubricentro, etc
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  theme_config JSONB DEFAULT '{"primary_color": "#7C3AED", "secondary_color": "#10B981", "mode": "dark"}'::jsonb,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic',
  mercadopago_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (Usuarios vinculados a tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'cashier' CHECK (role IN ('owner', 'admin', 'cashier')),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES (Categorías de productos)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#7C3AED',
  icon TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS (Inventario)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  barcode TEXT,
  reference_code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  cost_price DECIMAL(12,2) DEFAULT 0,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Make barcode unique per tenant
  UNIQUE(tenant_id, barcode),
  UNIQUE(tenant_id, reference_code)
);

-- ============================================================
-- SHIFTS (Turnos de caja)
-- ============================================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opening_cash DECIMAL(12,2) DEFAULT 0,
  closing_cash DECIMAL(12,2),
  total_cash_sales DECIMAL(12,2) DEFAULT 0,
  total_debit_sales DECIMAL(12,2) DEFAULT 0,
  total_credit_sales DECIMAL(12,2) DEFAULT 0,
  total_combined_sales DECIMAL(12,2) DEFAULT 0,
  total_installment_sales DECIMAL(12,2) DEFAULT 0,
  total_discount DECIMAL(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALES (Ventas)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', NULL)),
  discount_value DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'debit', 'credit', 'combined', 'installment')),
  cash_received DECIMAL(12,2),
  cash_change DECIMAL(12,2),
  payment_details JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALE ITEMS (Items de cada venta)
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TICKETS (Historial de tickets)
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ticket_content TEXT,
  printed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSTALLMENT PLANS (Cuotas informales / Fiado)
-- ============================================================
CREATE TABLE IF NOT EXISTS installment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_notes TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  remaining_amount DECIMAL(12,2) NOT NULL,
  total_installments INTEGER NOT NULL DEFAULT 1,
  paid_installments INTEGER DEFAULT 0,
  installment_amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
  due_date DATE,
  payment_schedule JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSTALLMENT PAYMENTS (Pagos de cuotas)
-- ============================================================
CREATE TABLE IF NOT EXISTS installment_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_plan_id UUID NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_shift ON sales(shift_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_installments_tenant ON installment_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate ticket number (sequential per tenant)
CREATE OR REPLACE FUNCTION generate_ticket_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM sales WHERE tenant_id = p_tenant_id;
  RETURN LPAD(v_count::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON installment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (Multi-tenant isolation)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- TENANTS policies
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = get_my_tenant_id());

CREATE POLICY "Owners can update their tenant"
  ON tenants FOR UPDATE
  USING (id = get_my_tenant_id() AND get_my_role() IN ('owner', 'admin'));

-- PROFILES policies
CREATE POLICY "Users can view profiles in their tenant"
  ON profiles FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Owners can manage all profiles in their tenant"
  ON profiles FOR ALL
  USING (tenant_id = get_my_tenant_id() AND get_my_role() IN ('owner', 'admin'));

-- CATEGORIES policies
CREATE POLICY "Tenant users can manage categories"
  ON categories FOR ALL
  USING (tenant_id = get_my_tenant_id());

-- PRODUCTS policies
CREATE POLICY "Tenant users can manage products"
  ON products FOR ALL
  USING (tenant_id = get_my_tenant_id());

-- SHIFTS policies
CREATE POLICY "Tenant users can view all shifts"
  ON shifts FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Cashiers can create shifts"
  ON shifts FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "Cashiers can update their own open shifts"
  ON shifts FOR UPDATE
  USING (tenant_id = get_my_tenant_id() AND (user_id = auth.uid() OR get_my_role() IN ('owner', 'admin')));

-- SALES policies
CREATE POLICY "Tenant users can manage sales"
  ON sales FOR ALL
  USING (tenant_id = get_my_tenant_id());

-- SALE_ITEMS policies
CREATE POLICY "Tenant users can manage sale items"
  ON sale_items FOR ALL
  USING (tenant_id = get_my_tenant_id());

-- TICKETS policies
CREATE POLICY "Tenant users can manage tickets"
  ON tickets FOR ALL
  USING (tenant_id = get_my_tenant_id());

-- INSTALLMENT_PLANS policies
CREATE POLICY "Tenant users can manage installment plans"
  ON installment_plans FOR ALL
  USING (tenant_id = get_my_tenant_id());

-- INSTALLMENT_PAYMENTS policies
CREATE POLICY "Tenant users can manage installment payments"
  ON installment_payments FOR ALL
  USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- SERVICE ROLE bypass (for server-side operations)
-- ============================================================
-- These policies allow the service role key to bypass RLS
CREATE POLICY "Service role bypass tenants"
  ON tenants FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run in Storage section or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-logos', 'tenant-logos', true);

COMMENT ON TABLE tenants IS 'Multi-tenant: each row is a business/comercio using Smart Caja';
COMMENT ON TABLE profiles IS 'Users linked to tenants with roles';
COMMENT ON TABLE products IS 'Product inventory per tenant';
COMMENT ON TABLE sales IS 'All sales transactions per tenant';
COMMENT ON TABLE shifts IS 'Cash register shifts per tenant';
