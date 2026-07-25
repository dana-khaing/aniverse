import { describe, expect, it } from "vitest";
import { enforcementActionSchema } from "./moderation";

describe("moderation enforcement actions", () => {
  it("requires documented takedown execution", () => {
    expect(
      enforcementActionSchema.safeParse({
        action: "execute-takedown",
        id: "1190d604-bb2d-4888-9b63-c258bd51c777",
        notes: "Copyright ownership was independently confirmed.",
      }).success,
    ).toBe(true);
    expect(
      enforcementActionSchema.safeParse({
        action: "execute-takedown",
        id: "1190d604-bb2d-4888-9b63-c258bd51c777",
        notes: "remove",
      }).success,
    ).toBe(false);
  });
});
