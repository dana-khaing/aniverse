import { afterEach, describe, expect, it } from "vitest";
import { stripeReturnUrl, tipCheckoutSchema } from "./stripe";

describe("Stripe tipping configuration", () => {
  afterEach(()=>delete process.env.NEXT_PUBLIC_SITE_URL);
  it("enforces supported currencies and safe tip limits",()=>{expect(tipCheckoutSchema.safeParse({creatorTeamId:"10000000-0000-4000-8000-000000000001",amountMinor:500,currency:"gbp"}).success).toBe(true);expect(tipCheckoutSchema.safeParse({creatorTeamId:"10000000-0000-4000-8000-000000000001",amountMinor:99,currency:"usd"}).success).toBe(false);expect(tipCheckoutSchema.safeParse({creatorTeamId:"10000000-0000-4000-8000-000000000001",amountMinor:500,currency:"jpy"}).success).toBe(false)});
  it("builds trusted return URLs from server configuration",()=>{process.env.NEXT_PUBLIC_SITE_URL="https://aniverse.example";expect(stripeReturnUrl("/support/success")).toBe("https://aniverse.example/support/success")});
});
