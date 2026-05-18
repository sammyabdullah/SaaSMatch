-- Add 'lender' to user_role enum
alter type user_role add value if not exists 'lender';

-- lender_profiles
create table if not exists lender_profiles (
  id                  uuid primary key references profiles(id) on delete cascade,
  institution_name    text not null,
  contact_name        text not null,
  website             text,
  location            text not null default '',
  loan_size_min_usd   bigint not null default 0,
  loan_size_max_usd   bigint not null default 0,
  loan_types          text[] not null default '{}',
  stages              text[] not null default '{}',
  geography_focus     text not null default '',
  saas_subcategories  text[] not null default '{}',
  arr_min_requirement bigint not null default 0,
  arr_max_sweet_spot  bigint not null default 0,
  thesis_statement    text not null default '',
  is_approved         boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- lender_flags (mirrors flags table but with lender_id)
create table if not exists lender_flags (
  id           uuid primary key default gen_random_uuid(),
  founder_id   uuid not null references founder_profiles(id) on delete cascade,
  lender_id    uuid not null references lender_profiles(id) on delete cascade,
  flagged_by   text not null check (flagged_by in ('founder', 'lender')),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (founder_id, lender_id)
);

-- RLS
alter table lender_profiles enable row level security;
alter table lender_flags enable row level security;

create policy "lender_profiles_own_select"
  on lender_profiles for select using (auth.uid() = id);

create policy "lender_profiles_own_insert"
  on lender_profiles for insert with check (auth.uid() = id);

create policy "lender_profiles_own_update"
  on lender_profiles for update using (auth.uid() = id);

create policy "lender_flags_lender_select"
  on lender_flags for select using (lender_id = auth.uid());

create policy "lender_flags_founder_select"
  on lender_flags for select using (founder_id = auth.uid());

create policy "lender_flags_lender_insert"
  on lender_flags for insert with check (lender_id = auth.uid());

create policy "lender_flags_update"
  on lender_flags for update
  using (lender_id = auth.uid() or founder_id = auth.uid());

create policy "lender_flags_lender_delete"
  on lender_flags for delete using (lender_id = auth.uid());
