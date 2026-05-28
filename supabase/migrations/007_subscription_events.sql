-- ============================================================
-- SUBSCRIPTION EVENTS (Auditoría de suscripciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'subscription_created', 'subscription_authorized', 'subscription_paused', 'subscription_cancelled', 'payment_approved', 'payment_rejected'
  mp_subscription_id TEXT,
  mp_payment_id TEXT,
  plan_id TEXT, -- 'basic', 'professional', 'enterprise'
  amount DECIMAL(12,2),
  status_before TEXT,
  status_after TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_subscription_events_tenant ON subscription_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_mp_sub ON subscription_events(mp_subscription_id);

-- RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Service role can insert (from webhook)
CREATE POLICY "Service role can manage subscription events"
  ON subscription_events FOR ALL
  USING (auth.role() = 'service_role');

-- Owners can read their own events
CREATE POLICY "Owners can view their subscription events"
  ON subscription_events FOR SELECT
  USING (tenant_id = get_my_tenant_id() AND get_my_role() IN ('owner', 'admin'));

COMMENT ON TABLE subscription_events IS 'Audit log for all Mercado Pago subscription lifecycle events';
