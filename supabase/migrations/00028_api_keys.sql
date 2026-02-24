-- 00028_api_keys.sql
-- API key management for REST API authentication

CREATE TABLE public.api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key_hash     TEXT NOT NULL,
  key_prefix   TEXT NOT NULL,
  name         TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_api_keys_org_id ON public.api_keys(org_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);

-- Updated_at trigger
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api_keys"
  ON public.api_keys FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can insert api_keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update api_keys"
  ON public.api_keys FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete api_keys"
  ON public.api_keys FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

GRANT ALL ON public.api_keys TO service_role;
