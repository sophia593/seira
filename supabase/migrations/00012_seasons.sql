-- ============================================================================
-- SEASONS — Group events into recurring series (e.g. "2025 NBA Season")
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) SEASONS TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasons_org
  ON public.seasons(org_id);

-- ---------------------------------------------------------------------------
-- 2) RLS POLICIES
-- ---------------------------------------------------------------------------

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage seasons" ON public.seasons;
CREATE POLICY "Org members can manage seasons"
  ON public.seasons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = seasons.org_id
        AND om.user_id = auth.uid()
    )
  );

GRANT ALL ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;

-- ---------------------------------------------------------------------------
-- 3) UPDATED-AT TRIGGER (reuses existing function)
-- ---------------------------------------------------------------------------

CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4) ADD season_id TO EVENTS
-- ---------------------------------------------------------------------------

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_season
  ON public.events(season_id)
  WHERE season_id IS NOT NULL;

-- ============================================================================
-- END
-- ============================================================================
