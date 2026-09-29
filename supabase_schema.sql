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
  sample_type TEXT NOT NULL DEFAULT 'Initial Sample',
  sample_color_tone TEXT NOT NULL DEFAULT 'white',
  color TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  size_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
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
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS sample_color_tone TEXT NOT NULL DEFAULT 'white';
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS size_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.samples ALTER COLUMN sample_type SET DEFAULT 'Initial Sample';

-- Automatically assign sample_color_tone ('gold' for Gold Seal, 'red' for Red Seal, 'white' for Initial)
CREATE OR REPLACE FUNCTION public.sync_sample_color_tone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF LOWER(COALESCE(NEW.sample_type, '')) LIKE '%gold%' THEN
    NEW.sample_color_tone := 'gold';
  ELSIF LOWER(COALESCE(NEW.sample_type, '')) LIKE '%red%' THEN
    NEW.sample_color_tone := 'red';
  ELSIF LOWER(COALESCE(NEW.sample_type, '')) LIKE '%initial%' OR LOWER(COALESCE(NEW.sample_type, '')) = 'init' THEN
    NEW.sample_color_tone := 'white';
  ELSE
    NEW.sample_color_tone := COALESCE(NULLIF(NEW.sample_color_tone, ''), 'default');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_sample_color_tone ON public.samples;
CREATE TRIGGER trg_sync_sample_color_tone
  BEFORE INSERT OR UPDATE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.sync_sample_color_tone();

-- Backfill existing rows in public.samples with their matching color tone (gold, red, white)
UPDATE public.samples
SET sample_color_tone = CASE
  WHEN LOWER(sample_type) LIKE '%gold%' THEN 'gold'
  WHEN LOWER(sample_type) LIKE '%red%' THEN 'red'
  WHEN LOWER(sample_type) LIKE '%initial%' THEN 'white'
  ELSE 'default'
END;

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
  '["Initial Sample", "Red Seal Sample", "Gold Seal Sample"]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Ensure Initial Sample, Red Seal Sample, and Gold Seal Sample are included in existing requisition_options without removing user-added types
UPDATE public.requisition_options
SET sample_types = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM jsonb_array_elements_text(
    COALESCE(sample_types, '[]'::jsonb) || '["Initial Sample", "Red Seal Sample", "Gold Seal Sample"]'::jsonb
  ) AS t(elem)
)
WHERE id = 'default';

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

-- =====================================================================================
-- 11. PER-PCS FABRIC CONSUMPTION (YDS) & AUTO INVENTORY DEDUCTION COLUMNS
-- =====================================================================================
ALTER TABLE public.samples
  ADD COLUMN IF NOT EXISTS per_pcs_consumption_yards NUMERIC DEFAULT 1.5;

ALTER TABLE public.fabrics
  ADD COLUMN IF NOT EXISTS per_pcs_consumption_yards NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS style_consumption_map JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.requisition_options
  ADD COLUMN IF NOT EXISTS per_pcs_consumption_yards NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS per_pcs_consumption_options JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS style_consumption_map JSONB DEFAULT '{}'::jsonb;

-- Backfill existing samples where per_pcs_consumption_yards is null or 0
UPDATE public.samples
SET per_pcs_consumption_yards = ROUND(
  (COALESCE(fabric_required_yards, 1.5) / GREATEST(COALESCE(quantity, 1), 1))::numeric,
  2
)
WHERE per_pcs_consumption_yards IS NULL OR per_pcs_consumption_yards <= 0;

-- Database function: Respects manual per_pcs_consumption_yards when entered by user,
-- or falls back to saved per_pcs_consumption_yards for the style/fabric,
-- and calculates exact fabric_required_yards = per_pcs_consumption_yards * quantity
CREATE OR REPLACE FUNCTION public.fn_sync_sample_fabric_consumption()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_saved_per_pcs NUMERIC := 0;
  v_style_key TEXT := UPPER(TRIM(COALESCE(NEW.style_code, '')));
BEGIN
  -- 1. Look up saved per_pcs_consumption_yards for this style or fabric
  IF NEW.fabric_id IS NOT NULL AND NEW.fabric_id <> '' THEN
    SELECT
      COALESCE(
        (style_consumption_map ->> v_style_key)::numeric,
        NULLIF(per_pcs_consumption_yards, 0),
        0
      )
    INTO v_saved_per_pcs
    FROM public.fabrics
    WHERE id = NEW.fabric_id
    LIMIT 1;
  END IF;

  IF (v_saved_per_pcs IS NULL OR v_saved_per_pcs <= 0) THEN
    SELECT
      COALESCE(
        (style_consumption_map ->> v_style_key)::numeric,
        NULLIF(per_pcs_consumption_yards, 0),
        0
      )
    INTO v_saved_per_pcs
    FROM public.requisition_options
    WHERE id = 'default'
    LIMIT 1;
  END IF;

  -- 2. Use manual per_pcs_consumption_yards if provided (> 0), otherwise use saved consumption
  IF NEW.per_pcs_consumption_yards IS NOT NULL AND NEW.per_pcs_consumption_yards > 0 THEN
    NEW.per_pcs_consumption_yards := ROUND(NEW.per_pcs_consumption_yards::numeric, 2);
  ELSIF v_saved_per_pcs IS NOT NULL AND v_saved_per_pcs > 0 THEN
    NEW.per_pcs_consumption_yards := ROUND(v_saved_per_pcs::numeric, 2);
  ELSE
    NEW.per_pcs_consumption_yards := ROUND(
      (COALESCE(NEW.fabric_required_yards, 1.5) / GREATEST(COALESCE(NEW.quantity, 1), 1))::numeric,
      2
    );
  END IF;

  -- 3. Calculate exact total fabric required in yards = per_pcs_consumption_yards * total quantity
  NEW.fabric_required_yards := ROUND(
    (NEW.per_pcs_consumption_yards * GREATEST(COALESCE(NEW.quantity, 1), 1))::numeric,
    2
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_sample_fabric_consumption ON public.samples;
CREATE TRIGGER trg_sync_sample_fabric_consumption
  BEFORE INSERT OR UPDATE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_sample_fabric_consumption();

-- =====================================================================================
-- 12. 3-ROLE USER LOGIN SYSTEM (MERCHANDISER, SEWING, WASH) & SEEDED ACCOUNTS
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('merchandiser', 'sewing', 'wash')),
  department TEXT DEFAULT '',
  permissions_summary TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Remove legacy sewing user 'sohag' completely
DELETE FROM public.app_users WHERE LOWER(username) = 'sohag';

-- Seed the 6 active accounts:
-- 5 Merchandisers / General Users: zahid, animesh, rakib, hasan, nishi
-- 1 Wash user: arian
INSERT INTO public.app_users (id, username, display_name, password, role, department, permissions_summary, is_active)
VALUES
  (
    'usr-merchandiser-zahid',
    'zahid',
    'Zahid',
    'zahid1234',
    'merchandiser',
    'Merchandising Department',
    'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
    TRUE
  ),
  (
    'usr-merchandiser-animesh',
    'animesh',
    'Animesh',
    'animesh2345',
    'merchandiser',
    'Merchandising Department',
    'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
    TRUE
  ),
  (
    'usr-merchandiser-rakib',
    'rakib',
    'Rakib',
    'rakib3456',
    'merchandiser',
    'Merchandising Department',
    'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
    TRUE
  ),
  (
    'usr-merchandiser-hasan',
    'hasan',
    'Hasan',
    'hasan4567',
    'merchandiser',
    'Merchandising Department',
    'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
    TRUE
  ),
  (
    'usr-merchandiser-nishi',
    'nishi',
    'Nishi',
    'nishi5678',
    'merchandiser',
    'Merchandising Department',
    'Full General User Access — Create requisitions, manage all sample stages, fabric inventory, BV lab tests & approvals.',
    TRUE
  ),
  (
    'usr-wash-arian',
    'arian',
    'Arian',
    'arian6789',
    'wash',
    'Washing & Wet Processing Plant',
    'Wash Restricted Access — View Sewing Status samples (and active Wash samples) only; move Sewing → Wash and Wash → Finishing only.',
    TRUE
  )
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  permissions_summary = EXCLUDED.permissions_summary,
  is_active = TRUE,
  updated_at = NOW();

-- Protect app_users from frontend deletion & enable RLS
DROP TRIGGER IF EXISTS trg_no_frontend_delete_app_users ON public.app_users;
CREATE TRIGGER trg_no_frontend_delete_app_users
  BEFORE DELETE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_frontend_delete();

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Frontend select app_users" ON public.app_users;
DROP POLICY IF EXISTS "Frontend insert app_users" ON public.app_users;
DROP POLICY IF EXISTS "Frontend update app_users" ON public.app_users;

CREATE POLICY "Frontend select app_users" ON public.app_users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Frontend insert app_users" ON public.app_users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Frontend update app_users" ON public.app_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
  END IF;
END $$;

-- =====================================================================================
-- 13. MULTI-COLOR REQUISITION, SIZE NAME, TOTAL REQUISITION QUANTITY & PRIORITY SYNC
-- =====================================================================================
ALTER TABLE public.samples
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS color_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS size TEXT NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS size_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS priority_color_tone TEXT NOT NULL DEFAULT 'white';

-- Trigger function to automatically synchronize:
--   1. color (Colorway Name string for same style, e.g. 'Dark Indigo, Jet Black, Olive Drab')
--   2. color_breakdown (Per-color breakdown JSONB array: [{color, wash, sizes, quantity}])
--   3. size (Size Name string, e.g. '32, 34, 36' or 'M, L')
--   4. size_breakdown (Per-size breakdown JSONB array)
--   5. quantity (Total Requisition Quantity in Pcs summed across colors/sizes)
--   6. priority_color_tone ('white' for normal, 'light_red' for high, 'red' for urgent)
CREATE OR REPLACE FUNCTION public.fn_sync_sample_size_qty_and_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_size_names TEXT;
  v_size_total_qty INTEGER;
  v_color_names TEXT;
  v_color_total_qty INTEGER;
  v_default_wash TEXT;
BEGIN
  -- Normalize priority ('normal', 'high', 'urgent') and set priority_color_tone
  NEW.priority := LOWER(TRIM(COALESCE(NULLIF(NEW.priority, ''), 'normal')));
  IF NEW.priority NOT IN ('normal', 'high', 'urgent') THEN
    NEW.priority := 'normal';
  END IF;

  NEW.priority_color_tone := CASE
    WHEN NEW.priority = 'urgent' THEN 'red'
    WHEN NEW.priority = 'high' THEN 'light_red'
    ELSE 'white'
  END;

  -- If size_breakdown is empty in column, check requisition_form->'sizeBreakdown'
  IF (NEW.size_breakdown IS NULL OR jsonb_typeof(NEW.size_breakdown) <> 'array' OR jsonb_array_length(NEW.size_breakdown) = 0)
     AND NEW.requisition_form IS NOT NULL
     AND jsonb_typeof(NEW.requisition_form -> 'sizeBreakdown') = 'array'
     AND jsonb_array_length(NEW.requisition_form -> 'sizeBreakdown') > 0 THEN
    NEW.size_breakdown := NEW.requisition_form -> 'sizeBreakdown';
  END IF;

  -- Extract Size Name(s) and Size Total Quantity from size_breakdown if present
  IF NEW.size_breakdown IS NOT NULL
     AND jsonb_typeof(NEW.size_breakdown) = 'array'
     AND jsonb_array_length(NEW.size_breakdown) > 0 THEN
    SELECT
      STRING_AGG(TRIM(COALESCE(elem ->> 'size', '')), ', '),
      SUM(GREATEST(COALESCE((elem ->> 'quantity')::integer, 1), 1))
    INTO v_size_names, v_size_total_qty
    FROM jsonb_array_elements(NEW.size_breakdown) AS elem
    WHERE TRIM(COALESCE(elem ->> 'size', '')) <> '';

    IF v_size_names IS NOT NULL AND v_size_names <> '' THEN
      NEW.size := v_size_names;
    END IF;

    IF v_size_total_qty IS NOT NULL AND v_size_total_qty > 0 THEN
      NEW.quantity := GREATEST(COALESCE(NEW.quantity, 1), v_size_total_qty);
    END IF;
  END IF;

  -- Ensure size name and quantity are never empty or zero
  NEW.size := COALESCE(NULLIF(TRIM(NEW.size), ''), 'Standard');
  NEW.quantity := GREATEST(COALESCE(NEW.quantity, 1), 1);

  -- If size_breakdown is still empty, build a default breakdown entry from size & quantity
  IF NEW.size_breakdown IS NULL
     OR jsonb_typeof(NEW.size_breakdown) <> 'array'
     OR jsonb_array_length(NEW.size_breakdown) = 0 THEN
    NEW.size_breakdown := jsonb_build_array(
      jsonb_build_object('size', NEW.size, 'quantity', NEW.quantity)
    );
  END IF;

  -- If color_breakdown is empty in column, check requisition_form->'colorBreakdown'
  IF (NEW.color_breakdown IS NULL OR jsonb_typeof(NEW.color_breakdown) <> 'array' OR jsonb_array_length(NEW.color_breakdown) = 0)
     AND NEW.requisition_form IS NOT NULL
     AND jsonb_typeof(NEW.requisition_form -> 'colorBreakdown') = 'array'
     AND jsonb_array_length(NEW.requisition_form -> 'colorBreakdown') > 0 THEN
    NEW.color_breakdown := NEW.requisition_form -> 'colorBreakdown';
  END IF;

  -- Extract Colorway Name(s) and Color Total Quantity from color_breakdown if present
  IF NEW.color_breakdown IS NOT NULL
     AND jsonb_typeof(NEW.color_breakdown) = 'array'
     AND jsonb_array_length(NEW.color_breakdown) > 0 THEN
    SELECT
      STRING_AGG(TRIM(COALESCE(elem ->> 'color', '')), ', '),
      SUM(GREATEST(COALESCE((elem ->> 'quantity')::integer, 1), 1))
    INTO v_color_names, v_color_total_qty
    FROM jsonb_array_elements(NEW.color_breakdown) AS elem
    WHERE TRIM(COALESCE(elem ->> 'color', '')) <> '';

    IF v_color_names IS NOT NULL AND v_color_names <> '' THEN
      NEW.color := v_color_names;
    END IF;

    IF v_color_total_qty IS NOT NULL AND v_color_total_qty > 0 THEN
      NEW.quantity := GREATEST(COALESCE(NEW.quantity, 1), v_color_total_qty);
    END IF;
  END IF;

  NEW.color := COALESCE(NULLIF(TRIM(NEW.color), ''), 'Standard');
  v_default_wash := COALESCE(NULLIF(TRIM(NEW.wash_details ->> 'washType'), ''), 'Standard Wash');

  -- If color_breakdown is still empty, build a default breakdown entry from color, wash, size & quantity
  IF NEW.color_breakdown IS NULL
     OR jsonb_typeof(NEW.color_breakdown) <> 'array'
     OR jsonb_array_length(NEW.color_breakdown) = 0 THEN
    NEW.color_breakdown := jsonb_build_array(
      jsonb_build_object(
        'color', NEW.color,
        'wash', v_default_wash,
        'sizes', NEW.size,
        'quantity', NEW.quantity
      )
    );
  END IF;

  -- Keep requisition_form JSONB in sync with colorBreakdown and sizeBreakdown
  IF NEW.requisition_form IS NOT NULL AND jsonb_typeof(NEW.requisition_form) = 'object' THEN
    NEW.requisition_form := jsonb_set(
      jsonb_set(
        NEW.requisition_form,
        '{sizeBreakdown}',
        NEW.size_breakdown,
        true
      ),
      '{colorBreakdown}',
      NEW.color_breakdown,
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_sample_size_qty_and_priority ON public.samples;
CREATE TRIGGER trg_sync_sample_size_qty_and_priority
  BEFORE INSERT OR UPDATE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_sample_size_qty_and_priority();

-- Backfill all existing samples so every style has Colorway Breakdown, Size Name,
-- Total Requisition Quantity, Size Breakdown, and Priority Color Tone populated
UPDATE public.samples
SET
  color = COALESCE(NULLIF(TRIM(color), ''), 'Standard'),
  size = COALESCE(NULLIF(TRIM(size), ''), 'Standard'),
  quantity = GREATEST(COALESCE(quantity, 1), 1),
  priority = COALESCE(NULLIF(LOWER(TRIM(priority)), ''), 'normal'),
  updated_at = NOW();

-- =====================================================================================
-- 14. FABRIC SHORTAGE SUPPLIER AWB TRACKING & AUTO-RESTOCK ON ARRIVAL
-- =====================================================================================
-- 1. Add AWB tracking columns to public.fabrics
ALTER TABLE public.fabrics
  ADD COLUMN IF NOT EXISTS pending_awb_number TEXT NOT NULL DEFAULT '';

ALTER TABLE public.fabrics
  ADD COLUMN IF NOT EXISTS pending_awb_yards NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.fabrics
  ADD COLUMN IF NOT EXISTS awb_shipments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Trigger function to keep pending_awb_number and pending_awb_yards synced with awb_shipments
CREATE OR REPLACE FUNCTION public.fn_sync_fabric_awb_shipments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_latest_awb TEXT;
  v_total_pending_yards NUMERIC(10, 2);
BEGIN
  IF NEW.awb_shipments IS NULL OR jsonb_typeof(NEW.awb_shipments) <> 'array' THEN
    NEW.awb_shipments := '[]'::jsonb;
  END IF;

  -- Find the latest in-transit AWB number and total in-transit yards
  SELECT
    (
      SELECT TRIM(COALESCE(elem ->> 'awbNumber', ''))
      FROM jsonb_array_elements(NEW.awb_shipments) AS elem
      WHERE COALESCE(elem ->> 'status', 'in_transit') = 'in_transit'
        AND TRIM(COALESCE(elem ->> 'awbNumber', '')) <> ''
      LIMIT 1
    ),
    COALESCE(
      SUM(GREATEST(COALESCE((elem ->> 'expectedYards')::numeric, 0), 0))
      FILTER (
        WHERE COALESCE(elem ->> 'status', 'in_transit') = 'in_transit'
          AND TRIM(COALESCE(elem ->> 'awbNumber', '')) <> ''
      ),
      0
    )
  INTO v_latest_awb, v_total_pending_yards
  FROM jsonb_array_elements(NEW.awb_shipments) AS elem;

  NEW.pending_awb_number := COALESCE(v_latest_awb, '');
  NEW.pending_awb_yards := COALESCE(v_total_pending_yards, 0);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_fabric_awb_shipments ON public.fabrics;
CREATE TRIGGER trg_sync_fabric_awb_shipments
  BEFORE INSERT OR UPDATE ON public.fabrics
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_fabric_awb_shipments();

-- 3. Helper SQL Function to confirm a specific AWB arrival and automatically add its yards to available_yards
CREATE OR REPLACE FUNCTION public.confirm_fabric_awb_arrival(
  p_fabric_id TEXT,
  p_awb_number TEXT
)
RETURNS public.fabrics
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fabric public.fabrics;
  v_added_yards NUMERIC(10, 2) := 0;
  v_updated_shipments JSONB := '[]'::jsonb;
  v_elem JSONB;
BEGIN
  SELECT * INTO v_fabric
  FROM public.fabrics
  WHERE id = p_fabric_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fabric % not found', p_fabric_id;
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(COALESCE(v_fabric.awb_shipments, '[]'::jsonb))
  LOOP
    IF COALESCE(v_elem ->> 'status', 'in_transit') = 'in_transit'
       AND (
         LOWER(TRIM(COALESCE(v_elem ->> 'awbNumber', ''))) = LOWER(TRIM(p_awb_number))
         OR TRIM(COALESCE(v_elem ->> 'id', '')) = TRIM(p_awb_number)
       ) THEN
      v_added_yards := v_added_yards + GREATEST(COALESCE((v_elem ->> 'expectedYards')::numeric, 0), 0);
      v_elem := jsonb_set(v_elem, '{status}', '"arrived"'::jsonb, true);
      v_elem := jsonb_set(v_elem, '{arrivedAt}', to_jsonb(NOW()::text), true);
    END IF;
    v_updated_shipments := v_updated_shipments || jsonb_build_array(v_elem);
  END LOOP;

  UPDATE public.fabrics
  SET
    available_yards = ROUND((COALESCE(available_yards, 0) + v_added_yards)::numeric, 2),
    last_restocked_date = TO_CHAR(NOW(), 'YYYY-MM-DD'),
    awb_shipments = v_updated_shipments,
    updated_at = NOW()
  WHERE id = p_fabric_id
  RETURNING * INTO v_fabric;

  RETURN v_fabric;
END;
$$;



