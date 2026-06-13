-- Migration 016: Redefine stock triggers to support product variants automatically

-- 1. Redefine fn_deduct_stock_on_sale to deduct variant stock if variant_id is provided
CREATE OR REPLACE FUNCTION fn_deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock DECIMAL(12,3);
BEGIN
  -- Get current stock of base product
  SELECT stock_quantity INTO v_current_stock
  FROM products
  WHERE id = NEW.product_id;

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

-- 2. Redefine fn_restore_stock_on_cancel to restore variant stock if variant_id exists in sale_items
CREATE OR REPLACE FUNCTION fn_restore_stock_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  v_current_stock DECIMAL(12,3);
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    FOR item IN SELECT * FROM sale_items WHERE sale_id = NEW.id LOOP
      -- Get current stock of base product
      SELECT stock_quantity INTO v_current_stock
      FROM products
      WHERE id = item.product_id;

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
