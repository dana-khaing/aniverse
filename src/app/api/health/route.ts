import {
  evaluateProviderReadiness,
  publicProviderReadiness,
} from "@/lib/provider-readiness.mjs";

export function GET() {
  const readiness = evaluateProviderReadiness(process.env);
  return Response.json(
    {
      status: readiness.status === "ready" ? "ok" : "degraded",
      service: "aniverse",
      mode: process.env.NEXT_PUBLIC_SUPABASE_URL ? "hosted" : "local",
      integrations: publicProviderReadiness(readiness),
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "cache-control": "no-store" },
    },
  );
}
