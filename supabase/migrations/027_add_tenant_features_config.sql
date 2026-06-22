-- Migration 027: Add features_config to tenants for Rubro-based modular customization

-- 1. Add features_config column to public.tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS features_config JSONB DEFAULT '{}'::jsonb;

-- 2. Create function to return default feature flags based on business_type/rubro
CREATE OR REPLACE FUNCTION public.get_default_features_by_rubro(p_rubro TEXT)
RETURNS JSONB AS $$
BEGIN
    CASE p_rubro
        WHEN 'lubricentro', 'mecanica', 'gomeria', 'lavadero' THEN
            RETURN '{"work_orders": true, "vehicles": true, "express": true, "variants": false, "weight_scale": false, "waste": true, "expenses": true, "installments": true}'::jsonb;
        WHEN 'ropa' THEN
            RETURN '{"work_orders": false, "vehicles": false, "express": false, "variants": true, "weight_scale": false, "waste": false, "expenses": true, "installments": true}'::jsonb;
        WHEN 'verduleria', 'carniceria', 'panaderia', 'supermercado' THEN
            RETURN '{"work_orders": false, "vehicles": false, "express": false, "variants": false, "weight_scale": true, "waste": true, "expenses": true, "installments": true}'::jsonb;
        ELSE
            -- Kioscos / general / others
            RETURN '{"work_orders": false, "vehicles": false, "express": false, "variants": false, "weight_scale": false, "waste": true, "expenses": true, "installments": true}'::jsonb;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Populate existing tenants with default features based on their current business_type
UPDATE public.tenants 
SET features_config = public.get_default_features_by_rubro(business_type) 
WHERE features_config IS NULL OR features_config = '{}'::jsonb;

-- 4. Create trigger to automatically assign default features to new tenants upon registration
CREATE OR REPLACE FUNCTION public.fn_set_default_tenant_features()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.features_config IS NULL OR NEW.features_config = '{}'::jsonb THEN
        NEW.features_config := public.get_default_features_by_rubro(NEW.business_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_default_tenant_features ON public.tenants;
CREATE TRIGGER trg_set_default_tenant_features
    BEFORE INSERT ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_set_default_tenant_features();

-- 5. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
