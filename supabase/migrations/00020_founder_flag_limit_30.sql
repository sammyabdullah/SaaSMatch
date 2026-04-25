-- Update combined founder flag limit from 15 to 30.
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

    if v_count >= 30 then
      raise exception
        'FOUNDER_FLAG_LIMIT: A founder may have at most 30 active requests combined (investors + lenders). '
        'Remove an existing request or wait for one to be accepted before adding a new one.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;
