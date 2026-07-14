export function GET() {
  return Response.json({
    status: "ok",
    service: "aniverse",
    mode: process.env.NEXT_PUBLIC_SUPABASE_URL ? "hosted" : "local",
    integrations: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      resend: Boolean(process.env.RESEND_API_KEY),
      sentry: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      mux: Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET),
    },
    timestamp: new Date().toISOString(),
  });
}
