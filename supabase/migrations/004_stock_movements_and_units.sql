-- Migration 004: Stock movements and decimal units for weight/volume

-- 1. Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'return', 'adjustment', 'purchase')),
  quantity_change DECIMAL(12,3) NOT NULL,
  stock_before DECIMAL(12,3) NOT NULL,
  stock_after DECIMAL(12,3) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's stock movements"
  ON stock_movements FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can insert their tenant's stock movements"
  ON stock_movements FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());

CREATE INDEX idx_stock_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);

-- 2. Alter products table to support decimal stock and units
ALTER TABLE products 
  ALTER COLUMN stock_quantity TYPE DECIMAL(12,3);

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'unit' CHECK (unit_type IN ('unit', 'weight', 'volume')),
  ADD COLUMN IF NOT EXISTS unit_label TEXT NOT NULL DEFAULT 'un' CHECK (unit_label IN ('un', 'kg', 'g', 'lb', 'l', 'ml', 'm'));

-- 3. Alter sale_items table to support decimal quantities
ALTER TABLE sale_items
  ALTER COLUMN quantity TYPE DECIMAL(12,3);

-- 4. Function and Trigger for stock deduction on sale
CREATE OR REPLACE FUNCTION fn_deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock DECIMAL(12,3);
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO v_current_stock
  FROM products
  WHERE id = NEW.product_id;

  -- Update product stock
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity,
      last_sold_at = NOW()
  WHERE id = NEW.product_id;

  -- Record movement
  INSERT INTO stock_movements (
    tenant_id, product_id, type, quantity_change, stock_before, stock_after, reference_id, reference_type
  ) VALUES (
    NEW.tenant_id, NEW.product_id, 'sale', -NEW.quantity, v_current_stock, v_current_stock - NEW.quantity, NEW.sale_id, 'sale'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS deduct_stock_on_sale_trigger ON sale_items;
CREATE TRIGGER deduct_stock_on_sale_trigger
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_deduct_stock_on_sale();

-- 5. Function and Trigger for restoring stock on cancellation
CREATE OR REPLACE FUNCTION fn_restore_stock_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  v_current_stock DECIMAL(12,3);
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    FOR item IN SELECT * FROM sale_items WHERE sale_id = NEW.id LOOP
      -- Get current stock
      SELECT stock_quantity INTO v_current_stock
      FROM products
      WHERE id = item.product_id;

      -- Update product stock
      UPDATE products
      SET stock_quantity = stock_quantity + item.quantity
      WHERE id = item.product_id;

      -- Record movement
      INSERT INTO stock_movements (
        tenant_id, product_id, type, quantity_change, stock_before, stock_after, reference_id, reference_type
      ) VALUES (
        NEW.tenant_id, item.product_id, 'return', item.quantity, v_current_stock, v_current_stock + item.quantity, NEW.id, 'sale_cancelled'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS restore_stock_on_cancel_trigger ON sales;
CREATE TRIGGER restore_stock_on_cancel_trigger
  AFTER UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION fn_restore_stock_on_cancel();
