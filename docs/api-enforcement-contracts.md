# API enforcement contracts

Every App Router API endpoint is registered in
`scripts/lib/api-enforcement-contracts.mjs` with exactly one trust boundary:
public read, authenticated account, staff role, rate-limited public submission,
signed webhook, or secret-authenticated cron task.

Run `pnpm test:api:contracts` after adding or changing a route. CI fails when a
route is unregistered, registered more than once, or no longer contains the
identity, authorization, signature, secret, or abuse-control mechanism promised
by its contract. Mutating browser routes are additionally protected by the
global same-origin, content-type, and payload-size proxy.

Destructive self-service routes are listed separately and must perform recent
authentication. Administrator mutations obtain both current database roles and
step-up enforcement through the centralized authorization module.

This structural gate complements behavioral unit, browser, webhook replay, RLS,
and live multi-account verification; it does not replace those tests.
