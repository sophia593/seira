-- 00024_assets.sql
-- Org-level asset inventory with capacity tracking

CREATE TABLE public.assets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  capacity   INTEGER DEFAULT NULL,  -- NULL = unlimited
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_assets_org_id ON public.assets(org_id);

-- Prevent duplicate asset names within an org
ALTER TABLE public.assets
  ADD CONSTRAINT assets_org_id_name_unique UNIQUE (org_id, name);

-- Updated_at trigger
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view assets"
  ON public.assets FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Contributors can insert assets"
  ON public.assets FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin','contributor')
  ));

CREATE POLICY "Contributors can update assets"
  ON public.assets FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin','contributor')
  ));

CREATE POLICY "Admins can delete assets"
  ON public.assets FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- Service role bypass
GRANT ALL ON public.assets TO service_role;
