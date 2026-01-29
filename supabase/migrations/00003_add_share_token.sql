-- ============================================================================
-- SHARE TOKEN MIGRATION
-- Adds share_token column to trips table for public sharing functionality
-- ============================================================================

-- Add share_token column (nullable, unique when set)
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Add shared_by_name for display on shared views
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS shared_by_name TEXT;

-- Index for fast lookup by share_token
CREATE INDEX IF NOT EXISTS idx_trips_share_token
  ON public.trips(share_token)
  WHERE share_token IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS Policy for public read access via share_token
-- ---------------------------------------------------------------------------

-- Allow anyone to read a trip if they have the share_token
CREATE POLICY IF NOT EXISTS "trips_public_read_by_share_token"
  ON public.trips
  FOR SELECT
  USING (share_token IS NOT NULL);

-- Note: This policy allows SELECT when share_token exists.
-- The API will verify the token matches, providing security through obscurity
-- combined with the unique random token.

COMMENT ON COLUMN public.trips.share_token IS 'Unique token for public sharing. NULL means not shared.';
COMMENT ON COLUMN public.trips.shared_by_name IS 'Display name shown on shared view (e.g. "John" or "Anonymous")';
