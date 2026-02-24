-- 00027_webhook_retry.sql
-- Add retry tracking columns to webhook_delivery_log

ALTER TABLE public.webhook_delivery_log
  ADD COLUMN attempt_number      INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN original_delivery_id UUID REFERENCES public.webhook_delivery_log(id) ON DELETE SET NULL,
  ADD COLUMN retries_exhausted   BOOLEAN NOT NULL DEFAULT false;

-- Partial index for cron query: only scans rows needing retry
CREATE INDEX idx_wdl_retry_candidates
  ON public.webhook_delivery_log(created_at DESC)
  WHERE success = false AND retries_exhausted = false;
