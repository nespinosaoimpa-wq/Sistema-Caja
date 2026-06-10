-- Migration 014: Expenses and waste improvements

-- 1. Make shift_id nullable in cash_movements
ALTER TABLE cash_movements ALTER COLUMN shift_id DROP NOT NULL;

-- 2. Add category and payment_method columns to cash_movements
ALTER TABLE cash_movements ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE cash_movements ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';

-- 3. Add index for performance on created_at and category
CREATE INDEX IF NOT EXISTS idx_cash_movements_created_at ON cash_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_movements_category ON cash_movements(category);
