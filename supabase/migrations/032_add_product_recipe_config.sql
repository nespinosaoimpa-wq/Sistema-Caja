-- Migration 032: Add recipe_config JSONB column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS recipe_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.products.recipe_config IS 'Detail of raw materials/ingredients for cost calculations: [{"name": string, "product_id": uuid|null, "quantity": number, "cost_price": number}]';
