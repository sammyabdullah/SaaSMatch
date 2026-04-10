-- ============================================================
-- SaaSMatch — Migration 00002: Row-Level Security Policies
-- ============================================================
-- Enable RLS on every table, then add explicit policies.
-- The golden rule: deny by default, grant minimally.
--
-- Helper: a convenience function that returns the calling
-- user's role from the profiles table.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Helper: current user's role
-- ────────────────────────────────────────────────────────────
create or replace function auth_user_role()
returns user_role
language sql stable security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
-- 1. profiles
-- ────────────────────────────────────────────────────────────
alter table profiles enable row level security;

-- Users can read their own profile row
create policy "profiles: own read"
  on profiles for select
  using (id = auth.uid());

-- Users can update their own profile row (email sync, etc.)
create policy "profiles: own update"
  on profiles for update
  using (id = auth.uid());

-- Insertion is done by the on-signup trigger (service role), but
-- allow the user to insert their own row as well (for manual calls)
create policy "profiles: own insert"
  on profiles for insert
  with check (id = auth.uid());

-- Admins can do everything
create policy "profiles: admin all"
  on profiles for all
  using (auth_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 2. founder_profiles
-- ────────────────────────────────────────────────────────────
alter table founder_profiles enable row level security;

-- Founders: full access to their own row only
create policy "founder_profiles: founder own read"
  on founder_profiles for select
  using (id = auth.uid());

create policy "founder_profiles: founder own insert"
  on founder_profiles for insert
  with check (id = auth.uid());

create policy "founder_profiles: founder own update"
  on founder_profiles for update
  using (id = auth.uid());

create policy "founder_profiles: founder own delete"
  on founder_profiles for delete
  using (id = auth.uid());

-- Investors: can see approved + active founder profiles only
-- (no arr_exact — that column is excluded at query time via views, not here)
create policy "founder_profiles: investor browse approved active"
  on founder_profiles for select
  using (
    auth_user_role() = 'investor'
    and is_approved = true
    and status = 'active'
  );

-- Admins: full access
create policy "founder_profiles: admin all"
  on founder_profiles for all
  using (auth_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 3. investor_profiles
-- ────────────────────────────────────────────────────────────
alter table investor_profiles enable row level security;

-- Investors: full access to their own row only
create policy "investor_profiles: investor own read"
  on investor_profiles for select
  using (id = auth.uid());

create policy "investor_profiles: investor own insert"
  on investor_profiles for insert
  with check (id = auth.uid());

create policy "investor_profiles: investor own update"
  on investor_profiles for update
  using (id = auth.uid());

create policy "investor_profiles: investor own delete"
  on investor_profiles for delete
  using (id = auth.uid());

-- Founders: can see approved investor profiles only
create policy "investor_profiles: founder browse approved"
  on investor_profiles for select
  using (
    auth_user_role() = 'founder'
    and is_approved = true
  );

-- Admins: full access
create policy "investor_profiles: admin all"
  on investor_profiles for all
  using (auth_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 4. flags  — PRIVATE, no direct user access
-- ────────────────────────────────────────────────────────────
-- Neither founders nor investors can query this table directly.
-- All reads go through the match trigger (service role) or admin.
alter table flags enable row level security;

-- Founders can insert their own flags (flagging an investor)
create policy "flags: founder insert own"
  on flags for insert
  with check (
    auth_user_role() = 'founder'
    and flagged_by = 'founder'
    and founder_id = auth.uid()
  );

-- Investors can insert their own flags (flagging a founder)
create policy "flags: investor insert own"
  on flags for insert
  with check (
    auth_user_role() = 'investor'
    and flagged_by = 'investor'
    and investor_id = auth.uid()
  );

-- No select policy for founders or investors → they cannot read flags at all.
-- Deletions are handled by the match trigger running as security definer.

-- Admins: full access
create policy "flags: admin all"
  on flags for all
  using (auth_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 5. matches
-- ────────────────────────────────────────────────────────────
alter table matches enable row level security;

-- Both the matched founder and the matched investor can see their match
create policy "matches: participant read"
  on matches for select
  using (
    founder_id = auth.uid()
    or investor_id = auth.uid()
  );

-- Investors can update investor_responded_at on their own matches
create policy "matches: investor respond"
  on matches for update
  using (
    auth_user_role() = 'investor'
    and investor_id = auth.uid()
  )
  with check (
    investor_id = auth.uid()
  );

-- Admins: full access
create policy "matches: admin all"
  on matches for all
  using (auth_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 6. investor_warnings
-- ────────────────────────────────────────────────────────────
alter table investor_warnings enable row level security;

-- Investors can see warnings issued against them
create policy "investor_warnings: investor own read"
  on investor_warnings for select
  using (
    auth_user_role() = 'investor'
    and investor_id = auth.uid()
  );

-- Admins: full access
create policy "investor_warnings: admin all"
  on investor_warnings for all
  using (auth_user_role() = 'admin');
