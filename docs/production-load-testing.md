# Production-scale load and index verification

The load harness is intentionally targetless: it cannot send traffic anywhere
until an operator supplies a URL. Start AniVerse with production-like data, then
run:

```bash
pnpm load:test --url=http://localhost:3000 --duration=60 --concurrency=50
```

The command exercises home, browse, and autocomplete traffic and fails when
error rate exceeds 1% or p95 latency exceeds 750 ms. Override thresholds with
`--max-p95=1000` and `--max-error-rate=0.02`. Use a staging URL—not production—
for higher concurrency unless an approved load-test window exists.

`pnpm test:indexes` statically verifies the indexes that cover playback lookup,
creator analytics, the community feed, Creator Studio title lookup, and active
invitations. After applying migrations to staging, use the Supabase SQL editor
to run `EXPLAIN (ANALYZE, BUFFERS)` for those query shapes and confirm index
scans with representative data. Record p50, p95, p99, throughput, error rate,
row counts, query plans, and the migration SHA in the release evidence.
