-- The original check required >= 3 subcategories but the form only enforced >= 1,
-- causing investor signups to fail silently at the DB layer.
-- Relax to >= 1 here; form-level validation now enforces >= 3 with a clear message.
alter table investor_profiles
  drop constraint if exists investor_profiles_saas_subcategories_check;

alter table investor_profiles
  add constraint investor_profiles_saas_subcategories_check
  check (array_length(saas_subcategories, 1) >= 1);
