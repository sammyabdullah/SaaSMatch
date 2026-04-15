-- ============================================================
-- Migration 00010: Make nrr_pct, acv_usd, mom_growth_pct nullable
-- ============================================================
-- NRR % and ACV removed from founder application.
-- YOY growth % (stored in mom_growth_pct) is now optional.
-- ============================================================

alter table founder_profiles
  alter column nrr_pct     drop not null,
  alter column acv_usd     drop not null,
  alter column mom_growth_pct drop not null;
