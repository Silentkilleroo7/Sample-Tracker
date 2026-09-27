-- =====================================================================================
-- GA SAMPLE TRACKING MASTER (THREADTRACK PRO 4.0) - UPDATED SUPABASE SQL SCRIPT
-- PERMANENT RECORD PROTECTION: Once data is inputted into the system, it CANNOT be
-- deleted from the frontend system directly (SELECT, INSERT, UPDATE only; DELETE blocked).
-- Copy & Run this single SQL command in Supabase Dashboard -> SQL Editor -> New Query
-- =====================================================================================

-- Enable UUID generation extension
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
-- 2. SAMPLES PIPELINE TABLE (Tracks Requisition, Stored Styles, Color/Wash/Size Changes,
--    Thread/Zipper/Button Notes, Locked Status, Shipment Date, and Approvals)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.samples (
  id TEXT PRIMARY KEY,
  style_code TEXT NOT NULL,
  style_name TEXT NOT NULL,
  buyer TEXT NOT NULL,
  po_number TEXT NOT NULL DEFAULT '',
  line_code TEXT NOT NULL DEFAULT '',
  sample_type TEXT NOT NULL DEFAULT 'Proto Sample',
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
  thread_note TEXT NOT NULL DEFAULT '',
  zipper_note TEXT NOT NULL DEFAULT '',
  button_note TEXT NOT NULL DEFAULT '',
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

-- Safe migration columns for existing deployments
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS shipment_date TEXT NOT NULL DEFAULT '';
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS is_requisition_locked BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS thread_note TEXT NOT NULL DEFAULT '';
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS zipper_note TEXT NOT NULL DEFAULT '';
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS button_note TEXT NOT NULL DEFAULT '';

-- Index on style_code for fast lookup when selecting stored styles from database
CREATE INDEX IF NOT EXISTS idx_samples_style_code ON public.samples (style_code);

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
-- 5. REQUISITION OPTIONS TABLE (Stores User-Entered Sizes, Buyers, Lines, Colors, Washes)
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

-- Initialize default row ONLY if it does not exist yet (NEVER overwrite existing inputted options!)
INSERT INTO public.requisition_options (
  id, buyers, line_codes, sample_types, sizes, colors, wash_types, couriers
) VALUES (
  'default',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- =====================================================================================
-- 6. STYLE PHOTOS METADATA TABLE (Logs Uploaded Product Pictures)
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
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================================================
-- 8. DATABASE TRIGGER: BLOCK DIRECT DELETION FROM FRONTEND SYSTEM (anon / authenticated)
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.prevent_frontend_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'Permanent Record Protection: Once data has been inputted into the system, it cannot be deleted from the frontend system directly.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_no_frontend_delete_fabrics ON public.fabrics;
CREATE TRIGGER trg_no_frontend_delete_fabrics
  BEFORE DELETE ON public.fabrics
  FOR EACH ROW EXECUTE FUNCTION public.prevent_frontend_delete();

DROP TRIGGER IF EXISTS trg_no_frontend_delete_samples ON public.samples;
CREATE TRIGGER trg_no_frontend_delete_samples
  BEFORE DELETE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.prevent_frontend_delete();

DROP TRIGGER IF EXISTS trg_no_frontend_delete_bv_tests ON public.bv_tests;
CREATE TRIGGER trg_no_frontend_delete_bv_tests
  BEFORE DELETE ON public.bv_tests
  FOR EACH ROW EXECUTE FUNCTION public.prevent_frontend_delete();

DROP TRIGGER IF EXISTS trg_no_frontend_delete_notifications ON public.notifications;
CREATE TRIGGER trg_no_frontend_delete_notifications
  BEFORE DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_frontend_delete();

DROP TRIGGER IF EXISTS trg_no_frontend_delete_req_options ON public.requisition_options;
CREATE TRIGGER trg_no_frontend_delete_req_options
  BEFORE DELETE ON public.requisition_options
  FOR EACH ROW EXECUTE FUNCTION public.prevent_frontend_delete();

DROP TRIGGER IF EXISTS trg_no_frontend_delete_style_photos ON public.style_photos;
CREATE TRIGGER trg_no_frontend_delete_style_photos
  BEFORE DELETE ON public.style_photos
  FOR EACH ROW EXECUTE FUNCTION public.prevent_frontend_delete();

-- =====================================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES: SELECT, INSERT, UPDATE ONLY (NO FRONTEND DELETE)
-- =====================================================================================
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bv_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_photos ENABLE ROW LEVEL SECURITY;

-- Drop legacy FOR ALL policies that allowed DELETE
DROP POLICY IF EXISTS "Allow full access to fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Allow full access to samples" ON public.samples;
DROP POLICY IF EXISTS "Allow full access to bv_tests" ON public.bv_tests;
DROP POLICY IF EXISTS "Allow full access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow full access to requisition_options" ON public.requisition_options;
DROP POLICY IF EXISTS "Allow full access to style_photos" ON public.style_photos;

-- Drop and recreate explicit SELECT, INSERT, UPDATE policies (Zero DELETE policies for frontend)
DROP POLICY IF EXISTS "Frontend select fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Frontend insert fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Frontend update fabrics" ON public.fabrics;
CREATE POLICY "Frontend select fabrics" ON public.fabrics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Frontend insert fabrics" ON public.fabrics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Frontend update fabrics" ON public.fabrics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Frontend select samples" ON public.samples;
DROP POLICY IF EXISTS "Frontend insert samples" ON public.samples;
DROP POLICY IF EXISTS "Frontend update samples" ON public.samples;
CREATE POLICY "Frontend select samples" ON public.samples FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Frontend insert samples" ON public.samples FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Frontend update samples" ON public.samples FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Frontend select bv_tests" ON public.bv_tests;
DROP POLICY IF EXISTS "Frontend insert bv_tests" ON public.bv_tests;
DROP POLICY IF EXISTS "Frontend update bv_tests" ON public.bv_tests;
CREATE POLICY "Frontend select bv_tests" ON public.bv_tests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Frontend insert bv_tests" ON public.bv_tests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Frontend update bv_tests" ON public.bv_tests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Frontend select notifications" ON public.notifications;
DROP POLICY IF EXISTS "Frontend insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Frontend update notifications" ON public.notifications;
CREATE POLICY "Frontend select notifications" ON public.notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Frontend insert notifications" ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Frontend update notifications" ON public.notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Frontend select requisition_options" ON public.requisition_options;
DROP POLICY IF EXISTS "Frontend insert requisition_options" ON public.requisition_options;
DROP POLICY IF EXISTS "Frontend update requisition_options" ON public.requisition_options;
CREATE POLICY "Frontend select requisition_options" ON public.requisition_options FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Frontend insert requisition_options" ON public.requisition_options FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Frontend update requisition_options" ON public.requisition_options FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Frontend select style_photos" ON public.style_photos;
DROP POLICY IF EXISTS "Frontend insert style_photos" ON public.style_photos;
DROP POLICY IF EXISTS "Frontend update style_photos" ON public.style_photos;
CREATE POLICY "Frontend select style_photos" ON public.style_photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Frontend insert style_photos" ON public.style_photos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Frontend update style_photos" ON public.style_photos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Storage Bucket Policies for 'style-photos' (View, Upload, Update ONLY - No Frontend Delete)
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

-- =====================================================================================
-- 10. ENABLE REALTIME SUBSCRIPTIONS FOR LIVE MULTI-USER SYNC
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
