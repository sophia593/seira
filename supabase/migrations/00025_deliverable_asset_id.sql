-- Add asset_id FK to deliverables table
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS asset_id UUID DEFAULT NULL
    REFERENCES public.assets(id) ON DELETE SET NULL;

CREATE INDEX idx_deliverables_asset_id
  ON public.deliverables(asset_id)
  WHERE asset_id IS NOT NULL;
