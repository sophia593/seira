-- 00022_approval_config.sql
-- Adds rejection_note to deliverables and settings JSONB to organizations
-- for configurable approval categories and rejection flow.

-- 1) Rejection note on deliverables (set by admin on reject, cleared on approve)
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS rejection_note TEXT;

-- 2) Organization-level settings (JSONB for approval_required_categories and future config)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
