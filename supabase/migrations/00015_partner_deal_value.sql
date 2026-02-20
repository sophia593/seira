-- Add numeric deal value to partners for filtering and aggregation.
-- Stores whole dollars (nullable). contract_notes remains for free-text deal descriptions.

ALTER TABLE public.partners ADD COLUMN deal_value INTEGER;
