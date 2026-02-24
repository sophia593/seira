-- ============================================================================
-- 00029 — Performance Indexes
-- Adds missing indexes on org_id, event_id, partner_id, status, due_date,
-- and season_id across all core tables. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- organization_members — used in EVERY RLS policy check
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_org_members_org_user
  ON public.organization_members(org_id, user_id);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_events_org_id
  ON public.events(org_id);

CREATE INDEX IF NOT EXISTS idx_events_org_status
  ON public.events(org_id, status);

-- idx_events_season already exists (00012)

-- ---------------------------------------------------------------------------
-- partners
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_partners_org_id
  ON public.partners(org_id);

CREATE INDEX IF NOT EXISTS idx_partners_event_id
  ON public.partners(event_id);

-- ---------------------------------------------------------------------------
-- deliverables
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_deliverables_event_id
  ON public.deliverables(event_id);

CREATE INDEX IF NOT EXISTS idx_deliverables_partner_id
  ON public.deliverables(partner_id);

CREATE INDEX IF NOT EXISTS idx_deliverables_status
  ON public.deliverables(status);

CREATE INDEX IF NOT EXISTS idx_deliverables_due_date
  ON public.deliverables(due_date)
  WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deliverables_event_status
  ON public.deliverables(event_id, status);

-- ---------------------------------------------------------------------------
-- recap_reports
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_recap_reports_org_id
  ON public.recap_reports(org_id);

CREATE INDEX IF NOT EXISTS idx_recap_reports_org_status
  ON public.recap_reports(org_id, status);

CREATE INDEX IF NOT EXISTS idx_recap_reports_event_id
  ON public.recap_reports(event_id);

CREATE INDEX IF NOT EXISTS idx_recap_reports_season_id
  ON public.recap_reports(season_id)
  WHERE season_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- templates
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_templates_org_id
    ON public.templates(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
