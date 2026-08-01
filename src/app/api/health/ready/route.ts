import {
  evaluateProviderReadiness,
  publicProviderReadiness,
} from "@/lib/provider-readiness.mjs";

export function GET() {
  const readiness = evaluateProviderReadiness(process.env, { production: true });
  const ready = readiness.status === "ready";
  return Response.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "aniverse",
      integrations: publicProviderReadiness(readiness),
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
