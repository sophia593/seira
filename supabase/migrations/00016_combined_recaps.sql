-- Add is_combined flag for relationship-level combined recaps.
-- Combined recaps aggregate deliverables across ALL events for a partner.

ALTER TABLE public.recap_reports ADD COLUMN is_combined BOOLEAN NOT NULL DEFAULT FALSE;
