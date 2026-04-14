-- ============================================================
-- SaaSMatch — Migration 00007: Flag Status & Connection Flow
-- ============================================================
-- Replaces the mutual-flag auto-match with an explicit
-- accept/decline flow. Adds status to flags and removes
-- the trigger that auto-created matches.
-- ============================================================

-- Add status column to flags
alter table flags
  add column status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  add column responded_at timestamptz;

-- Drop the old mutual-flag trigger and function (no longer used)
drop trigger if exists trg_check_mutual_flag on flags;
drop function if exists fn_check_mutual_flag();

-- Unique constraint already exists on (founder_id, investor_id, flagged_by)
-- so each direction can only have one flag per pair.
