-- ============================================================================
-- TEAM & NOTIFICATIONS — Invitations, notifications, templates RLS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) INVITATIONS TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  role        TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner','admin','contributor','viewer')),
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_org_status
  ON public.invitations(org_id, status);

-- ---------------------------------------------------------------------------
-- 2) NOTIFICATIONS TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  metadata   JSONB DEFAULT '{}'::jsonb,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, org_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3) INVITATIONS RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Org admins/owners can view invitations for their org
DROP POLICY IF EXISTS "Org admins can view invitations" ON public.invitations;
CREATE POLICY "Org admins can view invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = invitations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Any authenticated user can view a specific invitation by code (for accepting)
DROP POLICY IF EXISTS "Users can view invitation by code" ON public.invitations;
CREATE POLICY "Users can view invitation by code"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (true);

-- Org admins/owners can create invitations
DROP POLICY IF EXISTS "Org admins can create invitations" ON public.invitations;
CREATE POLICY "Org admins can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = invitations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Org admins/owners can update invitations (revoke)
DROP POLICY IF EXISTS "Org admins can update invitations" ON public.invitations;
CREATE POLICY "Org admins can update invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = invitations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = invitations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 4) NOTIFICATIONS RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only service_role inserts notifications (via admin client in server actions)
-- No INSERT policy for authenticated — notifications are created server-side

-- ---------------------------------------------------------------------------
-- 5) TEMPLATES RLS (additions for management UI)
-- ---------------------------------------------------------------------------
-- The templates table already exists. Add RLS if not already enabled.

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- All org members can view their org's templates + global templates
DROP POLICY IF EXISTS "Org members can view templates" ON public.templates;
CREATE POLICY "Org members can view templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (
    org_id IS NULL  -- global templates visible to all
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = templates.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Org admins/owners can create templates for their org
DROP POLICY IF EXISTS "Org admins can create templates" ON public.templates;
CREATE POLICY "Org admins can create templates"
  ON public.templates FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = templates.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Org admins/owners can update their org's templates
DROP POLICY IF EXISTS "Org admins can update templates" ON public.templates;
CREATE POLICY "Org admins can update templates"
  ON public.templates FOR UPDATE
  TO authenticated
  USING (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = templates.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = templates.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Org admins/owners can delete their org's templates
DROP POLICY IF EXISTS "Org admins can delete templates" ON public.templates;
CREATE POLICY "Org admins can delete templates"
  ON public.templates FOR DELETE
  TO authenticated
  USING (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = templates.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 6) GRANTS
-- ---------------------------------------------------------------------------

-- Invitations
REVOKE ALL ON public.invitations FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

-- Notifications
REVOKE ALL ON public.notifications FROM anon;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Templates (ensure grants exist)
REVOKE ALL ON public.templates FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

-- ============================================================================
-- END
-- ============================================================================
