-- 00021_pending_approval_status.sql
-- Adds 'pending_approval' as a valid deliverable status for talent deliverables.
-- The status column is TEXT (not a Postgres enum) so no schema change is needed.
-- This migration serves as documentation of the new status value.
--
-- Flow for talent deliverables:
--   done → (proof uploaded) → pending_approval → (admin approves) → proved
--
-- Non-talent deliverables keep the existing flow:
--   done → (proof uploaded) → proved

SELECT 1; -- no-op: TEXT column already accepts 'pending_approval'
