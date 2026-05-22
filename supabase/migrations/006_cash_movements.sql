-- Migration 006: Cash movements and reliable ticket sequences

-- 1. Create cash_movements table
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's cash movements"
  ON cash_movements FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can manage their tenant's cash movements"
  ON cash_movements FOR ALL
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

CREATE INDEX idx_cash_movements_tenant ON cash_movements(tenant_id);
CREATE INDEX idx_cash_movements_shift ON cash_movements(shift_id);

-- 2. Reliable ticket generation
CREATE TABLE IF NOT EXISTS tenant_sequences (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  last_ticket_number INTEGER DEFAULT 0
);

-- Initialize tenant sequences for existing tenants
INSERT INTO tenant_sequences (tenant_id, last_ticket_number)
SELECT t.id, (SELECT COUNT(*) FROM sales s WHERE s.tenant_id = t.id)
FROM tenants t
ON CONFLICT (tenant_id) DO NOTHING;

-- Trigger to auto-create sequence for new tenants
CREATE OR REPLACE FUNCTION fn_init_tenant_sequence()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_sequences (tenant_id, last_ticket_number) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS init_tenant_sequence_trigger ON tenants;
CREATE TRIGGER init_tenant_sequence_trigger
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION fn_init_tenant_sequence();

-- Replace the racy generate_ticket_number function
CREATE OR REPLACE FUNCTION generate_ticket_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_next_number INTEGER;
  v_ticket_string TEXT;
BEGIN
  -- We use FOR UPDATE to lock the row and prevent race conditions
  UPDATE tenant_sequences
  SET last_ticket_number = last_ticket_number + 1
  WHERE tenant_id = p_tenant_id
  RETURNING last_ticket_number INTO v_next_number;
  
  -- If for some reason the row doesn't exist (e.g. created before the trigger), create it
  IF v_next_number IS NULL THEN
    INSERT INTO tenant_sequences (tenant_id, last_ticket_number)
    VALUES (p_tenant_id, 1)
    RETURNING last_ticket_number INTO v_next_number;
  END IF;

  -- Format as 8 digits with leading zeros
  v_ticket_string := LPAD(v_next_number::TEXT, 8, '0');
  
  RETURN v_ticket_string;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
