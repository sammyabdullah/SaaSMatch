-- profile_views: logs when an investor views a founder profile
create table if not exists profile_views (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references profiles(id) on delete cascade,
  founder_id uuid not null references profiles(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists profile_views_founder_viewed on profile_views(founder_id, viewed_at desc);
create index if not exists profile_views_investor_viewed on profile_views(investor_id, viewed_at desc);
alter table profile_views enable row level security;
create policy "investors insert own views" on profile_views for insert with check (auth_user_role() = 'investor' and investor_id = auth.uid());
create policy "founders read own views" on profile_views for select using (auth_user_role() = 'founder' and founder_id = auth.uid());
create policy "investors read own views" on profile_views for select using (auth_user_role() = 'investor' and investor_id = auth.uid());
create policy "admins read all views" on profile_views for select using (auth_user_role() = 'admin');

-- Add portfolio_count to investor_profiles
alter table investor_profiles add column if not exists portfolio_count int not null default 0;
