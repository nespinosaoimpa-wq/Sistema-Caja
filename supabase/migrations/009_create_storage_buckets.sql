-- ============================================================
-- STORAGE BUCKETS & RLS POLICIES FOR SMART CAJA
-- ============================================================

-- 1. Crear los buckets si no existen
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS en objetos de almacenamiento
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "Allow public read access for tenant-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert for tenant-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete for tenant-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update for tenant-logos" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update for product-images" ON storage.objects;

-- 4. Definir políticas para el bucket 'tenant-logos'
CREATE POLICY "Allow public read access for tenant-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');

CREATE POLICY "Allow authenticated insert for tenant-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tenant-logos');

CREATE POLICY "Allow authenticated delete for tenant-logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-logos');

CREATE POLICY "Allow authenticated update for tenant-logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-logos');

-- 5. Definir políticas para el bucket 'product-images'
CREATE POLICY "Allow public read access for product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated insert for product-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated delete for product-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated update for product-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');
