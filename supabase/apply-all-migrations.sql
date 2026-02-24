-- ============================================================================
-- SEIRA — Combined Migrations (00005 through 00028)
-- Run this in the Supabase SQL Editor to apply all missing schema changes.
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS guards).
-- ============================================================================

-- ============================================================================
-- 00005 — PROOFS TABLE + STORAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proofs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id  UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_url        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760)
);

CREATE INDEX IF NOT EXISTS idx_proofs_deliverable ON public.proofs(deliverable_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proofs_org ON public.proofs(org_id);

ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view proofs" ON public.proofs;
CREATE POLICY "Org members can view proofs"
  ON public.proofs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = proofs.org_id AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members can insert proofs" ON public.proofs;
CREATE POLICY "Org members can insert proofs"
  ON public.proofs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = proofs.org_id AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members can delete proofs" ON public.proofs;
CREATE POLICY "Org members can delete proofs"
  ON public.proofs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = proofs.org_id AND om.user_id = auth.uid()));

REVOKE ALL ON public.proofs FROM anon;
GRANT SELECT, INSERT, DELETE ON public.proofs TO authenticated;
GRANT ALL ON public.proofs TO service_role;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('proof', 'proof', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Org members can upload proof files" ON storage.objects;
CREATE POLICY "Org members can upload proof files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proof' AND EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = (storage.foldername(name))[1]::uuid AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members can read proof files" ON storage.objects;
CREATE POLICY "Org members can read proof files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proof' AND EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = (storage.foldername(name))[1]::uuid AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members can delete proof files" ON storage.objects;
CREATE POLICY "Org members can delete proof files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proof' AND EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = (storage.foldername(name))[1]::uuid AND om.user_id = auth.uid()));

-- ============================================================================
-- 00006a — RECAP REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recap_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  partner_id     UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  share_token    TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  cover_note     TEXT,
  generated_by   UUID NOT NULL,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recap_reports_share_token ON public.recap_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_recap_reports_partner ON public.recap_reports(partner_id);

ALTER TABLE public.recap_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage recaps" ON public.recap_reports;
CREATE POLICY "Org members can manage recaps"
  ON public.recap_reports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = recap_reports.org_id AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can read published recaps" ON public.recap_reports;
CREATE POLICY "Anyone can read published recaps"
  ON public.recap_reports FOR SELECT TO anon
  USING (status = 'published');

GRANT SELECT ON public.recap_reports TO anon;
GRANT ALL ON public.recap_reports TO authenticated;
GRANT ALL ON public.recap_reports TO service_role;

-- ============================================================================
-- 00006b — PROOF VALIDATION COLUMNS
-- ============================================================================

ALTER TABLE public.proofs
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS validation_result JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_proofs_validation_status
  ON public.proofs(validation_status) WHERE validation_status IS NOT NULL;

-- ============================================================================
-- 00007 — TEAM & NOTIFICATIONS
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_invitations_org_status ON public.invitations(org_id, status);

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

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, org_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can view invitations" ON public.invitations;
CREATE POLICY "Org admins can view invitations"
  ON public.invitations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = invitations.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Users can view invitation by code" ON public.invitations;
CREATE POLICY "Users can view invitation by code"
  ON public.invitations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Org admins can create invitations" ON public.invitations;
CREATE POLICY "Org admins can create invitations"
  ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = invitations.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Org admins can update invitations" ON public.invitations;
CREATE POLICY "Org admins can update invitations"
  ON public.invitations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = invitations.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = invitations.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.invitations FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

REVOKE ALL ON public.notifications FROM anon;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- ============================================================================
-- 00008/00009 — ROLE UPDATES (owner/admin/contributor/viewer)
-- ============================================================================

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'contributor';

ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_role_check CHECK (role IN ('owner', 'admin', 'contributor', 'viewer'));

-- Promote org creators to owner (safe to re-run)
UPDATE public.organization_members om
  SET role = 'owner'
  FROM public.organizations o
  WHERE om.org_id = o.id AND om.user_id = o.created_by AND om.role = 'admin';

-- ============================================================================
-- 00010 — TEMPLATE ENHANCEMENTS
-- ============================================================================

DO $$
DECLARE constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name FROM pg_constraint
  WHERE conrelid = 'public.templates'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%industry%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.templates DROP CONSTRAINT %I', constraint_name);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 00011 — EMAIL NOTIFICATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_notification_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  trigger_type text not null,
  deliverable_id uuid references deliverables(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  sent_at timestamptz not null default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_log_dedup
  ON email_notification_log (trigger_type, deliverable_id, recipient_email) WHERE deliverable_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_log_weekly ON email_notification_log (trigger_type, recipient_email, sent_at desc);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_notification_log (sent_at);
ALTER TABLE email_notification_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 00012 — SEASONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasons_org ON public.seasons(org_id);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage seasons" ON public.seasons;
CREATE POLICY "Org members can manage seasons"
  ON public.seasons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = seasons.org_id AND om.user_id = auth.uid()));

GRANT ALL ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;

DROP TRIGGER IF EXISTS update_seasons_updated_at ON public.seasons;
CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON public.seasons FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_season ON public.events(season_id) WHERE season_id IS NOT NULL;

-- ============================================================================
-- 00013 — ACTIVITY LOG
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

CREATE INDEX IF NOT EXISTS idx_activity_log_org_created ON public.activity_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_event ON public.activity_log(event_id) WHERE event_id IS NOT NULL;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can read activity" ON public.activity_log;
CREATE POLICY "Org members can read activity"
  ON public.activity_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.org_id = activity_log.org_id AND om.user_id = auth.uid()));

GRANT ALL ON public.activity_log TO service_role;
GRANT SELECT ON public.activity_log TO authenticated;

-- ============================================================================
-- 00014 — SEASON RECAPS
-- ============================================================================

ALTER TABLE public.recap_reports ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE;
ALTER TABLE public.recap_reports ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- ============================================================================
-- 00015 — PARTNER DEAL VALUE
-- ============================================================================

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS deal_value INTEGER;

-- ============================================================================
-- 00016 — COMBINED RECAPS
-- ============================================================================

ALTER TABLE public.recap_reports ADD COLUMN IF NOT EXISTS is_combined BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- 00017 — PARTNER RENEWAL DATE
-- ============================================================================

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS renewal_date DATE;

-- ============================================================================
-- 00018 — TALENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.talent (
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

CREATE INDEX IF NOT EXISTS idx_talent_org_id ON public.talent(org_id);
CREATE INDEX IF NOT EXISTS idx_talent_type ON public.talent(type);

ALTER TABLE public.talent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view talent" ON public.talent;
CREATE POLICY "Org members can view talent"
  ON public.talent FOR SELECT USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Contributors can insert talent" ON public.talent;
CREATE POLICY "Contributors can insert talent"
  ON public.talent FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner','admin','contributor')));

DROP POLICY IF EXISTS "Contributors can update talent" ON public.talent;
CREATE POLICY "Contributors can update talent"
  ON public.talent FOR UPDATE USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner','admin','contributor')));

DROP POLICY IF EXISTS "Admins can delete talent" ON public.talent;
CREATE POLICY "Admins can delete talent"
  ON public.talent FOR DELETE USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner','admin')));

GRANT ALL ON public.talent TO service_role;

-- ============================================================================
-- 00019 — TALENT SUB TYPE
-- ============================================================================

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS talent_sub_type TEXT DEFAULT NULL;
-- Note: CHECK constraint skipped for IF NOT EXISTS compatibility

-- ============================================================================
-- 00020 — DELIVERABLE TALENT_ID
-- ============================================================================

ALTER TABLE public.deliverables ADD COLUMN IF NOT EXISTS talent_id UUID DEFAULT NULL REFERENCES public.talent(id) ON DELETE SET NULL;

-- ============================================================================
-- 00021 — PENDING APPROVAL STATUS (no-op for TEXT column)
-- ============================================================================

SELECT 1;

-- ============================================================================
-- 00022 — APPROVAL CONFIG
-- ============================================================================

ALTER TABLE public.deliverables ADD COLUMN IF NOT EXISTS rejection_note TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';

-- ============================================================================
-- 00023 — USAGE RIGHTS
-- ============================================================================

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS usage_scope TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_territory TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_duration TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_expiration_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_scope_custom TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_territory_custom TEXT DEFAULT NULL;

-- ============================================================================
-- 00024 — ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  capacity   INTEGER DEFAULT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_org_id ON public.assets(org_id);

DO $$ BEGIN
  ALTER TABLE public.assets ADD CONSTRAINT assets_org_id_name_unique UNIQUE (org_id, name);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view assets" ON public.assets;
CREATE POLICY "Org members can view assets"
  ON public.assets FOR SELECT USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Contributors can insert assets" ON public.assets;
CREATE POLICY "Contributors can insert assets"
  ON public.assets FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner','admin','contributor')));

DROP POLICY IF EXISTS "Contributors can update assets" ON public.assets;
CREATE POLICY "Contributors can update assets"
  ON public.assets FOR UPDATE USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner','admin','contributor')));

DROP POLICY IF EXISTS "Admins can delete assets" ON public.assets;
CREATE POLICY "Admins can delete assets"
  ON public.assets FOR DELETE USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner','admin')));

GRANT ALL ON public.assets TO service_role;

-- ============================================================================
-- 00025 — DELIVERABLE ASSET_ID
-- ============================================================================

ALTER TABLE public.deliverables ADD COLUMN IF NOT EXISTS asset_id UUID DEFAULT NULL REFERENCES public.assets(id) ON DELETE SET NULL;

-- ============================================================================
-- 00026 — WEBHOOKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhooks (
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

CREATE INDEX IF NOT EXISTS idx_webhooks_org_id ON public.webhooks(org_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_org_active ON public.webhooks(org_id, active);

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON public.webhooks;
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view webhooks" ON public.webhooks;
CREATE POLICY "Admins can view webhooks"
  ON public.webhooks FOR SELECT USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Admins can insert webhooks" ON public.webhooks;
CREATE POLICY "Admins can insert webhooks"
  ON public.webhooks FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Admins can update webhooks" ON public.webhooks;
CREATE POLICY "Admins can update webhooks"
  ON public.webhooks FOR UPDATE USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Admins can delete webhooks" ON public.webhooks;
CREATE POLICY "Admins can delete webhooks"
  ON public.webhooks FOR DELETE USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

GRANT ALL ON public.webhooks TO service_role;

CREATE TABLE IF NOT EXISTS public.webhook_delivery_log (
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

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_log_webhook_id ON public.webhook_delivery_log(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_log_created_at ON public.webhook_delivery_log(created_at DESC);

ALTER TABLE public.webhook_delivery_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view delivery logs" ON public.webhook_delivery_log;
CREATE POLICY "Admins can view delivery logs"
  ON public.webhook_delivery_log FOR SELECT USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

GRANT ALL ON public.webhook_delivery_log TO service_role;

-- ============================================================================
-- 00027 — WEBHOOK RETRY
-- ============================================================================

ALTER TABLE public.webhook_delivery_log
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS original_delivery_id UUID REFERENCES public.webhook_delivery_log(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retries_exhausted BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- 00028 — API KEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
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

CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON public.api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view api_keys" ON public.api_keys;
CREATE POLICY "Admins can view api_keys"
  ON public.api_keys FOR SELECT USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Admins can insert api_keys" ON public.api_keys;
CREATE POLICY "Admins can insert api_keys"
  ON public.api_keys FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Admins can update api_keys" ON public.api_keys;
CREATE POLICY "Admins can update api_keys"
  ON public.api_keys FOR UPDATE USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "Admins can delete api_keys" ON public.api_keys;
CREATE POLICY "Admins can delete api_keys"
  ON public.api_keys FOR DELETE USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

GRANT ALL ON public.api_keys TO service_role;

-- ============================================================================
-- 00029 — PERFORMANCE INDEXES
-- ============================================================================

-- organization_members — used in EVERY RLS policy check
CREATE INDEX IF NOT EXISTS idx_org_members_org_user
  ON public.organization_members(org_id, user_id);

-- events
CREATE INDEX IF NOT EXISTS idx_events_org_id
  ON public.events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_org_status
  ON public.events(org_id, status);

-- partners
CREATE INDEX IF NOT EXISTS idx_partners_org_id
  ON public.partners(org_id);
CREATE INDEX IF NOT EXISTS idx_partners_event_id
  ON public.partners(event_id);

-- deliverables
CREATE INDEX IF NOT EXISTS idx_deliverables_event_id
  ON public.deliverables(event_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_partner_id
  ON public.deliverables(partner_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status
  ON public.deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_due_date
  ON public.deliverables(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_event_status
  ON public.deliverables(event_id, status);

-- recap_reports
CREATE INDEX IF NOT EXISTS idx_recap_reports_org_id
  ON public.recap_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_recap_reports_org_status
  ON public.recap_reports(org_id, status);
CREATE INDEX IF NOT EXISTS idx_recap_reports_event_id
  ON public.recap_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_recap_reports_season_id
  ON public.recap_reports(season_id) WHERE season_id IS NOT NULL;

-- templates
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_templates_org_id
    ON public.templates(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 00030 — Row-Level Security for Core Tables
-- ============================================================================

-- organizations
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

GRANT ALL ON public.organizations TO service_role;

-- organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
CREATE POLICY "Members can view org members"
  ON public.organization_members FOR SELECT
  USING (org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = auth.uid()
  ));

GRANT ALL ON public.organization_members TO service_role;

-- events
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

-- partners
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

-- deliverables (scoped via event_id → events.org_id)
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

-- ============================================================================
-- DONE — Verify by running: SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================================
