-- 00026_webhooks.sql
-- Webhook configuration and delivery logging

CREATE TABLE public.webhooks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url               TEXT NOT NULL,
  events            TEXT[] NOT NULL DEFAULT '{}',
  active            BOOLEAN NOT NULL DEFAULT true,
  signing_secret    TEXT NOT NULL,
  description       TEXT,
  last_triggered_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_webhooks_org_id ON public.webhooks(org_id);
CREATE INDEX idx_webhooks_org_active ON public.webhooks(org_id, active);

-- Updated_at trigger
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhooks"
  ON public.webhooks FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can insert webhooks"
  ON public.webhooks FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update webhooks"
  ON public.webhooks FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete webhooks"
  ON public.webhooks FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

GRANT ALL ON public.webhooks TO service_role;

-- Delivery log

CREATE TABLE public.webhook_delivery_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id    UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}',
  status_code   INTEGER,
  response_body TEXT,
  error         TEXT,
  duration_ms   INTEGER,
  success       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_delivery_log_webhook_id ON public.webhook_delivery_log(webhook_id);
CREATE INDEX idx_webhook_delivery_log_created_at ON public.webhook_delivery_log(created_at DESC);

ALTER TABLE public.webhook_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view delivery logs"
  ON public.webhook_delivery_log FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

GRANT ALL ON public.webhook_delivery_log TO service_role;
