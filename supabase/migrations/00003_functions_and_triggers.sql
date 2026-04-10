-- ============================================================
-- SaaSMatch — Migration 00003: Business Logic Functions & Triggers
-- ============================================================
-- All functions run as SECURITY DEFINER so they can bypass RLS
-- where the business logic requires cross-table writes
-- (e.g. creating a match and deleting flag records).
-- search_path is pinned to 'public' to avoid schema-injection.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BL-1  Mutual-flag → Match creation
-- ────────────────────────────────────────────────────────────
-- Fired AFTER INSERT on flags.
-- When both directions exist for the same (founder_id, investor_id)
-- pair, create a match with response_deadline = now() + 14 days,
-- then delete both flag rows.
-- ────────────────────────────────────────────────────────────

create or replace function fn_check_mutual_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opposite flag_side;
begin
  -- Determine which direction we're looking for
  if new.flagged_by = 'founder' then
    v_opposite := 'investor';
  else
    v_opposite := 'founder';
  end if;

  -- Check whether the mirror flag already exists
  if exists (
    select 1 from flags
    where founder_id  = new.founder_id
      and investor_id = new.investor_id
      and flagged_by  = v_opposite
  ) then
    -- Create the match
    insert into matches (
      founder_id,
      investor_id,
      matched_at,
      response_deadline,
      status
    ) values (
      new.founder_id,
      new.investor_id,
      now(),
      now() + interval '14 days',
      'active'
    )
    on conflict (founder_id, investor_id) do nothing;  -- idempotent guard

    -- Remove both flag records (they are no longer needed)
    delete from flags
    where founder_id  = new.founder_id
      and investor_id = new.investor_id;

    -- Return NULL to cancel the triggering INSERT
    -- (the row was already deleted above, but cancelling is cleaner)
    return null;
  end if;

  return new;
end;
$$;

create trigger trg_check_mutual_flag
  after insert on flags
  for each row execute function fn_check_mutual_flag();


-- ────────────────────────────────────────────────────────────
-- BL-2  Enforce max 10 active founder flags
-- ────────────────────────────────────────────────────────────
-- Fired BEFORE INSERT on flags.
-- Rejects the insert if the founder already has 10 outbound flags.
-- ────────────────────────────────────────────────────────────

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
    select count(*) into v_count
    from flags
    where founder_id = new.founder_id
      and flagged_by = 'founder';

    if v_count >= 10 then
      raise exception
        'FOUNDER_FLAG_LIMIT: A founder may have at most 10 active flags. '
        'Remove an existing flag before adding a new one.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_founder_flag_limit
  before insert on flags
  for each row execute function fn_enforce_founder_flag_limit();


-- ────────────────────────────────────────────────────────────
-- BL-3  Nightly: expire stale founder profiles
-- ────────────────────────────────────────────────────────────
-- Called by a Supabase pg_cron job or Edge Function scheduler.
-- Returns the number of profiles expired for logging.
-- ────────────────────────────────────────────────────────────

create or replace function fn_expire_founder_profiles()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update founder_profiles
  set    status     = 'expired',
         updated_at = now()
  where  status             = 'active'
    and  profile_expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function fn_expire_founder_profiles() is
  'Nightly job: expire active founder profiles past their 90-day TTL. '
  'Schedule with: select cron.schedule(''expire-founders'', ''0 2 * * *'', $$select fn_expire_founder_profiles()$$);';


-- ────────────────────────────────────────────────────────────
-- BL-4  Nightly: expire overdue matches + issue investor warnings
-- ────────────────────────────────────────────────────────────

create or replace function fn_expire_matches_and_warn()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match   record;
  v_count   int := 0;
begin
  for v_match in
    select id, investor_id
    from   matches
    where  status               = 'active'
      and  response_deadline    < now()
      and  investor_responded_at is null
  loop
    -- Expire the match
    update matches
    set    status = 'expired'
    where  id = v_match.id;

    -- Issue a warning to the investor
    insert into investor_warnings (investor_id, reason, issued_at)
    values (
      v_match.investor_id,
      'Match expired without response (14-day window elapsed).',
      now()
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function fn_expire_matches_and_warn() is
  'Nightly job: expire active matches past their 14-day response window and issue investor warnings. '
  'Schedule with: select cron.schedule(''expire-matches'', ''30 2 * * *'', $$select fn_expire_matches_and_warn()$$);';

-- ────────────────────────────────────────────────────────────
-- BL-5  Auto-revoke investor approval on 3+ unresolved warnings
-- ────────────────────────────────────────────────────────────
-- Fired AFTER INSERT on investor_warnings.
-- Counts unresolved warnings for the investor; if >= 3, sets
-- investor_profiles.is_approved = false.
-- ────────────────────────────────────────────────────────────

create or replace function fn_check_investor_warning_threshold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unresolved int;
begin
  select count(*) into v_unresolved
  from   investor_warnings
  where  investor_id  = new.investor_id
    and  resolved_at  is null;

  if v_unresolved >= 3 then
    update investor_profiles
    set    is_approved = false,
           updated_at  = now()
    where  id = new.investor_id;
  end if;

  return new;
end;
$$;

create trigger trg_check_investor_warning_threshold
  after insert on investor_warnings
  for each row execute function fn_check_investor_warning_threshold();


-- ────────────────────────────────────────────────────────────
-- BL-6  Auto-set profile_expires_at when founder is approved
-- ────────────────────────────────────────────────────────────
-- Fired BEFORE UPDATE on founder_profiles.
-- When is_approved transitions false → true (or status → active),
-- set profile_expires_at = now() + 90 days.
-- ────────────────────────────────────────────────────────────

create or replace function fn_set_founder_expiry_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Detect the approval transition
  if (old.is_approved = false and new.is_approved = true)
     or (old.status <> 'active' and new.status = 'active')
  then
    -- Only set if not already set (don't reset on re-approvals)
    if new.profile_expires_at is null then
      new.profile_expires_at := now() + interval '90 days';
    end if;
    -- Also ensure status follows is_approved
    if new.is_approved = true and new.status = 'pending' then
      new.status := 'active';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_set_founder_expiry_on_approval
  before update on founder_profiles
  for each row execute function fn_set_founder_expiry_on_approval();


-- ────────────────────────────────────────────────────────────
-- BL-7  Auto-create profile row on new auth user signup
-- ────────────────────────────────────────────────────────────
-- Fired AFTER INSERT on auth.users.
-- Reads the role from raw_user_meta_data (set during signup).
-- ────────────────────────────────────────────────────────────

create or replace function fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  -- Expect the client to pass role in options.data during signUp()
  -- e.g. supabase.auth.signUp({ email, password, options: { data: { role: 'founder' } } })
  v_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::user_role,
    'founder'   -- safe default; admin flow should always pass role explicitly
  );

  insert into public.profiles (id, role, email, created_at)
  values (new.id, v_role, new.email, now())
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function fn_handle_new_user();


-- ────────────────────────────────────────────────────────────
-- pg_cron scheduling  (enable pg_cron extension first in Supabase dashboard)
-- ────────────────────────────────────────────────────────────
-- Uncomment once pg_cron is enabled under Database → Extensions.
--
-- select cron.schedule(
--   'expire-founder-profiles',
--   '0 2 * * *',      -- 02:00 UTC nightly
--   $$ select fn_expire_founder_profiles(); $$
-- );
--
-- select cron.schedule(
--   'expire-matches-and-warn',
--   '30 2 * * *',     -- 02:30 UTC nightly
--   $$ select fn_expire_matches_and_warn(); $$
-- );
