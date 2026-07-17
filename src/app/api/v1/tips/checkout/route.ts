import { randomUUID } from "node:crypto";
import { getStripe, stripeReturnUrl, tipCheckoutSchema } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted checkout origin" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (!consumeRateLimit(`tip:${ip}`, 5, 1 / 60))
    return Response.json({ error: "Too many checkout attempts" }, { status: 429 });
  if (!process.env.STRIPE_SECRET_KEY)
    return Response.json(
      { error: "Creator tips are not configured" },
      { status: 503 },
    );
  const parsed = tipCheckoutSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Invalid tip", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  const admin = getAdminClient();
  const { data: team } = await admin
    .from("creator_teams")
    .select(
      "id,name,stripe_account_id,stripe_charges_enabled,stripe_payouts_enabled",
    )
    .eq("id", parsed.data.creatorTeamId)
    .maybeSingle();
  if (
    !team?.stripe_account_id ||
    !team.stripe_charges_enabled ||
    !team.stripe_payouts_enabled
  )
    return Response.json(
      { error: "This creator cannot receive tips yet" },
      { status: 409 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tipId = randomUUID();
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: parsed.data.currency,
          unit_amount: parsed.data.amountMinor,
          product_data: {
            name: `Tip ${team.name}`,
            description:
              "A voluntary one-time creator tip. AniVerse platform fee: 0%.",
          },
        },
      },
    ],
    payment_intent_data: {
      on_behalf_of: team.stripe_account_id,
      transfer_data: { destination: team.stripe_account_id },
      metadata: {
        tip_id: tipId,
        creator_team_id: team.id,
        platform_fee_minor: "0",
      },
    },
    metadata: { tip_id: tipId, creator_team_id: team.id },
    success_url: stripeReturnUrl(
      `/support/success?tip=${tipId}&session_id={CHECKOUT_SESSION_ID}`,
    ),
    cancel_url: stripeReturnUrl(`/support/cancelled?team=${team.id}`),
  });
  const { error } = await admin
    .from("creator_tips")
    .insert({
      id: tipId,
      supporter_user_id: user?.id,
      creator_team_id: team.id,
      title_id: parsed.data.titleId,
      amount_minor: parsed.data.amountMinor,
      currency: parsed.data.currency,
      platform_fee_minor: 0,
      stripe_checkout_session_id: session.id,
      status: "checkout",
      supporter_name: parsed.data.supporterName,
      message: parsed.data.message,
      is_public: parsed.data.isPublic,
    });
  if (error) {
    await stripe.checkout.sessions.expire(session.id);
    return Response.json({ error: "Could not reserve tip" }, { status: 500 });
  }
  return Response.json(
    { url: session.url, id: tipId },
    { status: 201, headers: { "cache-control": "private, no-store" } },
  );
}
