-- ============================================================
-- SaaSMatch — Migration 00001: Enums & Tables
-- ============================================================
-- Run this in the Supabase SQL editor (or via supabase db push).
-- Order matters: extensions → types → tables → indexes.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Extensions
-- ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────
-- 1. Enum Types
-- ────────────────────────────────────────────────────────────

create type user_role as enum ('founder', 'investor', 'admin');

create type founder_stage as enum ('pre-seed', 'seed', 'series-a', 'series-b');

create type arr_range as enum ('0-500k', '500k-2m', '2m-5m', '5m-plus');

create type gtm_motion as enum ('sales-led', 'product-led', 'hybrid');

create type revenue_model as enum (
  'seat-based',
  'usage-based',
  'platform-fee',
  'other'
);

create type founder_status as enum ('pending', 'active', 'expired', 'closed');

create type match_status as enum ('active', 'responded', 'expired', 'closed');

create type flag_side as enum ('founder', 'investor');

-- ────────────────────────────────────────────────────────────
-- 2. profiles  (one row per auth.users record)
-- ────────────────────────────────────────────────────────────
create table profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  role       user_role   not null,
  email      text        not null,
  created_at timestamptz not null default now()
);

comment on table profiles is
  'One row per auth user. Stores role only — detail lives in founder_profiles / investor_profiles.';

-- ────────────────────────────────────────────────────────────
-- 3. founder_profiles
-- ────────────────────────────────────────────────────────────
create table founder_profiles (
  id                   uuid           primary key references profiles(id) on delete cascade,

  -- company basics
  company_name         text           not null,
  location             text           not null,
  founded_year         int            not null check (founded_year >= 1900 and founded_year <= extract(year from now()) + 1),

  -- traction
  stage                founder_stage  not null,
  arr_range            arr_range      not null,
  arr_exact            int            check (arr_exact >= 0),           -- optional, for internal sorting only
  mom_growth_pct       int            not null check (mom_growth_pct >= 0),
  nrr_pct              int            not null check (nrr_pct >= 0),
  acv_usd              int            not null check (acv_usd >= 0),

  -- go-to-market
  gtm_motion           gtm_motion     not null,
  revenue_model        revenue_model  not null,

  -- fundraise
  raising_amount_usd   int            not null check (raising_amount_usd > 0),
  wants_lead           boolean        not null default false,
  wants_board_seat     boolean        not null default false,
  check_size_min_usd   int            not null check (check_size_min_usd >= 0),
  check_size_max_usd   int            not null check (check_size_max_usd >= check_size_min_usd),

  -- fit
  geography_preference text           not null,
  why_now              text           not null check (char_length(why_now) <= 500),
  product_categories   text[]         not null default '{}',

  -- lifecycle
  status               founder_status not null default 'pending',
  profile_expires_at   timestamptz,
  is_approved          boolean        not null default false,

  created_at           timestamptz    not null default now(),
  updated_at           timestamptz    not null default now()
);

comment on column founder_profiles.arr_exact is
  'Raw ARR in USD for internal sorting — never surfaced to investors.';
comment on column founder_profiles.profile_expires_at is
  'Set to now() + 90 days when status transitions to active.';
comment on column founder_profiles.status is
  'pending → active (on approval) → expired (90-day TTL) | closed (founder withdraws).';

-- ────────────────────────────────────────────────────────────
-- 4. investor_profiles
-- ────────────────────────────────────────────────────────────
create table investor_profiles (
  id                      uuid         primary key references profiles(id) on delete cascade,

  firm_name               text         not null,
  partner_name            text         not null,
  location                text         not null,

  -- check parameters
  check_size_min_usd      int          not null check (check_size_min_usd >= 0),
  check_size_max_usd      int          not null check (check_size_max_usd >= check_size_min_usd),
  stages                  founder_stage[] not null default '{}',
  leads_rounds            boolean      not null default false,
  takes_board_seat        boolean      not null default false,

  -- focus
  geography_focus         text         not null,
  saas_subcategories      text[]       not null default '{}' check (array_length(saas_subcategories, 1) >= 3),
  arr_sweet_spot_min      int          not null check (arr_sweet_spot_min >= 0),
  arr_sweet_spot_max      int          not null check (arr_sweet_spot_max >= arr_sweet_spot_min),

  -- thesis
  thesis_statement        text         not null check (char_length(thesis_statement) <= 500),
  value_beyond_capital    text         not null check (char_length(value_beyond_capital) <= 300),

  -- ops
  typical_response_days   int          not null check (typical_response_days > 0),
  is_approved             boolean      not null default false,
  last_active_at          timestamptz,

  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now()
);

comment on column investor_profiles.saas_subcategories is
  'Must contain at least 3 entries — enforced by check constraint and application validation.';

-- ────────────────────────────────────────────────────────────
-- 5. flags
-- ────────────────────────────────────────────────────────────
create table flags (
  id          uuid       primary key default gen_random_uuid(),
  founder_id  uuid       not null references founder_profiles(id) on delete cascade,
  investor_id uuid       not null references investor_profiles(id) on delete cascade,
  flagged_by  flag_side  not null,
  created_at  timestamptz not null default now(),

  -- one flag per direction per pair
  unique (founder_id, investor_id, flagged_by)
);

comment on table flags is
  'Private interest signals. Never readable by either party — only the resulting match is visible.';

-- ────────────────────────────────────────────────────────────
-- 6. matches
-- ────────────────────────────────────────────────────────────
create table matches (
  id                    uuid         primary key default gen_random_uuid(),
  founder_id            uuid         not null references founder_profiles(id) on delete cascade,
  investor_id           uuid         not null references investor_profiles(id) on delete cascade,
  matched_at            timestamptz  not null default now(),
  investor_responded_at timestamptz,
  response_deadline     timestamptz  not null,
  status                match_status not null default 'active',
  created_at            timestamptz  not null default now(),

  -- only one active match per pair at a time
  unique (founder_id, investor_id)
);

comment on column matches.response_deadline is
  'Automatically set to matched_at + 14 days by the match-creation trigger.';

-- ────────────────────────────────────────────────────────────
-- 7. investor_warnings
-- ────────────────────────────────────────────────────────────
create table investor_warnings (
  id          uuid        primary key default gen_random_uuid(),
  investor_id uuid        not null references investor_profiles(id) on delete cascade,
  reason      text        not null,
  issued_at   timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table investor_warnings is
  'Non-response warnings. Three unresolved warnings auto-revoke investor approval.';

-- ────────────────────────────────────────────────────────────
-- 8. Indexes  (beyond primary keys)
-- ────────────────────────────────────────────────────────────

-- founder lookups
create index idx_founder_profiles_status         on founder_profiles(status);
create index idx_founder_profiles_is_approved    on founder_profiles(is_approved);
create index idx_founder_profiles_expires        on founder_profiles(profile_expires_at) where status = 'active';

-- investor lookups
create index idx_investor_profiles_is_approved   on investor_profiles(is_approved);

-- flags lookups (mutual-flag check is the hot path)
create index idx_flags_founder_id                on flags(founder_id);
create index idx_flags_investor_id               on flags(investor_id);
create index idx_flags_pair                      on flags(founder_id, investor_id);

-- matches
create index idx_matches_founder_id              on matches(founder_id);
create index idx_matches_investor_id             on matches(investor_id);
create index idx_matches_status                  on matches(status);
create index idx_matches_deadline                on matches(response_deadline) where status = 'active';

-- warnings
create index idx_investor_warnings_investor_id   on investor_warnings(investor_id);
create index idx_investor_warnings_unresolved    on investor_warnings(investor_id) where resolved_at is null;

-- ────────────────────────────────────────────────────────────
-- 9. updated_at auto-stamp trigger helper
-- ────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_founder_profiles_updated_at
  before update on founder_profiles
  for each row execute function set_updated_at();

create trigger trg_investor_profiles_updated_at
  before update on investor_profiles
  for each row execute function set_updated_at();
