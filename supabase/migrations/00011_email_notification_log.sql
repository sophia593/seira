-- 00011_email_notification_log.sql
-- Records every automated email sent by the cron notification scheduler.
-- Used for deduplication (don't re-send for the same deliverable/trigger).

create table if not exists email_notification_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  trigger_type text not null,               -- 'due_soon' | 'needs_proof' | 'weekly_risk'
  deliverable_id uuid references deliverables(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  sent_at timestamptz not null default now()
);

-- Dedup index: one email per trigger per deliverable per recipient
-- (only for triggers that target specific deliverables)
create unique index if not exists idx_email_log_dedup
  on email_notification_log (trigger_type, deliverable_id, recipient_email)
  where deliverable_id is not null;

-- For weekly summaries: look up by trigger + recipient + recent time window
create index if not exists idx_email_log_weekly
  on email_notification_log (trigger_type, recipient_email, sent_at desc);

-- Cleanup: find old log entries
create index if not exists idx_email_log_sent_at
  on email_notification_log (sent_at);

-- RLS: no user-facing policies — only service_role (admin client) accesses this table
alter table email_notification_log enable row level security;
