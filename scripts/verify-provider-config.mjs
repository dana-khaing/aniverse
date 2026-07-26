import {
  evaluateProviderReadiness,
  publicProviderReadiness,
} from "../src/lib/provider-readiness.mjs";

const readiness = evaluateProviderReadiness(process.env, { production: true });
const shouldProbe = process.argv.includes("--probe");

for (const provider of readiness.providers) {
  if (provider.status === "ready") continue;
  const details = [
    provider.missing.length
      ? `missing: ${provider.missing.join(", ")}`
      : undefined,
    provider.invalid.length
      ? `invalid: ${provider.invalid.join(", ")}`
      : undefined,
  ]
    .filter(Boolean)
    .join("; ");
  console.error(`${provider.id}: ${provider.status} (${details})`);
}

if (readiness.status !== "ready") {
  console.error("Production provider configuration is incomplete.");
  process.exit(1);
}

const probes = {
  supabase: () =>
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
      signal: AbortSignal.timeout(10_000),
    }),
  mux: () =>
    fetch("https://api.mux.com/video/v1/assets?limit=1", {
      headers: {
        authorization: `Basic ${Buffer.from(
          `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`,
        ).toString("base64")}`,
      },
      signal: AbortSignal.timeout(10_000),
    }),
  resend: () =>
    fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    }),
  stripe: () =>
    fetch("https://api.stripe.com/v1/account", {
      headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(10_000),
    }),
  vercel: () =>
    fetch(new URL("/api/health", process.env.NEXT_PUBLIC_SITE_URL), {
      signal: AbortSignal.timeout(10_000),
    }),
};

const completed = [];
if (shouldProbe) {
  for (const [provider, probe] of Object.entries(probes)) {
    const response = await probe().catch(() => undefined);
    if (!response?.ok)
      throw new Error(
        `${provider} readiness probe failed (${response?.status ?? "network"})`,
      );
    if (provider === "vercel") {
      const health = await response.json();
      if (
        health.status !== "ok" ||
        health.readiness !== "ready" ||
        Object.values(health.integrations ?? {}).some(
          (status) => status !== "ready",
        )
      )
        throw new Error("deployed health endpoint is not provider-ready");
    }
    completed.push(provider);
  }
}

console.log(
  JSON.stringify(
    {
      status: "ready",
      providers: publicProviderReadiness(readiness),
      probes: completed,
      verifiedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
