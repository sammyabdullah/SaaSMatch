# SaaSMatch — Supabase Backend

## Migrations

Run in order against your Supabase project (SQL editor or `supabase db push`):

| File | What it does |
|---|---|
| `00001_enums_and_tables.sql` | All enums, tables, indexes, `updated_at` trigger |
| `00002_rls_policies.sql` | All Row-Level Security policies |
| `00003_functions_and_triggers.sql` | Business logic: mutual-flag matching, flag limit, approval expiry, nightly jobs, auto-warnings |

## Schema overview

```
auth.users (Supabase managed)
    └── profiles           (role: founder | investor | admin)
            ├── founder_profiles
            └── investor_profiles

flags          ← private interest signals (never readable by users)
matches        ← created automatically when both sides flag each other
investor_warnings ← issued automatically on match non-response
```

## Business logic summary

| # | Trigger / Function | When |
|---|---|---|
| BL-1 | `fn_check_mutual_flag` | AFTER INSERT on `flags` — creates match + deletes both flags when mutual |
| BL-2 | `fn_enforce_founder_flag_limit` | BEFORE INSERT on `flags` — rejects if founder already has 10 outbound flags |
| BL-3 | `fn_expire_founder_profiles()` | Nightly cron — expires active profiles past 90-day TTL |
| BL-4 | `fn_expire_matches_and_warn()` | Nightly cron — expires matches with no investor response + issues warning |
| BL-5 | `fn_check_investor_warning_threshold` | AFTER INSERT on `investor_warnings` — revokes approval at 3 unresolved warnings |
| BL-6 | `fn_set_founder_expiry_on_approval` | BEFORE UPDATE on `founder_profiles` — sets 90-day expiry on approval |
| BL-7 | `fn_handle_new_user` | AFTER INSERT on `auth.users` — creates `profiles` row from signup metadata |

## Nightly cron jobs

Enable the `pg_cron` extension in Supabase dashboard (Database → Extensions), then run the two commented-out `cron.schedule()` calls at the bottom of `00003_functions_and_triggers.sql`.

## RLS policy matrix

| Table | Founder | Investor | Admin |
|---|---|---|---|
| `profiles` | Own row only | Own row only | All |
| `founder_profiles` | Own row (CRUD) | Approved + active only (read) | All |
| `investor_profiles` | Approved only (read) | Own row (CRUD) | All |
| `flags` | Insert own only, no reads | Insert own only, no reads | All |
| `matches` | Participant read; no write | Participant read; update `investor_responded_at` | All |
| `investor_warnings` | None | Own read only | All |

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Generating TypeScript types

Once the migrations are applied to a live project:

```bash
npx supabase gen types typescript --project-id <your-project-id> --schema public > lib/supabase/types.ts
```
