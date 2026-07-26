# Administrator and service-role security

AniVerse treats `public.user_roles` as the authority for administrator and
moderator access. Route authorization never trusts user metadata or cached JWT
role claims. `authorizeAdministrator` and `authorizeStaff` authenticate the
request, query the caller's own role rows through RLS, and only then permit a
server-side service client to perform privileged work.

## Trust boundaries

- `src/lib/supabase/admin.ts` is server-only. The service-role key must never
  use a `NEXT_PUBLIC_` name or enter a Client Component.
- Interactive administrator routes use the centralized database-backed guard.
- Creator routes authenticate the user and verify team membership before using
  elevated access for team-scoped records.
- Account backup and deletion routes authenticate the current user and scope
  every elevated storage or Auth operation to that user's ID.
- Webhooks verify provider signatures before elevated writes.
- Scheduled strike expiry requires `CRON_SECRET`; it does not accept browser
  sessions.
- `manage_user_access` is executable only by `service_role`, validates the
  actor's current administrator role, blocks self-removal/self-suspension, and
  protects the final administrator.

Run `pnpm test:security:service-role` in CI and before release. This fails if a
Client Component reaches the privileged client, a service key is publicly
named, an administrator route trusts metadata, or an interactive elevated
route bypasses the centralized guard.
