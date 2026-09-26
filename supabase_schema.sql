-- =====================================================================================
-- GA SAMPLE TRACKING MASTER (THREADTRACK PRO 4.0) - SUPABASE COMPLETE SQL SCHEMA
-- Run this entire script inside your Supabase Dashboard -> SQL Editor -> New Query
-- =====================================================================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- 1. FABRICS INVENTORY TABLE (Tracks Fabric Rolls, Yards, and <= 5 Yards Red Alerts)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.fabrics (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  linked_style_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  composition TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  gsm NUMERIC NOT NULL DEFAULT 0,
  width_inches NUMERIC NOT NULL DEFAULT 58,
  available_yards NUMERIC NOT NULL DEFAULT 0,
  allocated_yards NUMERIC NOT NULL DEFAULT 0,
  minimum_threshold_yards NUMERIC NOT NULL DEFAULT 5,
  supplier TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  last_received_date TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- 2. SAMPLES PIPELINE TABLE (Tracks Requisition, Sewing, Wash, Finishing, Parcel, Approval, & Product Photos)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.samples (
  id TEXT PRIMARY KEY,
  style_code TEXT NOT NULL,
  style_name TEXT NOT NULL,
  buyer TEXT NOT NULL,
  po_number TEXT NOT NULL DEFAULT '',
  line_code TEXT NOT NULL DEFAULT '',
  sample_type TEXT NOT NULL DEFAULT 'Red Seal Sample',
  color TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  fabric_id TEXT NOT NULL DEFAULT '',
  fabric_code TEXT NOT NULL DEFAULT '',
  fabric_name TEXT NOT NULL DEFAULT '',
  fabric_required_yards NUMERIC NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'requisition',
  priority TEXT NOT NULL DEFAULT 'normal',
  target_parcel_date TEXT NOT NULL DEFAULT '',
  shipment_date TEXT NOT NULL DEFAULT '',
  is_requisition_locked BOOLEAN NOT NULL DEFAULT TRUE,
  thumbnail TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  stage_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  sewing_operator TEXT,
  wash_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  finishing_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  parcel_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  requisition_form JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe migration for existing deployments
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS shipment_date TEXT NOT NULL DEFAULT '';
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS is_requisition_locked BOOLEAN NOT NULL DEFAULT TRUE;

-- =====================================================================================
-- 3. BUREAU VERITAS (BV) LAB TESTS TABLE (Tracks Lab Tests & 24-Hour Re-Test Alerts)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.bv_tests (
  id TEXT PRIMARY KEY,
  sample_type TEXT NOT NULL DEFAULT 'garment',
  sample_id TEXT,
  style_code TEXT,
  style_name TEXT,
  po_number TEXT,
  fabric_code TEXT,
  fabric_name TEXT,
  buyer TEXT NOT NULL DEFAULT '',
  testing_agency TEXT NOT NULL DEFAULT '',
  test_package TEXT NOT NULL DEFAULT '',
  test_parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  sent_date TEXT NOT NULL DEFAULT '',
  expected_date TEXT NOT NULL DEFAULT '',
  result_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  report_number TEXT,
  overall_result TEXT DEFAULT 'PENDING',
  fail_reason TEXT,
  failed_parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  re_test_required BOOLEAN NOT NULL DEFAULT FALSE,
  failed_timestamp TEXT,
  resubmit_due_timestamp TEXT,
  resubmitted_date TEXT,
  resubmission_notes TEXT,
  previous_report_number TEXT,
  retest_report_number TEXT,
  retest_result_date TEXT,
  inspector_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- 4. PUSH NOTIFICATIONS & ALERT LOGS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  sample_id TEXT,
  fabric_code TEXT,
  style_code TEXT
);

-- =====================================================================================
-- 5. REQUISITION OPTIONS TABLE (Persistent Buyers, Sewing Lines, Wash Recipes, Couriers)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.requisition_options (
  id TEXT PRIMARY KEY DEFAULT 'default',
  buyers JSONB NOT NULL DEFAULT '[]'::jsonb,
  line_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  wash_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  couriers JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial dropdown options if not already present
INSERT INTO public.requisition_options (
  id, buyers, line_codes, sample_types, sizes, colors, wash_types, couriers
) VALUES (
  'default',
  '["Levi Strauss & Co.", "Zara / Inditex", "Tommy Hilfiger", "COS / H&M Group", "Represent Clo / UK", "Urban Outfitters", "Club Monaco", "Massimo Dutti", "Nudie Jeans Co.", "G-Star RAW", "Calvin Klein Jeans"]'::jsonb,
  '[{"code":"LINE-A01","label":"LINE-A01 (Woven Tops)"},{"code":"LINE-A02","label":"LINE-A02 (Shirts)"},{"code":"LINE-B02","label":"LINE-B02 (Chino Bottoms)"},{"code":"LINE-B05","label":"LINE-B05 (Cargo Pants)"},{"code":"LINE-D01","label":"LINE-D01 (Rigid Denim)"},{"code":"LINE-D02","label":"LINE-D02 (Stretch Denim)"},{"code":"LINE-D03","label":"LINE-D03 (Denim Jackets)"},{"code":"LINE-K01","label":"LINE-K01 (Heavy Knits / Hoodies)"},{"code":"LINE-K04","label":"LINE-K04 (T-Shirts / Jersey)"}]'::jsonb,
  '["Proto Sample", "Fit Sample", "Salesman Sample (SMS)", "Red Seal Sample", "TOP Sample", "Gold Seal Sample", "Size Set Sample", "Photo Shoot Sample"]'::jsonb,
  '["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38"]'::jsonb,
  '["Vintage Indigo", "Desert Sand Khaki", "Washed Black Carbon", "Vintage Bone / Ecru", "Raw Indigo", "Washed Olive", "Bleach Blue", "Natural Ecru", "Charcoal Heather", "Dusty Sage"]'::jsonb,
  '["Bio-Enzyme Stone Wash", "Bleach Stone Wash", "Vintage Acid Burnout Wash", "Ozone Cold Bleach Rinse", "Neutral Enzyme Bath + Softening", "Resin 3D Whiskers + Tint", "Raw / Rinse Wash", "Super Heavy Enzyme + Destroy", "Silicone Peach Soft Finish"]'::jsonb,
  '["DHL Express Worldwide", "FedEx Priority", "UPS Worldwide Express", "Aramex Global", "TNT Express"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- =====================================================================================
-- 6. STYLE PHOTOS METADATA TABLE (Logs Every Uploaded Product Picture)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.style_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id TEXT,
  style_code TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- 7. SUPABASE STORAGE BUCKET FOR PRODUCT PHOTO UPLOADS ('style-photos')
-- =====================================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'style-photos',
  'style-photos',
  true,
  10485760, -- 10 MB per photo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================================================
-- 8. ROW LEVEL SECURITY (RLS) & POLICIES FOR PUBLIC/ANON VERCEL CLIENT ACCESS
-- =====================================================================================
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bv_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running script
DROP POLICY IF EXISTS "Allow full access to fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Allow full access to samples" ON public.samples;
DROP POLICY IF EXISTS "Allow full access to bv_tests" ON public.bv_tests;
DROP POLICY IF EXISTS "Allow full access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow full access to requisition_options" ON public.requisition_options;
DROP POLICY IF EXISTS "Allow full access to style_photos" ON public.style_photos;

CREATE POLICY "Allow full access to fabrics"
  ON public.fabrics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to samples"
  ON public.samples FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to bv_tests"
  ON public.bv_tests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to notifications"
  ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to requisition_options"
  ON public.requisition_options FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to style_photos"
  ON public.style_photos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Storage Bucket Policies for 'style-photos'
DROP POLICY IF EXISTS "Public View Style Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Style Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Style Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Style Photos" ON storage.objects;

CREATE POLICY "Public View Style Photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'style-photos');

CREATE POLICY "Public Upload Style Photos"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'style-photos');

CREATE POLICY "Public Update Style Photos"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'style-photos');

CREATE POLICY "Public Delete Style Photos"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'style-photos');

-- =====================================================================================
-- 9. ENABLE REALTIME SUBSCRIPTIONS FOR LIVE MULTI-USER SYNC
-- =====================================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'samples'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.samples;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fabrics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fabrics;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bv_tests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bv_tests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'requisition_options'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.requisition_options;
  END IF;
END $$;
