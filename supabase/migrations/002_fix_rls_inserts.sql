-- Permitir que cualquier usuario (incluso recién registrado) pueda crear su comercio
CREATE POLICY "Allow insert tenant on signup" 
  ON tenants FOR INSERT 
  WITH CHECK (true);

-- Permitir que el usuario recién creado pueda insertar su propio perfil
CREATE POLICY "Allow user to insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Permitir crear categorías iniciales al registrarse
CREATE POLICY "Allow insert category on signup"
  ON categories FOR INSERT
  WITH CHECK (true);
