-- Add season recap support to recap_reports
-- When season_id IS NOT NULL, the recap is a season-level report.
-- event_id/partner_id remain required — they point to a representative record for compatibility.
-- partner_name stores the canonical name used for cross-event partner matching.

ALTER TABLE public.recap_reports
  ADD COLUMN season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  ADD COLUMN partner_name TEXT;

CREATE INDEX idx_recap_reports_season ON public.recap_reports(season_id)
  WHERE season_id IS NOT NULL;
