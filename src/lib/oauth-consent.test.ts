import { describe, expect, it } from "vitest";
import {
  signOAuthConsentIntent,
  verifyOAuthConsentIntent,
} from "./oauth-consent";

describe("OAuth consent intent", () => {
  it("accepts a current signed intent", () => {
    const intent = signOAuthConsentIntent("test-secret", "2026-07-27", 1_000);
    expect(verifyOAuthConsentIntent(intent, "test-secret", 2_000)?.version).toBe(
      "2026-07-27",
    );
  });

  it("rejects tampering and expiry", () => {
    const intent = signOAuthConsentIntent("test-secret", "2026-07-27", 1_000);
    expect(verifyOAuthConsentIntent(`${intent}x`, "test-secret", 2_000)).toBeNull();
    expect(verifyOAuthConsentIntent(intent, "test-secret", 700_001)).toBeNull();
  });
});
