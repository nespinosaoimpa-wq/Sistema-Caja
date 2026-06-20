-- Migration 024: Link profiles, shifts, and sales to branches for multi-branch tracking

-- 1. Add branch_id to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles(branch_id);

-- 2. Add branch_id to public.shifts
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_shifts_branch ON public.shifts(branch_id);

-- 3. Add branch_id to public.sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_branch ON public.sales(branch_id);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
