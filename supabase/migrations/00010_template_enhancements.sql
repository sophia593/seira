-- ============================================================================
-- TEMPLATE ENHANCEMENTS
-- 1. Remove industry CHECK constraint (free-text industry tags)
-- 2. Add share_token column (public link sharing)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Drop the industry CHECK constraint (allow free-text values)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.templates'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%industry%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.templates DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Add share_token column for public link sharing
-- ---------------------------------------------------------------------------
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_templates_share_token
  ON public.templates(share_token)
  WHERE share_token IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) RLS: allow anon read of templates with a share token
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read templates by share token" ON public.templates;
CREATE POLICY "Anyone can read templates by share token"
  ON public.templates FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

GRANT SELECT ON public.templates TO anon;
