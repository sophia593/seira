-- ============================================================================
-- RECAP REPORTS — Shareable proof-pack pages for sponsors
-- ============================================================================
--
-- Manual setup (if migration cannot run automatically):
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste and run everything below
--   3. Verify: Tables tab should show recap_reports
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) RECAP REPORTS TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.recap_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  partner_id     UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  share_token    TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  cover_note     TEXT,
  generated_by   UUID NOT NULL,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recap_reports_share_token
  ON public.recap_reports(share_token);

CREATE INDEX IF NOT EXISTS idx_recap_reports_partner
  ON public.recap_reports(partner_id);

-- ---------------------------------------------------------------------------
-- 2) RLS POLICIES
-- ---------------------------------------------------------------------------

ALTER TABLE public.recap_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated org members can manage recaps in their org
DROP POLICY IF EXISTS "Org members can manage recaps" ON public.recap_reports;
CREATE POLICY "Org members can manage recaps"
  ON public.recap_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = recap_reports.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Anyone can read published recaps (public share page — no auth required)
DROP POLICY IF EXISTS "Anyone can read published recaps" ON public.recap_reports;
CREATE POLICY "Anyone can read published recaps"
  ON public.recap_reports FOR SELECT
  TO anon
  USING (status = 'published');

-- ---------------------------------------------------------------------------
-- 3) GRANTS
-- ---------------------------------------------------------------------------

GRANT SELECT ON public.recap_reports TO anon;
GRANT ALL ON public.recap_reports TO authenticated;
GRANT ALL ON public.recap_reports TO service_role;

-- ============================================================================
-- END
-- ============================================================================
