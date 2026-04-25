-- Tracks when a founder views an investor profile
create table if not exists investor_profile_views (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references profiles(id) on delete cascade,
  investor_id uuid not null references profiles(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists investor_profile_views_investor on investor_profile_views(investor_id, viewed_at desc);
create index if not exists investor_profile_views_founder on investor_profile_views(founder_id, viewed_at desc);
alter table investor_profile_views enable row level security;
create policy "founders insert own views" on investor_profile_views for insert with check (auth_user_role() = 'founder' and founder_id = auth.uid());
create policy "investors read own views" on investor_profile_views for select using (auth_user_role() = 'investor' and investor_id = auth.uid());
create policy "admins read all" on investor_profile_views for select using (auth_user_role() = 'admin');
