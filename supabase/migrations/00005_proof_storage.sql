-- ============================================================================
-- PROOF STORAGE — Table + Supabase Storage bucket + RLS
-- ============================================================================
--
-- Manual dashboard setup (if migration cannot run automatically):
--
--   1. Go to Supabase Dashboard → Storage → New bucket
--      - Name: "proof"
--      - Public bucket: ON
--      - Max file size: 10485760 (10 MB)
--      - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif,
--        application/pdf, video/mp4, video/quicktime
--
--   2. Go to SQL Editor and run everything below starting from "PROOFS TABLE".
--
--   3. Verify: Storage → Policies tab should show 3 policies for the proof bucket.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) PROOFS TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.proofs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id  UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_url        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proofs_deliverable
  ON public.proofs(deliverable_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proofs_org
  ON public.proofs(org_id);

-- ---------------------------------------------------------------------------
-- 2) PROOFS TABLE RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

-- Org members can view proofs in their org
DROP POLICY IF EXISTS "Org members can view proofs" ON public.proofs;
CREATE POLICY "Org members can view proofs"
  ON public.proofs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = proofs.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Org members can insert proofs for their org
DROP POLICY IF EXISTS "Org members can insert proofs" ON public.proofs;
CREATE POLICY "Org members can insert proofs"
  ON public.proofs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = proofs.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Org members can delete proofs in their org
DROP POLICY IF EXISTS "Org members can delete proofs" ON public.proofs;
CREATE POLICY "Org members can delete proofs"
  ON public.proofs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = proofs.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Grants
REVOKE ALL ON public.proofs FROM anon;
GRANT SELECT, INSERT, DELETE ON public.proofs TO authenticated;
GRANT ALL ON public.proofs TO service_role;

-- ---------------------------------------------------------------------------
-- 3) STORAGE BUCKET
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proof',
  'proof',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) STORAGE RLS POLICIES
-- ---------------------------------------------------------------------------
-- Path convention: proof/{org_id}/{deliverable_id}/{filename}
-- storage.foldername(name) returns path segments as an array.

-- Upload: org members can upload to their org's folder
DROP POLICY IF EXISTS "Org members can upload proof files" ON storage.objects;
CREATE POLICY "Org members can upload proof files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'proof'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = (storage.foldername(name))[1]::uuid
        AND om.user_id = auth.uid()
    )
  );

-- Read: org members can read their org's files
DROP POLICY IF EXISTS "Org members can read proof files" ON storage.objects;
CREATE POLICY "Org members can read proof files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'proof'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = (storage.foldername(name))[1]::uuid
        AND om.user_id = auth.uid()
    )
  );

-- Delete: org members can delete their org's files
DROP POLICY IF EXISTS "Org members can delete proof files" ON storage.objects;
CREATE POLICY "Org members can delete proof files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'proof'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = (storage.foldername(name))[1]::uuid
        AND om.user_id = auth.uid()
    )
  );

-- ============================================================================
-- END
-- ============================================================================
