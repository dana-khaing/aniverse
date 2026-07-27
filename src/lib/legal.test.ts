import { describe, expect, it } from "vitest";
import { consentSchema, dmcaRequestSchema, legalVersion } from "./legal";

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
