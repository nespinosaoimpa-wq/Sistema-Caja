-- Corregir la política de selección de tenants para permitir el registro inicial.
-- Al crear el tenant, el usuario aún no tiene un perfil creado, por lo que get_my_tenant_id() es null.
-- Esta política permite leer el tenant si el ID coincide o si el email del comercio coincide con el email de autenticación del usuario.

DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;

CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (
    id = get_my_tenant_id() 
    OR 
    email = (auth.jwt() ->> 'email')
  );
