-- ============================================================
-- Migration 00021: Remove founder profile expiry
-- Founder profiles are now permanent once approved.
-- ============================================================

-- Drop the trigger that set profile_expires_at on approval
drop trigger if exists trg_set_founder_expiry_on_approval on founder_profiles;

-- Replace the expiry trigger function with a no-op
create or replace function fn_set_founder_expiry_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ensure status follows is_approved on approval transition
  if (old.is_approved = false and new.is_approved = true)
     or (old.status <> 'active' and new.status = 'active')
  then
    if new.is_approved = true and new.status = 'pending' then
      new.status := 'active';
    end if;
  end if;
  return new;
end;
$$;

-- Re-attach the trigger (now without expiry logic)
create trigger trg_set_founder_expiry_on_approval
  before update on founder_profiles
  for each row execute function fn_set_founder_expiry_on_approval();

-- Replace the nightly expiry function with a no-op
create or replace function fn_expire_founder_profiles()
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  return 0;
end;
$$;

-- Reactivate any founders whose profiles expired, and clear all expiry dates
update founder_profiles
set status = 'active', profile_expires_at = null, updated_at = now()
where status = 'expired' and is_approved = true;

update founder_profiles
set profile_expires_at = null, updated_at = now()
where profile_expires_at is not null;
