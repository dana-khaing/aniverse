import { z } from "zod";
import { getStripe, stripeReturnUrl } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security";

const requestSchema = z.object({ creatorTeamId: z.string().uuid() });
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted onboarding origin" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (!consumeRateLimit(`connect:${ip}`, 5, 1 / 60))
    return Response.json({ error: "Too many onboarding attempts" }, { status: 429 });
  if (!process.env.STRIPE_SECRET_KEY)
    return Response.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Invalid creator team" }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  const { data: team } = await supabase
    .from("creator_teams")
    .select("id,name,stripe_account_id,created_by")
    .eq("id", parsed.data.creatorTeamId)
    .eq("created_by", user.id)
    .maybeSingle();
  if (!team)
    return Response.json(
      { error: "Team owner access required" },
      { status: 403 },
    );
  const stripe = getStripe();
  let accountId = team.stripe_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: { transfers: { requested: true } },
      business_profile: {
        product_description: `Animation creator tips for ${team.name}`,
      },
      metadata: { creator_team_id: team.id },
    });
    accountId = account.id;
    const { error } = await supabase
      .from("creator_teams")
      .update({ stripe_account_id: accountId })
      .eq("id", team.id)
      .eq("created_by", user.id);
    if (error)
      return Response.json(
        { error: "Could not save connected account" },
        { status: 500 },
      );
  }
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: stripeReturnUrl(`/creator?connect=refresh&team=${team.id}`),
    return_url: stripeReturnUrl(`/creator?connect=complete&team=${team.id}`),
    type: "account_onboarding",
    collection_options: {
      fields: "eventually_due",
      future_requirements: "include",
    },
  });
  return Response.json(
    { url: link.url },
    { headers: { "cache-control": "private, no-store" } },
  );
}
