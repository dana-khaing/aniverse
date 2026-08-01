# Production release enforcement

The `Production release enforcement gate` is a manual, protected-environment
workflow. A release owner must run it against the intended production
configuration before promotion. It performs the following blocking checks:

- API trust contracts, semantic RLS, service-role boundaries, and hot-path indexes;
- complete provider configuration, plus optional live Supabase, Mux, Resend,
  Stripe, and deployed Vercel readiness probes;
- Supabase security advisors and five-account data, role, watch-party, creator,
  and Storage isolation verification;
- a Vercel production build, CDN/cache checks, and a bounded load test;
- redacted JSON/text evidence retained as a workflow artifact for 90 days.

Configure the `production-release-verification` GitHub environment with required
reviewers. Store credentials only as environment secrets and the approved
production URL/media fixture as environment variables. Never point the load
test at a target without operational approval.

`/api/health/live` reports whether the process can serve requests.
`/api/health/ready` returns HTTP 503 until all production providers are valid.
The legacy `/api/health` diagnostic remains available for compatibility and
never includes secret values.

Database restore remains an independent scheduled/manual drill because it must
target an isolated database whose name includes `drill`, `restore`, or `test`.
Its success is operational evidence, not an action that the release gate may
perform against production.
