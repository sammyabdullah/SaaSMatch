-- ============================================================
-- SaaSMatch — Migration 00008: Remove investor warnings
-- ============================================================
-- Warnings functionality has been removed from the product.
-- Drop the table, indexes, trigger, and functions.
-- ============================================================

-- Drop trigger first (depends on the function)
drop trigger if exists trg_check_investor_warning_threshold on investor_warnings;

-- Drop functions
drop function if exists fn_check_investor_warning_threshold();
drop function if exists fn_expire_matches_and_warn();

-- Drop the table (cascades indexes and RLS policies)
drop table if exists investor_warnings;
