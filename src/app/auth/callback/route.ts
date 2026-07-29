import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  oauthConsentCookie,
  verifyOAuthConsentIntent,
} from "@/lib/oauth-consent";

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const next = url.searchParams.get("next") ?? "/account";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const secret = process.env.AUTH_CONSENT_SECRET ?? process.env.CRON_SECRET;
      const intent = secret
        ? verifyOAuthConsentIntent(
            request.headers.get("cookie")?.match(
              new RegExp(`(?:^|; )${oauthConsentCookie}=([^;]+)`),
            )?.[1] ?? "",
            secret,
          )
        : null;
      if (intent && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user)
          await getAdminClient().from("consent_records").insert([
            { user_id: user.id, consent_type: "terms", document_version: intent.version, granted: true, source: "oauth_signup" },
            { user_id: user.id, consent_type: "privacy", document_version: intent.version, granted: true, source: "oauth_signup" },
          ]);
      }
      const response = NextResponse.redirect(new URL(next, url.origin));
      response.cookies.delete(oauthConsentCookie);
      return response;
    }
  }
  return NextResponse.redirect(new URL("/sign-in?error=auth_callback", url.origin));
}
