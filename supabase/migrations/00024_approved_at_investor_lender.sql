alter table investor_profiles
  add column if not exists approved_at timestamptz;

alter table lender_profiles
  add column if not exists approved_at timestamptz;

-- Back-fill existing approved rows
update investor_profiles set approved_at = updated_at where is_approved = true and approved_at is null;
update lender_profiles   set approved_at = updated_at where is_approved = true and approved_at is null;
