import { describe, expect, it } from "vitest";
import {
  consentSchema,
  dmcaAdminActionSchema,
  dmcaCounterNoticeSchema,
  dmcaRequestSchema,
  legalVersion,
} from "./legal";

describe("legal and consent workflows", () => {
  it("versions append-only consent choices", () => {
    expect(
      consentSchema.safeParse({
        type: "privacy",
        version: legalVersion,
        granted: true,
      }).success,
    ).toBe(true);
  });

  it("validates administrator and creator DMCA actions", () => {
    const id = "24fd8712-e874-4fde-820b-9c9dff9ce6f1";
    expect(
      dmcaAdminActionSchema.safeParse({
        action: "execute",
        id,
        notes: "Matched the notice to the published title.",
      }).success,
    ).toBe(true);
    expect(
      dmcaCounterNoticeSchema.safeParse({
        requestId: id,
        contactEmail: "creator@example.com",
        statement:
          "I have a good-faith belief that this material was removed as a result of mistake.",
        goodFaithConfirmed: true,
        jurisdictionConfirmed: true,
        signature: "Creator Name",
      }).success,
    ).toBe(true);
  });

  it("requires complete DMCA declarations and an HTTP material URL", () => {
    const request = {
      claimantName: "Rights Owner",
      claimantEmail: "rights@example.com",
      organization: "",
      workDescription:
        "Original animated work and the specific protected sequence involved.",
      materialUrls: ["https://aniverse.example/anime/example"],
      goodFaithConfirmed: true,
      accuracyConfirmed: true,
      signature: "Rights Owner",
    } as const;
    expect(dmcaRequestSchema.safeParse(request).success).toBe(true);
    expect(
      dmcaRequestSchema.safeParse({
        ...request,
        goodFaithConfirmed: false,
      }).success,
    ).toBe(false);
  });
});
