-- Migration 008: Fix RLS recursion loop in get_my_tenant_id and get_my_role
-- Converts functions to plpgsql to prevent inlining by the query planner, breaking infinite recursion.

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
