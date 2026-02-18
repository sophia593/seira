-- ============================================================================
-- ROLE RENAME: owner/admin/member → admin/contributor/viewer
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Migrate existing organization_members role values
-- ---------------------------------------------------------------------------

UPDATE public.organization_members SET role = 'admin' WHERE role = 'owner';
UPDATE public.organization_members SET role = 'contributor' WHERE role = 'member';
-- 'admin' stays 'admin' — no change needed

-- Drop old constraint and add new one
ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('owner', 'admin', 'contributor', 'viewer'));

-- ---------------------------------------------------------------------------
-- 2) Migrate existing invitations role values
-- ---------------------------------------------------------------------------

UPDATE public.invitations SET role = 'admin' WHERE role = 'owner';
UPDATE public.invitations SET role = 'contributor' WHERE role = 'member';

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_role_check
  CHECK (role IN ('owner', 'admin', 'contributor', 'viewer'));
ALTER TABLE public.invitations
  ALTER COLUMN role SET DEFAULT 'contributor';

-- ---------------------------------------------------------------------------
-- 3) Update RLS policies that reference old role names
-- ---------------------------------------------------------------------------

-- Invitations: admins can view
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

-- Invitations: admins can create
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

-- Invitations: admins can update (revoke)
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

-- Templates: admins can create
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

-- Templates: admins can update
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

-- Templates: admins can delete
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
