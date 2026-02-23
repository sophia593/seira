-- Add talent_id FK to deliverables table
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS talent_id UUID DEFAULT NULL
    REFERENCES public.talent(id) ON DELETE SET NULL;

CREATE INDEX idx_deliverables_talent_id
  ON public.deliverables(talent_id)
  WHERE talent_id IS NOT NULL;
