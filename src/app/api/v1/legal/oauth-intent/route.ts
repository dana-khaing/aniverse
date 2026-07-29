import { NextResponse } from "next/server";
import { z } from "zod";
import { legalVersion } from "@/lib/legal";
import {
  oauthConsentCookie,
  signOAuthConsentIntent,
} from "@/lib/oauth-consent";

const intentSchema = z.object({
  accepted: z.literal(true),
  version: z.literal(legalVersion),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted OAuth intent" }, { status: 403 });
  const parsed = intentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Legal acknowledgement required" }, { status: 400 });
  const secret = process.env.AUTH_CONSENT_SECRET ?? process.env.CRON_SECRET;
  if (!secret)
    return Response.json({ error: "OAuth consent signing is unavailable" }, { status: 503 });
  const response = NextResponse.json({ ready: true });
  response.cookies.set(
    oauthConsentCookie,
    signOAuthConsentIntent(secret, parsed.data.version),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    },
  );
  return response;
}
