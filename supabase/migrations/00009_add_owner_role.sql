-- ============================================================================
-- ADD OWNER ROLE — 4-tier model: owner | admin | contributor | viewer
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Ensure role column exists (safety for tables created outside migrations)
-- ---------------------------------------------------------------------------

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'contributor';

-- ---------------------------------------------------------------------------
-- 2) Update CHECK constraint to include 'owner'
-- ---------------------------------------------------------------------------

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('owner', 'admin', 'contributor', 'viewer'));

-- ---------------------------------------------------------------------------
-- 3) Promote org creators to 'owner'
-- ---------------------------------------------------------------------------

UPDATE public.organization_members om
  SET role = 'owner'
  FROM public.organizations o
  WHERE om.org_id = o.id
    AND om.user_id = o.created_by
    AND om.role = 'admin';

-- ---------------------------------------------------------------------------
-- 4) Update invitations constraint
-- ---------------------------------------------------------------------------

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_role_check
  CHECK (role IN ('owner', 'admin', 'contributor', 'viewer'));

-- ---------------------------------------------------------------------------
-- 5) Update RLS policies: owner OR admin can manage
-- ---------------------------------------------------------------------------

-- Invitations: owner/admin can view
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

-- Invitations: owner/admin can create
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

-- Invitations: owner/admin can update (revoke)
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

-- Templates: owner/admin can create
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

-- Templates: owner/admin can update
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

-- Templates: owner/admin can delete
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

-- ============================================================================
-- END
-- ============================================================================
