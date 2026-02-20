-- ============================================================================
-- ACTIVITY LOG — Audit trail for all user actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id     UUID REFERENCES public.events(id) ON DELETE SET NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    UUID,
  details_json JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_org_created
  ON public.activity_log(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_event
  ON public.activity_log(event_id)
  WHERE event_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS — members can read; only service_role can insert
-- ---------------------------------------------------------------------------

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can read activity" ON public.activity_log;
CREATE POLICY "Org members can read activity"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = activity_log.org_id
        AND om.user_id = auth.uid()
    )
  );

GRANT ALL ON public.activity_log TO service_role;
GRANT SELECT ON public.activity_log TO authenticated;

-- ============================================================================
-- END
-- ============================================================================
