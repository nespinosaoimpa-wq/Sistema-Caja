-- Migration 026: Add Work Orders and Quick Services (Gomería Express/Lavaderos) Schema

-- 1. Alter profiles and sales tables constraints and add columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 0;

-- Alter profiles role constraint to allow 'mechanic' (or operator)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'cashier', 'mechanic'));

-- Alter sales constraints and columns
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS work_order_id UUID; -- Will add FK reference later after work_orders table is created
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS quick_service_id UUID; -- Will add FK reference later after daily_quick_services table is created

-- Update sales source check constraint
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_source_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_source_check CHECK (source IN ('caja', 'online', 'whatsapp', 'phone', 'pos', 'preventista', 'work_order', 'quick_service'));


-- 2. Create boxes table (Boxes físicos del taller)
CREATE TABLE IF NOT EXISTS public.boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Libre' CHECK (status IN ('Libre', 'Ocupado', 'Mantenimiento')),
    assigned_mechanic_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage boxes in their tenant"
    ON public.boxes FOR ALL
    USING (tenant_id = get_my_tenant_id())
    WITH CHECK (tenant_id = get_my_tenant_id());


-- 3. Create vehicles table (Gestión de vehículos)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    license_plate TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    color TEXT,
    km INTEGER DEFAULT 0,
    engine_type TEXT,
    fuel_type TEXT,
    notes TEXT,
    difficulty_factor NUMERIC(3,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, license_plate)
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage vehicles in their tenant"
    ON public.vehicles FOR ALL
    USING (tenant_id = get_my_tenant_id())
    WITH CHECK (tenant_id = get_my_tenant_id());

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON public.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(tenant_id, license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_client ON public.vehicles(client_id);


-- 4. Create vehicle_health table (Historial de mantenimiento y alertas)
CREATE TABLE IF NOT EXISTS public.vehicle_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL UNIQUE REFERENCES public.vehicles(id) ON DELETE CASCADE,
    health_score INTEGER DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
    last_oil_change TIMESTAMPTZ,
    last_oil_change_km INTEGER,
    last_tire_change TIMESTAMPTZ,
    last_filter_change TIMESTAMPTZ,
    last_brake_check TIMESTAMPTZ,
    last_coolant_change TIMESTAMPTZ,
    tire_wear_level INTEGER DEFAULT 100,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicle_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage vehicle_health in their tenant"
    ON public.vehicle_health FOR ALL
    USING (tenant_id = get_my_tenant_id())
    WITH CHECK (tenant_id = get_my_tenant_id());


-- 5. Create work_orders table (Órdenes de Trabajo)
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    qr_uuid UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    box_id UUID REFERENCES public.boxes(id) ON DELETE SET NULL,
    assigned_mechanic_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Box', 'Finalizado', 'Cancelado')),
    km_at_entry INTEGER,
    description TEXT,
    diagnostic TEXT,
    observations TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    labor_base_price DECIMAL(12,2) DEFAULT 0,
    total_parts_cost DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(12,2) DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage work_orders in their tenant"
    ON public.work_orders FOR ALL
    USING (tenant_id = get_my_tenant_id())
    WITH CHECK (tenant_id = get_my_tenant_id());

CREATE INDEX IF NOT EXISTS idx_wo_tenant ON public.work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wo_status ON public.work_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_wo_client ON public.work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_wo_vehicle ON public.work_orders(vehicle_id);


-- 6. Add work_order_id FK reference on sales
ALTER TABLE public.sales ADD CONSTRAINT fk_sales_work_order FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE SET NULL;


-- 7. Create work_order_items table (Repuestos y mano de obra de la OT)
CREATE TABLE IF NOT EXISTS public.work_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(12,3) DEFAULT 1,
    unit TEXT DEFAULT 'unidad',
    unit_price DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(12,2) DEFAULT 0,
    is_labor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage work_order_items in their tenant"
    ON public.work_order_items FOR ALL
    USING (work_order_id IN (SELECT id FROM public.work_orders WHERE tenant_id = get_my_tenant_id()));

CREATE INDEX IF NOT EXISTS idx_wo_items_order ON public.work_order_items(work_order_id);


-- 8. Create work_order_checklist table (Inspección inicial)
CREATE TABLE IF NOT EXISTS public.work_order_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL UNIQUE REFERENCES public.work_orders(id) ON DELETE CASCADE,
    luces_delanteras BOOLEAN DEFAULT FALSE,
    luces_traseras BOOLEAN DEFAULT FALSE,
    luces_giro BOOLEAN DEFAULT FALSE,
    nivel_aceite BOOLEAN DEFAULT FALSE,
    nivel_refrigerante BOOLEAN DEFAULT FALSE,
    nivel_liquido_frenos BOOLEAN DEFAULT FALSE,
    presion_neumaticos BOOLEAN DEFAULT FALSE,
    estado_neumaticos BOOLEAN DEFAULT FALSE,
    freno_mano BOOLEAN DEFAULT FALSE,
    limpiaparabrisas BOOLEAN DEFAULT FALSE,
    bateria BOOLEAN DEFAULT FALSE,
    correas BOOLEAN DEFAULT FALSE,
    presion_del_izq NUMERIC(4,1),
    presion_del_der NUMERIC(4,1),
    presion_tra_izq NUMERIC(4,1),
    presion_tra_der NUMERIC(4,1),
    observations TEXT,
    checked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.work_order_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage checklists in their tenant"
    ON public.work_order_checklist FOR ALL
    USING (work_order_id IN (SELECT id FROM public.work_orders WHERE tenant_id = get_my_tenant_id()));


-- 9. Create daily_quick_services table (Servicios rápidos tipo Gomería Express)
CREATE TABLE IF NOT EXISTS public.daily_quick_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL, -- 'Parche Moto', 'Parche Auto', etc.
    price DECIMAL(12,2) NOT NULL,
    employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_quick_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage quick services in their tenant"
    ON public.daily_quick_services FOR ALL
    USING (tenant_id = get_my_tenant_id())
    WITH CHECK (tenant_id = get_my_tenant_id());

CREATE INDEX IF NOT EXISTS idx_quick_serv_tenant ON public.daily_quick_services(tenant_id);


-- 10. Add quick_service_id FK reference on sales
ALTER TABLE public.sales ADD CONSTRAINT fk_sales_quick_service FOREIGN KEY (quick_service_id) REFERENCES public.daily_quick_services(id) ON DELETE SET NULL;


-- 11. Create employee_earnings table (Cálculo de comisiones por trabajo)
CREATE TABLE IF NOT EXISTS public.employee_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    quick_service_id UUID REFERENCES public.daily_quick_services(id) ON DELETE SET NULL,
    amount_earned DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employee_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view employee_earnings in their tenant"
    ON public.employee_earnings FOR SELECT
    USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can manage employee_earnings in their tenant"
    ON public.employee_earnings FOR ALL
    USING (tenant_id = get_my_tenant_id())
    WITH CHECK (tenant_id = get_my_tenant_id());

CREATE INDEX IF NOT EXISTS idx_earnings_tenant ON public.employee_earnings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_earnings_employee ON public.employee_earnings(employee_id);


-- 12. Triggers for boxes status and timestamps on work order status change
CREATE OR REPLACE FUNCTION fn_release_box_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Transition to completed/Finalizado
    IF NEW.status = 'Finalizado' AND OLD.status != 'Finalizado' THEN
        NEW.completed_at := NOW();
        IF NEW.box_id IS NOT NULL THEN
            UPDATE public.boxes SET status = 'Libre', assigned_mechanic_id = NULL WHERE id = NEW.box_id;
        END IF;
    END IF;
    
    -- Transition to En Box
    IF NEW.status = 'En Box' AND OLD.status != 'En Box' THEN
        NEW.started_at := NOW();
        IF NEW.box_id IS NOT NULL THEN
            UPDATE public.boxes SET status = 'Ocupado', assigned_mechanic_id = NEW.assigned_mechanic_id WHERE id = NEW.box_id;
        END IF;
    END IF;
    
    -- Transition to Cancelado
    IF NEW.status = 'Cancelado' AND OLD.status != 'Cancelado' THEN
        IF NEW.box_id IS NOT NULL THEN
            UPDATE public.boxes SET status = 'Libre', assigned_mechanic_id = NULL WHERE id = NEW.box_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_release_box_status ON public.work_orders;
CREATE TRIGGER trg_release_box_status
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_release_box_on_status_change();


-- 13. Create vehicle_notes table
CREATE TABLE IF NOT EXISTS public.vehicle_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    km INTEGER,
    cost DECIMAL(12,2) DEFAULT 0,
    technician TEXT,
    note_type TEXT DEFAULT 'MANUAL',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicle_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage vehicle_notes in their tenant"
    ON public.vehicle_notes FOR ALL
    USING (tenant_id = get_my_tenant_id())
    WITH CHECK (tenant_id = get_my_tenant_id());

CREATE INDEX IF NOT EXISTS idx_vehicle_notes_tenant ON public.vehicle_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_notes_vehicle ON public.vehicle_notes(vehicle_id);


-- 14. Auto-update updated_at trigger for new tables
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 15. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
