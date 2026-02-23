-- 00018_talent.sql
-- Talent roster — players, artists, influencers, speakers

CREATE TABLE public.talent (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('player','artist','influencer','speaker')),
  affiliation   TEXT,
  contact_name  TEXT,
  contact_email TEXT,
  notes         TEXT,
  photo_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_talent_org_id ON public.talent(org_id);
CREATE INDEX idx_talent_type   ON public.talent(type);

-- RLS
ALTER TABLE public.talent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view talent"
  ON public.talent FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Contributors can insert talent"
  ON public.talent FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin','contributor')
  ));

CREATE POLICY "Contributors can update talent"
  ON public.talent FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin','contributor')
  ));

CREATE POLICY "Admins can delete talent"
  ON public.talent FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- Service role bypass
GRANT ALL ON public.talent TO service_role;
