import { describe, expect, it } from "vitest";
import { evidenceDecisionSchema } from "./moderation";

describe("moderation evidence decisions", () => {
  it("accepts a documented verification decision", () => {
    expect(
      evidenceDecisionSchema.safeParse({
        id: "e1074681-8aa3-4f90-bf32-87412ec72478",
        decision: "verified",
        notes: "Timestamp and source hash match the reported post.",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid evidence state changes", () => {
    expect(
      evidenceDecisionSchema.safeParse({
        id: "e1074681-8aa3-4f90-bf32-87412ec72478",
        decision: "deleted",
      }).success,
    ).toBe(false);
  });
});
