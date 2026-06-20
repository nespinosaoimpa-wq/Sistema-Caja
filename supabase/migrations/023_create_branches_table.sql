-- Migration 023: Create branches table and configure Row-Level Security (RLS) policies

-- 1. Create the branches table if it does not exist
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Tenant users can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Tenant users can view branches" ON public.branches;
DROP POLICY IF EXISTS "Tenant users can insert branches" ON public.branches;
DROP POLICY IF EXISTS "Tenant users can update branches" ON public.branches;
DROP POLICY IF EXISTS "Tenant users can delete branches" ON public.branches;
DROP POLICY IF EXISTS "Service role bypass branches" ON public.branches;

-- 4. Create policy to allow tenant users to perform all operations on their own branches
CREATE POLICY "Tenant users can manage branches"
  ON public.branches FOR ALL
  USING (tenant_id = public.get_my_tenant_id());

-- 5. Create policy to allow service_role to bypass RLS (needed for server-side admin actions)
CREATE POLICY "Service role bypass branches"
  ON public.branches FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Trigger to automatically update the updated_at timestamp on edit
DROP TRIGGER IF EXISTS update_branches_updated_at ON public.branches;
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 7. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
