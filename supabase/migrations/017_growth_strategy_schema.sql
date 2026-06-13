-- Migration 017: Growth Strategy Schema (Coupons, Referrals, and Leads)

-- 1. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_months')),
  discount_value DECIMAL(12,2) NOT NULL,
  duration_months INTEGER, -- NULL means single/one-time or infinite.
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage coupons" ON coupons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public can view coupons" ON coupons FOR SELECT USING (true);

-- 2. Add growth strategy columns to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applied_coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_extended BOOLEAN DEFAULT false;

-- Create function to generate a random referral code if not exists
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'REF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM tenants WHERE referral_code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign referral_code on tenant insertion if empty
CREATE OR REPLACE FUNCTION trigger_assign_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_unique_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER assign_referral_code_before_insert
  BEFORE INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_assign_referral_code();

-- Populate existing tenants with referral codes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM tenants WHERE referral_code IS NULL LOOP
    UPDATE tenants SET referral_code = generate_unique_referral_code() WHERE id = r.id;
  END LOOP;
END $$;

-- 3. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referred_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'paid', 'rewarded')),
  reward_months INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_tenant_id, referred_tenant_id)
);

-- RLS for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage referrals" ON referrals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Tenant users can view their referrals" ON referrals FOR SELECT USING (referrer_tenant_id = get_my_tenant_id() OR referred_tenant_id = get_my_tenant_id());

-- 4. Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  business_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage leads" ON leads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Anyone can insert a lead" ON leads FOR INSERT WITH CHECK (true);
