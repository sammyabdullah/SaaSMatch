alter table founder_profiles
  add column if not exists approved_at timestamptz,
  add column if not exists clock_restarted_at timestamptz;
