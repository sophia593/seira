-- Usage rights fields for talent deliverables
-- Tracks scope, territory, duration, and expiration of usage rights

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS usage_scope TEXT DEFAULT NULL
    CHECK (usage_scope IS NULL OR usage_scope IN ('social', 'broadcast', 'all', 'custom')),
  ADD COLUMN IF NOT EXISTS usage_territory TEXT DEFAULT NULL
    CHECK (usage_territory IS NULL OR usage_territory IN ('us', 'global', 'custom')),
  ADD COLUMN IF NOT EXISTS usage_duration TEXT DEFAULT NULL
    CHECK (usage_duration IS NULL OR usage_duration IN ('30d', '90d', '1yr', 'perpetual', 'custom')),
  ADD COLUMN IF NOT EXISTS usage_expiration_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_scope_custom TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_territory_custom TEXT DEFAULT NULL;
