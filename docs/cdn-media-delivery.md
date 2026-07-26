# CDN and media delivery verification

AniVerse caches only shared discovery data. Search/autocomplete responses use a
60-second shared TTL with five minutes of stale-while-revalidate; rate-limit
responses, signed playback manifests, health data, and user data are private or
`no-store`. Service workers always revalidate so a stale offline shell cannot
pin an old release.

Run a header probe against local or approved staging:

```bash
CDN_TEST_URL=http://localhost:3000 pnpm verify:cdn
```

To verify an uploaded media origin as well, set `CDN_MEDIA_PATH` to a safe test
asset. The probe sends `Range: bytes=0-31` and requires `206`,
`Accept-Ranges: bytes`, and a valid `Content-Range`. For Mux playback, use a
temporary signed test path and never save its token in logs or CI variables.

At staging release time, run the probe twice and record provider cache headers
(`Age`, `X-Cache`, or `X-Vercel-Cache`), regional response time, range behavior,
and the deployment SHA. Signed manifests and subtitle URLs must remain private
even if a CDN sits in front of the application.
