-- ============================================================================
-- 00030 — Row-Level Security for Core Tables
--
-- Adds RLS policies to the 5 core tables that were created before the
-- migration system: organizations, organization_members, events, partners,
-- deliverables. Every other table already has RLS (proofs, seasons, talent,
-- assets, templates, etc.). Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view organization" ON public.organizations;
CREATE POLICY "Org members can view organization"
  ON public.organizations FOR SELECT
  USING (id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can update organization" ON public.organizations;
CREATE POLICY "Admins can update organization"
  ON public.organizations FOR UPDATE
  USING (id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- INSERT/DELETE handled via admin client (workspace creation/deletion)

GRANT ALL ON public.organizations TO service_role;

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
CREATE POLICY "Members can view org members"
  ON public.organization_members FOR SELECT
  USING (org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = auth.uid()
  ));

-- INSERT/UPDATE/DELETE handled via admin client (invitations, team management)

GRANT ALL ON public.organization_members TO service_role;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view events" ON public.events;
CREATE POLICY "Org members can view events"
  ON public.events FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Contributors can insert events" ON public.events;
CREATE POLICY "Contributors can insert events"
  ON public.events FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'contributor')
  ));

DROP POLICY IF EXISTS "Contributors can update events" ON public.events;
CREATE POLICY "Contributors can update events"
  ON public.events FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'contributor')
  ));

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

GRANT ALL ON public.events TO service_role;

-- ---------------------------------------------------------------------------
-- partners
-- ---------------------------------------------------------------------------
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view partners" ON public.partners;
CREATE POLICY "Org members can view partners"
  ON public.partners FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Contributors can insert partners" ON public.partners;
CREATE POLICY "Contributors can insert partners"
  ON public.partners FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'contributor')
  ));

DROP POLICY IF EXISTS "Contributors can update partners" ON public.partners;
CREATE POLICY "Contributors can update partners"
  ON public.partners FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'contributor')
  ));

DROP POLICY IF EXISTS "Admins can delete partners" ON public.partners;
CREATE POLICY "Admins can delete partners"
  ON public.partners FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

GRANT ALL ON public.partners TO service_role;

-- ---------------------------------------------------------------------------
-- deliverables
--
-- deliverables has no direct org_id column — scoped via event_id → events.org_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view deliverables" ON public.deliverables;
CREATE POLICY "Org members can view deliverables"
  ON public.deliverables FOR SELECT
  USING (event_id IN (
    SELECT e.id FROM public.events e
    INNER JOIN public.organization_members om ON om.org_id = e.org_id
    WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Contributors can insert deliverables" ON public.deliverables;
CREATE POLICY "Contributors can insert deliverables"
  ON public.deliverables FOR INSERT
  WITH CHECK (event_id IN (
    SELECT e.id FROM public.events e
    INNER JOIN public.organization_members om ON om.org_id = e.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'contributor')
  ));

DROP POLICY IF EXISTS "Contributors can update deliverables" ON public.deliverables;
CREATE POLICY "Contributors can update deliverables"
  ON public.deliverables FOR UPDATE
  USING (event_id IN (
    SELECT e.id FROM public.events e
    INNER JOIN public.organization_members om ON om.org_id = e.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'contributor')
  ));

DROP POLICY IF EXISTS "Admins can delete deliverables" ON public.deliverables;
CREATE POLICY "Admins can delete deliverables"
  ON public.deliverables FOR DELETE
  USING (event_id IN (
    SELECT e.id FROM public.events e
    INNER JOIN public.organization_members om ON om.org_id = e.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
  ));

GRANT ALL ON public.deliverables TO service_role;
