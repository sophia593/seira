-- ============================================================================
-- PROOF VALIDATION — Add validation columns to proofs table
-- ============================================================================
--
-- Adds AI-powered proof validation support:
--   - validation_status: null | 'pending' | 'valid' | 'invalid' | 'skipped'
--   - validation_result: JSONB with {valid, confidence, reason, issues}
--
-- Run this in the Supabase SQL Editor after 00005_proof_storage.sql.
-- ============================================================================

ALTER TABLE public.proofs
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS validation_result JSONB DEFAULT NULL;

-- Index for filtering by validation status (e.g. dashboard queries)
CREATE INDEX IF NOT EXISTS idx_proofs_validation_status
  ON public.proofs(validation_status)
  WHERE validation_status IS NOT NULL;

-- ============================================================================
-- END
-- ============================================================================
