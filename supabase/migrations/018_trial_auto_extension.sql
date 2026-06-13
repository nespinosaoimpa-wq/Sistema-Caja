-- Migration 018: Restore default trial to 14 days and add automated trial extension

-- 1. Restore default trial ends at to 14 days
ALTER TABLE tenants ALTER COLUMN trial_ends_at SET DEFAULT (NOW() + INTERVAL '14 days');

-- 2. Create function to check and extend trial
CREATE OR REPLACE FUNCTION check_and_extend_trial()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_trial_extended BOOLEAN;
  v_status TEXT;
  v_prod_count INT;
  v_sales_count INT;
BEGIN
  -- Determine tenant_id from context
  v_tenant_id := NEW.tenant_id;
  
  -- Check if already extended or if not in trial
  SELECT trial_extended, subscription_status 
  INTO v_trial_extended, v_status
  FROM tenants 
  WHERE id = v_tenant_id;
  
  IF v_status = 'trial' AND (v_trial_extended IS NULL OR v_trial_extended = false) THEN
    -- Count products
    SELECT COUNT(*) INTO v_prod_count FROM products WHERE tenant_id = v_tenant_id;
    
    -- Count sales
    SELECT COUNT(*) INTO v_sales_count FROM sales WHERE tenant_id = v_tenant_id;
    
    -- If threshold met, extend by 7 days
    IF v_prod_count >= 10 AND v_sales_count >= 5 THEN
      UPDATE tenants 
      SET trial_ends_at = trial_ends_at + INTERVAL '7 days',
          trial_extended = true
      WHERE id = v_tenant_id;
      
      -- Insert a log event for the trial extension
      INSERT INTO subscription_events (tenant_id, event_type, status_before, status_after, raw_payload)
      VALUES (v_tenant_id, 'trial_extended', 'trial', 'trial', jsonb_build_object(
        'reason', 'Reached 10 products and 5 sales',
        'products_count', v_prod_count,
        'sales_count', v_sales_count
      ));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add triggers to products and sales
CREATE OR REPLACE TRIGGER trigger_extend_trial_on_product
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_and_extend_trial();

CREATE OR REPLACE TRIGGER trigger_extend_trial_on_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION check_and_extend_trial();
