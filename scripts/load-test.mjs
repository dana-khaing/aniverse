import { performance } from "node:perf_hooks";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, value = "true"] = argument.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const baseUrl = String(args.url ?? process.env.LOAD_TEST_URL ?? "").replace(
  /\/$/,
  "",
);
const durationMs = Number(args.duration ?? 30) * 1_000;
const concurrency = Number(args.concurrency ?? 20);
const maxP95 = Number(args["max-p95"] ?? 750);
const maxErrorRate = Number(args["max-error-rate"] ?? 0.01);
const paths = String(args.paths ?? "/,/browse,/api/v1/search?q=asteria")
  .split(",")
  .filter(Boolean);

if (!/^https?:\/\//.test(baseUrl)) {
  console.error(
    "Provide --url=http://localhost:3000 or set LOAD_TEST_URL. No default production target is used.",
  );
  process.exit(2);
}
if (
  !Number.isFinite(durationMs) ||
  !Number.isInteger(concurrency) ||
  concurrency < 1
) {
  console.error("Duration and concurrency must be positive numbers.");
  process.exit(2);
}

const latencies = [];
let requests = 0;
let failures = 0;
const deadline = performance.now() + durationMs;

async function worker(workerId) {
  let index = workerId;
  while (performance.now() < deadline) {
    const path = paths[index++ % paths.length];
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { "user-agent": "aniverse-load-verifier/1.0" },
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status >= 400 && response.status !== 429) failures++;
      await response.arrayBuffer();
    } catch {
      failures++;
    } finally {
      requests++;
      latencies.push(performance.now() - started);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));
latencies.sort((a, b) => a - b);
const percentile = (value) =>
  latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * value))] ??
  Infinity;
const errorRate = requests ? failures / requests : 1;
const result = {
  target: baseUrl,
  concurrency,
  durationSeconds: durationMs / 1_000,
  requests,
  requestsPerSecond: Number((requests / (durationMs / 1_000)).toFixed(2)),
  errorRate: Number(errorRate.toFixed(4)),
  latencyMs: {
    p50: Number(percentile(0.5).toFixed(1)),
    p95: Number(percentile(0.95).toFixed(1)),
    p99: Number(percentile(0.99).toFixed(1)),
  },
  thresholds: { maxP95, maxErrorRate },
};
console.log(JSON.stringify(result, null, 2));
if (process.env.ANIVERSE_LOAD_REPORT_PATH) {
  await mkdir(dirname(process.env.ANIVERSE_LOAD_REPORT_PATH), { recursive: true });
  await writeFile(
    process.env.ANIVERSE_LOAD_REPORT_PATH,
    `${JSON.stringify(result, null, 2)}\n`,
    { mode: 0o600 },
  );
}
if (result.latencyMs.p95 > maxP95 || errorRate > maxErrorRate) process.exit(1);
