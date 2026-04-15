-- ============================================================
-- SaaSMatch — Migration 00009: Extend founder profile TTL to 180 days
-- ============================================================

create or replace function fn_set_founder_expiry_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.is_approved = false and new.is_approved = true)
     or (old.status <> 'active' and new.status = 'active')
  then
    if new.profile_expires_at is null then
      new.profile_expires_at := now() + interval '180 days';
    end if;
    if new.is_approved = true and new.status = 'pending' then
      new.status := 'active';
    end if;
  end if;

  return new;
end;
$$;
