-- Migration 013: Add columns to online_orders and fix orders table notes column

-- 1. Add columns to online_orders
ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS advance_payment DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Update source check constraint on online_orders
ALTER TABLE public.online_orders DROP CONSTRAINT IF EXISTS online_orders_source_check;
ALTER TABLE public.online_orders ADD CONSTRAINT online_orders_source_check CHECK (source IN ('online', 'whatsapp', 'phone', 'pos', 'preventista'));

-- 3. Add notes to orders table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
  END IF;
END $$;

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
