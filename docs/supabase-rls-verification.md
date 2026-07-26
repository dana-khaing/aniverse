# Supabase migration and RLS verification

AniVerse verifies authorization at three levels:

1. `pnpm test:rls:audit` checks that every table created in the exposed
   `public` schema has an explicit `ENABLE ROW LEVEL SECURITY` statement.
2. `pnpm test:rls:local` runs the pgTAP suite in
   `supabase/tests/multi_account_rls_test.sql` against the local Supabase
   containers. It covers private profiles, libraries, roles, creator-team
   isolation, anonymous catalog access, and blocked role escalation.
3. `pnpm verify:rls:live` signs in as two dedicated real accounts, creates one
   temporary custom list for each account, verifies cross-account reads and
   writes are denied, checks role visibility and escalation, then removes the
   fixtures.

## Local database verification

Docker Desktop must be running.

```bash
supabase start
supabase db reset
pnpm test:rls:local
supabase stop
```

`db reset` applies every committed migration in timestamp order before loading
the seed. The pgTAP test runs in a transaction and rolls back all test users and
fixtures.

## Live project verification

Create two ordinary, non-admin AniVerse accounts in the target Supabase
project. Do not use personal or production administrator accounts. Configure:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
ANIVERSE_RLS_USER_A_EMAIL
ANIVERSE_RLS_USER_A_PASSWORD
ANIVERSE_RLS_USER_B_EMAIL
ANIVERSE_RLS_USER_B_PASSWORD
```

The verifier intentionally does not accept or use a service-role key. It never
prints credentials, access tokens, user IDs, list IDs, or returned row data.
Temporary fixtures use random UUIDs and are removed in a `finally` cleanup.

For GitHub Actions, store the same values as repository or environment secrets,
prefixing the first two with `ANIVERSE_` as shown in
`.github/workflows/verify-supabase-rls.yml`. Protect the
`production-rls-verification` environment with required reviewers, then run the
workflow manually.

## Expected evidence

A successful live run emits only:

```json
{
  "status": "passed",
  "checks": 10,
  "verifiedAt": "..."
}
```

If configuration is absent, the command exits with code `2`. Any authentication,
query, cleanup-sensitive, or isolation failure exits non-zero. The current
generic Supabase project connected to the workspace is not treated as AniVerse;
verification must target an explicitly configured AniVerse project.
