import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  apiEnforcementContracts,
  mutationProxyExemptions,
} from "./lib/api-enforcement-contracts.mjs";

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.name === "route.ts") files.push(relative(process.cwd(), path));
  }
  return files;
}

const routeFiles = (await walk(join(process.cwd(), "src/app/api"))).sort();
const assigned = new Map();
const findings = [];
for (const [boundary, paths] of Object.entries(apiEnforcementContracts)) {
  for (const path of paths) {
    if (assigned.has(path)) findings.push(`${path}: assigned to multiple boundaries`);
    assigned.set(path, boundary);
  }
}
for (const path of routeFiles) {
  if (!assigned.has(path)) findings.push(`${path}: missing enforcement contract`);
}
for (const path of assigned.keys()) {
  if (!routeFiles.includes(path)) findings.push(`${path}: contract points to a missing route`);
}

const unsafePattern = /export\s+(?:async\s+function|const)\s+(POST|PUT|PATCH|DELETE)\b/g;
for (const path of routeFiles) {
  const source = await readFile(path, "utf8");
  const methods = [...source.matchAll(unsafePattern)].map((match) => match[1]);
  const boundary = assigned.get(path);
  if (methods.length && boundary === "public-read")
    findings.push(`${path}: mutation is classified as public read`);
  if (boundary === "authenticated" &&
      !/auth\.(?:getUser|getClaims)\s*\(/.test(source))
    findings.push(`${path}: authenticated contract does not verify identity`);
  if (boundary === "staff" &&
      !/authorize(?:Staff|Administrator)\s*\(/.test(source))
    findings.push(`${path}: staff contract lacks centralized authorization`);
  if (boundary === "cron" && !/CRON_SECRET/.test(source))
    findings.push(`${path}: cron contract lacks a secret check`);
  if (boundary === "webhook" &&
      !/(verifyMuxWebhook|webhooks\.constructEvent)/.test(source))
    findings.push(`${path}: webhook contract lacks provider signature verification`);
  if (boundary === "rate-limited-public" &&
      !/(consumeDistributedRateLimit|AUTH_CONSENT_SECRET)/.test(source))
    findings.push(`${path}: public mutation lacks abuse enforcement`);
  if (methods.length && mutationProxyExemptions.has(path) &&
      !["cron", "webhook"].includes(boundary))
    findings.push(`${path}: proxy exemption lacks a trusted local boundary`);
}

if (findings.length) {
  console.error("API enforcement contract audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`API enforcement contracts passed for ${routeFiles.length} routes.`);
