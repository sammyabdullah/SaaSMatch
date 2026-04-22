-- Update founder flag limit from 10 (investor-only) to 12 (combined investors + lenders).
-- The function now counts pending flags across BOTH tables before allowing a new insert.
-- The trigger is also added to lender_flags so the limit is enforced there too.

create or replace function fn_enforce_founder_flag_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if new.flagged_by = 'founder' then
    select (
      (select count(*) from flags
        where founder_id = new.founder_id
          and flagged_by = 'founder'
          and status = 'pending')
      +
      (select count(*) from lender_flags
        where founder_id = new.founder_id
          and flagged_by = 'founder'
          and status = 'pending')
    ) into v_count;

    if v_count >= 12 then
      raise exception
        'FOUNDER_FLAG_LIMIT: A founder may have at most 12 active requests combined (investors + lenders). '
        'Remove an existing request or wait for one to be accepted before adding a new one.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- Drop and recreate trigger on flags (was already there, recreate to pick up updated function)
drop trigger if exists trg_enforce_founder_flag_limit on flags;
create trigger trg_enforce_founder_flag_limit
  before insert on flags
  for each row execute function fn_enforce_founder_flag_limit();

-- Add the same trigger to lender_flags (was missing before)
drop trigger if exists trg_enforce_founder_lender_flag_limit on lender_flags;
create trigger trg_enforce_founder_lender_flag_limit
  before insert on lender_flags
  for each row execute function fn_enforce_founder_flag_limit();
