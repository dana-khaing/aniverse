# Semantic RLS verification

AniVerse rejects database migrations that introduce any of these exposed-schema
security regressions:

- a `public` table without row-level security;
- `auth.role()` policy checks instead of authenticated identity or claims;
- an update policy without a matching `WITH CHECK` boundary;
- a public view that does not use `security_invoker = true`;
- a `SECURITY DEFINER` function without a locked `search_path` or an explicit
  removal of default `PUBLIC` execute access.

Run `pnpm test:rls:audit` before committing a migration. The production RLS
workflow also runs Supabase's hosted security advisors and the five-account
isolation verifier. Configure its protected environment with
`ANIVERSE_SUPABASE_DB_URL` plus the viewer, creator, moderator, and administrator
test-account secrets documented in the workflow.

The pgTAP suite verifies real database policy behavior locally with
`pnpm test:rls:local`. It includes cross-account library, profile, creator-team,
role, catalog, and watch-party invitation isolation checks.
