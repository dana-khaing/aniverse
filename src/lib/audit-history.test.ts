import { describe, expect, it } from "vitest";
import { auditFilterSchema, auditSummary } from "./audit-history";

describe("audit history", () => {
  it("bounds staff timeline queries", () => {
    expect(auditFilterSchema.parse({ limit: "25" }).limit).toBe(25);
    expect(auditFilterSchema.safeParse({ limit: 500 }).success).toBe(false);
  });

  it("formats an immutable action summary", () => {
    expect(
      auditSummary({
        action: "creator_strike.expired",
        entity_type: "creator_strike",
        entity_id: "12345678-abcd",
      }),
    ).toBe("creator_strike expired · creator_strike 12345678");
  });
});
