-- Migration 011: Fix profiles RLS policy to support signup when email confirmation is enabled (auth.uid() is null)
-- This allows anonymous insert on signup while maintaining database integrity via the foreign key constraint: id REFERENCES auth.users(id)

DROP POLICY IF EXISTS "Allow user to insert their own profile" ON profiles;

CREATE POLICY "Allow user to insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);
