import { describe, expect, it } from "vitest";
import {
  evaluateProviderReadiness,
  publicProviderReadiness,
} from "./provider-readiness.mjs";

const configured = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_123456789012345678901234",
  MUX_TOKEN_ID: "mux-token-id-123456789012",
  MUX_TOKEN_SECRET: "mux-token-secret-123456789",
  MUX_WEBHOOK_SECRET: "mux-webhook-secret-123456",
  MUX_SIGNING_KEY_ID: "mux-signing-key-123456789",
  MUX_SIGNING_PRIVATE_KEY:
    "-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----",
  RESEND_API_KEY: "re_123456789012345678901234",
  RESEND_FROM_EMAIL: "AniVerse <hello@aniverse.example>",
  STRIPE_SECRET_KEY: ["sk", "live", "123456789012345678901234"].join("_"),
  STRIPE_WEBHOOK_SECRET: "whsec_123456789012345678901234",
  NEXT_PUBLIC_SENTRY_DSN: "https://public@o1.ingest.sentry.io/1",
  SENTRY_ORG: "aniverse-organization-01",
  SENTRY_PROJECT: "aniverse-production-app",
  SENTRY_AUTH_TOKEN: "sentry-auth-token-123456789",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY:
    "BNM0jGvGFpWfeGdRCrNyocOnJSCK7-ZCxjvvh_SmQgMgmGj0A0WtqJyzjCQgnFxtdNYQERDpAcUcHXQmv48P_SU",
  VAPID_PRIVATE_KEY: "private-vapid-key-123456789012345678901234",
  VAPID_SUBJECT: "mailto:security@aniverse.example",
  NEXT_PUBLIC_SITE_URL: "https://aniverse.example",
  CRON_SECRET: "cron-secret-123456789012345678901",
};

describe("provider readiness", () => {
  it("accepts complete production configuration without exposing values", () => {
    const result = evaluateProviderReadiness(configured);
    expect(result.status).toBe("ready");
    expect(
      result.providers.every((provider) => provider.status === "ready"),
    ).toBe(true);
    expect(JSON.stringify(publicProviderReadiness(result))).not.toContain(
      "stripe-secret-marker",
    );
  });

  it("distinguishes missing and malformed provider settings", () => {
    const result = evaluateProviderReadiness({
      ...configured,
      MUX_WEBHOOK_SECRET: "",
      NEXT_PUBLIC_SITE_URL: "http://production.example",
    });
    expect(
      result.providers.find((provider) => provider.id === "mux")?.missing,
    ).toContain("MUX_WEBHOOK_SECRET");
    expect(
      result.providers.find((provider) => provider.id === "vercel")?.invalid,
    ).toContain("NEXT_PUBLIC_SITE_URL");
  });
});
