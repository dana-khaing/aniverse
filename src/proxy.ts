import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { enforceMutationRequest } from "@/lib/mutation-security";

export async function proxy(request: NextRequest) {
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const exempt = request.nextUrl.pathname.startsWith("/api/webhooks/") ||
    request.nextUrl.pathname === "/api/v1/notifications/dispatch" ||
    request.nextUrl.pathname === "/api/v1/admin/strikes/expire";
  if (request.nextUrl.pathname.startsWith("/api/") && unsafe && !exempt) {
    const rejection = enforceMutationRequest(request);
    if (rejection) return rejection;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.next();
  return updateSession(request);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
