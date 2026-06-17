-- Migration 021: Add control_stock column to products and update stock triggers

-- 1. Add control_stock column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS control_stock BOOLEAN DEFAULT true;

-- 2. Redefine fn_deduct_stock_on_sale to support control_stock bypass
CREATE OR REPLACE FUNCTION fn_deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock DECIMAL(12,3);
  v_control_stock BOOLEAN;
BEGIN
  -- Get current stock and control_stock status of base product
  SELECT stock_quantity, control_stock INTO v_current_stock, v_control_stock
  FROM products
  WHERE id = NEW.product_id;

  -- If the product does not control stock, skip updating stock and recording movements
  IF v_control_stock = FALSE THEN
    RETURN NEW;
  END IF;

  -- Update product stock
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity,
      last_sold_at = NOW()
  WHERE id = NEW.product_id;

  -- Update variant stock if variant_id is set
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.variant_id;
  END IF;

  -- Record stock movement
  INSERT INTO stock_movements (
    tenant_id, product_id, type, quantity_change, stock_before, stock_after, reference_id, reference_type
  ) VALUES (
    NEW.tenant_id, NEW.product_id, 'sale', -NEW.quantity, v_current_stock, v_current_stock - NEW.quantity, NEW.sale_id, 'sale'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Redefine fn_restore_stock_on_cancel to support control_stock bypass
CREATE OR REPLACE FUNCTION fn_restore_stock_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  v_current_stock DECIMAL(12,3);
  v_control_stock BOOLEAN;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    FOR item IN SELECT * FROM sale_items WHERE sale_id = NEW.id LOOP
      -- Get current stock and control_stock status
      SELECT stock_quantity, control_stock INTO v_current_stock, v_control_stock
      FROM products
      WHERE id = item.product_id;

      -- If the product does not control stock, skip restoring stock and recording movements
      IF v_control_stock = FALSE THEN
        CONTINUE;
      END IF;

      -- Update product stock
      UPDATE products
      SET stock_quantity = stock_quantity + item.quantity
      WHERE id = item.product_id;

      -- Update variant stock if it exists
      IF item.variant_id IS NOT NULL THEN
        UPDATE product_variants
        SET stock_quantity = stock_quantity + item.quantity
        WHERE id = item.variant_id;
      END IF;

      -- Record stock movement
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

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
