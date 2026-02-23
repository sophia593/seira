-- 00019_talent_sub_type.sql
-- Add talent sub-type to deliverables (player, artist, influencer, speaker)

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS talent_sub_type TEXT DEFAULT NULL
    CHECK (talent_sub_type IS NULL OR talent_sub_type IN ('player','artist','influencer','speaker'));

CREATE INDEX idx_deliverables_talent_sub_type
  ON public.deliverables(talent_sub_type)
  WHERE talent_sub_type IS NOT NULL;
