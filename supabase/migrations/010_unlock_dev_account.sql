-- ============================================================
-- SMART CAJA — Cuenta de prueba permanente (Owner Dev)
-- Solo aplica al correo nespinosa.oimpa@gmail.com
-- Los demás usuarios siguen con el flujo normal de trial
-- ============================================================

UPDATE tenants
SET 
  subscription_status = 'active',
  subscription_plan   = 'enterprise',
  trial_ends_at       = '2099-12-31 23:59:59+00'::timestamptz
WHERE id = (
  SELECT tenant_id
  FROM profiles
  WHERE email = 'nespinosa.oimpa@gmail.com'
  LIMIT 1
);

-- Verificar el resultado
SELECT 
  t.name            AS comercio,
  p.email           AS usuario,
  t.subscription_status,
  t.subscription_plan,
  t.trial_ends_at
FROM profiles p
JOIN tenants t ON t.id = p.tenant_id
WHERE p.email = 'nespinosa.oimpa@gmail.com';
