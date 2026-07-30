# Production provider configuration

AniVerse treats provider setup as a production release gate. The gate validates
Supabase, Mux, Resend, Stripe, Sentry, VAPID, and Vercel configuration without
printing secret values.

## Vercel project setup

Link a dedicated AniVerse project. Do not reuse an unrelated Vercel or Supabase
project.

```bash
vercel link --yes
vercel env pull .env.local --environment=development
```

Set secrets in Vercel’s Environment Variables settings, scoped separately for
Production, Preview, and Development. Preview deployments must not receive
production Supabase service-role, Stripe live-mode, Mux production, or Resend
production credentials.

The repository’s `.env.example` is the canonical inventory. Variables beginning
with `NEXT_PUBLIC_` are intentionally browser-visible; all API secrets, webhook
secrets, signing keys, and service-role keys must remain server-only.

## Provider checklist

| Provider | Required production configuration                          | Operational check                                             |
| -------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Supabase | URL, publishable key, service-role key                     | Auth health endpoint and multi-account RLS workflow           |
| Mux      | API token pair, webhook secret, signing key ID/private key | Authenticated asset-list request                              |
| Resend   | API key and verified-domain sender                         | Authenticated domain-list request                             |
| Stripe   | live secret key and webhook signing secret                 | Authenticated account request                                 |
| Sentry   | DSN, organization, project, source-map auth token          | Build uploads source maps; runtime health reports ready       |
| VAPID    | public/private key pair and HTTPS or `mailto:` subject     | Format validation; test delivery requires a real subscription |
| Vercel   | canonical HTTPS site URL and cron secret                   | Deployed `/api/health` response                               |

Use separate webhook endpoints and secrets for Preview and Production. Configure:

- Mux webhook: `https://<domain>/api/webhooks/media`
- Stripe webhook: `https://<domain>/api/webhooks/stripe`
- Vercel cron authentication: `CRON_SECRET`
- Resend sender: a verified address in `RESEND_FROM_EMAIL`

## Verification

Validate values pulled into the current shell:

```bash
pnpm verify:providers
```

Run read-only live probes after the production deployment is available:

```bash
pnpm verify:providers:live
```

The live command reads provider account metadata but does not create, update, or
delete provider resources. It never prints response bodies, credentials, or
tokens.

The gate also rejects combinations that are individually well-formed but unsafe:
identical Supabase public/service keys, Stripe test keys in Production,
`resend.dev` senders, and localhost production URLs. Set
`ANIVERSE_PROVIDER_REPORT_PATH` to write a permission-restricted, redacted JSON
report suitable for release evidence.

The manual `Verify production provider readiness` GitHub workflow pulls
Production variables from the linked Vercel project, validates them, builds the
exact production artifact, and optionally performs the live probes. Protect the
`production-provider-verification` environment with required reviewers.
Every workflow run uploads the latest redacted report as the
`production-provider-readiness` artifact, including failed configuration runs.

## Release order

1. Apply and verify Supabase migrations and RLS.
2. Configure provider secrets and webhook endpoints.
3. Run the production-readiness workflow without live probes.
4. Deploy or promote the tested artifact.
5. Run the workflow with live probes.
6. Review Sentry and Vercel runtime logs for early errors.

If a probe fails, do not rotate or replace credentials blindly. Check provider
scope, environment selection, domain verification, webhook destination, and
Vercel project linkage first.
