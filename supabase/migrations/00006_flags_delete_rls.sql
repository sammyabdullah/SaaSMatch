-- ============================================================
-- SaaSMatch — Migration 00006: Flags DELETE RLS Policies
-- ============================================================
-- Allow founders and investors to delete (unflag) their own flags.
-- ============================================================

-- Founders can delete flags they placed on investors
create policy "flags: founder delete own"
  on flags for delete
  using (
    auth_user_role() = 'founder'
    and flagged_by = 'founder'
    and founder_id = auth.uid()
  );

-- Investors can delete flags they placed on founders
create policy "flags: investor delete own"
  on flags for delete
  using (
    auth_user_role() = 'investor'
    and flagged_by = 'investor'
    and investor_id = auth.uid()
  );
