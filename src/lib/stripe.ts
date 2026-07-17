import Stripe from "stripe";
import { z } from "zod";

let client: Stripe | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  client ??= new Stripe(key, { typescript: true, appInfo: { name: "AniVerse", version: "0.1.0" } });
  return client;
}

export const tipCheckoutSchema = z.object({
  creatorTeamId: z.string().uuid(),
  titleId: z.string().uuid().optional(),
  amountMinor: z.number().int().min(100).max(100_000),
  currency: z.enum(["usd", "gbp", "eur"]).default("usd"),
  supporterName: z.string().trim().min(1).max(60).optional(),
  message: z.string().trim().max(280).optional(),
  isPublic: z.boolean().default(true),
});

export function stripeReturnUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
