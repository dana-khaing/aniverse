# Supabase migration and RLS verification

AniVerse verifies authorization at three levels:

1. `pnpm test:rls:audit` checks that every table created in the exposed
   `public` schema has an explicit `ENABLE ROW LEVEL SECURITY` statement.
2. `pnpm test:rls:local` runs the pgTAP suite in
   `supabase/tests/multi_account_rls_test.sql` against the local Supabase
   containers. It covers private profiles, libraries, roles, creator-team
   isolation, anonymous catalog access, and blocked role escalation.
3. `pnpm verify:rls:live` signs in as five dedicated real accounts (two
   viewers, creator, moderator, and administrator). It verifies anonymous
   catalog access, private-row isolation, expected roles, and blocked
   escalation before removing every generated fixture.

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

Create five dedicated AniVerse verification accounts in the target project.
Assign the expected creator, moderator, and administrator roles before the
run. These must not be personal accounts or the sole production administrator.
Configure:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
ANIVERSE_RLS_VIEWER_A_EMAIL / ANIVERSE_RLS_VIEWER_A_PASSWORD
ANIVERSE_RLS_VIEWER_B_EMAIL / ANIVERSE_RLS_VIEWER_B_PASSWORD
ANIVERSE_RLS_CREATOR_EMAIL / ANIVERSE_RLS_CREATOR_PASSWORD
ANIVERSE_RLS_MODERATOR_EMAIL / ANIVERSE_RLS_MODERATOR_PASSWORD
ANIVERSE_RLS_ADMIN_EMAIL / ANIVERSE_RLS_ADMIN_PASSWORD
ANIVERSE_RLS_REPORT_PATH (optional)
```

The verifier intentionally does not accept or use a service-role key. It never
prints credentials, access tokens, user IDs, list IDs, or returned row data.
Temporary fixtures use random UUIDs and are removed in a `finally` cleanup.
Run `pnpm verify:rls:config` first to report missing configuration without
contacting Supabase. The former `USER_A` and `USER_B` variable names remain
accepted locally for viewer compatibility.

For GitHub Actions, store the same values as repository or environment secrets,
prefixing the first two with `ANIVERSE_` as shown in
`.github/workflows/verify-supabase-rls.yml`. Protect the
`production-rls-verification` environment with required reviewers, then run the
workflow manually. GitHub uploads the redacted JSON result as
`supabase-rls-verification`; it contains check names and outcomes, never
identities or row contents.

## Expected evidence

A successful live run emits only:

```json
{
  "status": "passed",
  "checks": [
    { "name": "all verification identities are distinct", "status": "passed" }
  ],
  "checkCount": 20,
  "accountCount": 5,
  "cleanup": "passed",
  "verifiedAt": "..."
}
```

If configuration is absent, the command exits with code `2`. Any authentication,
query, cleanup-sensitive, or isolation failure exits non-zero. The current
generic Supabase project connected to the workspace is not treated as AniVerse;
verification must target an explicitly configured AniVerse project.
