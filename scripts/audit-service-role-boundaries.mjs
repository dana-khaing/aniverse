import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const findings = [];
const privilegedRoutes = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if ([".ts", ".tsx"].includes(extname(path))) files.push(path);
  }
  return files;
}

for (const file of await walk(sourceRoot)) {
  const path = relative(root, file);
  const source = await readFile(file, "utf8");
  const clientModule = /^\s*["']use client["'];/m.test(source);
  if (
    clientModule &&
    (source.includes("@/lib/supabase/admin") ||
      source.includes("SUPABASE_SERVICE_ROLE_KEY"))
  )
    findings.push(`${path}: client module reaches service-role credentials`);
  if (/NEXT_PUBLIC_[A-Z0-9_]*SERVICE_ROLE/.test(source))
    findings.push(`${path}: service-role credential uses a public prefix`);
  if (
    path.includes("/api/v1/admin/") &&
    /(app_metadata|user_metadata)\s*(?:\.|\[).*role/.test(source)
  )
    findings.push(`${path}: authorization trusts mutable or stale metadata`);
  if (
    path.includes("/api/v1/admin/") &&
    source.includes("getAdminClient") &&
    !source.includes("@/lib/supabase/authorization") &&
    !path.endsWith("/strikes/expire/route.ts")
  )
    findings.push(`${path}: admin service-role route lacks centralized guard`);
  if (path.includes("/app/api/") && source.includes("getAdminClient")) {
    const boundary = source.includes("@/lib/supabase/authorization")
      ? "staff-role"
      : /verifyMuxWebhook|verifyStripeWebhook|stripe-signature|mux-signature/.test(
            source,
          )
        ? "webhook-signature"
        : source.includes("CRON_SECRET")
          ? "cron-secret"
          : source.includes("consumeRateLimit") &&
              source.includes("Untrusted submission origin")
            ? "rate-limited-public"
          : source.includes("@/lib/supabase/server")
            ? "authenticated-scope"
            : null;
    if (!boundary)
      findings.push(`${path}: service-role route has no recognized trust boundary`);
    else privilegedRoutes.push({ path, boundary });
  }
  if (
    path.includes("/api/v1/admin/") &&
    /export async function (?:POST|PUT|PATCH|DELETE)\(request: Request\)/.test(
      source,
    ) &&
    !/authorize(?:Staff|Administrator)\(request\)/.test(source)
  )
    findings.push(`${path}: staff mutation lacks centralized origin enforcement`);
}

if (findings.length) {
  console.error("Service-role boundary audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(
  `Service-role boundary audit passed for ${privilegedRoutes.length} privileged routes.`,
);
