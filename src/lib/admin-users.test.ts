import { describe, expect, it } from "vitest";
import {
  accessActionLabel,
  userAccessActionSchema,
  userSearchSchema,
} from "@/lib/admin-users";

const userId = "3f8ef3db-6b37-43ca-bd55-67e6a84a0129";

describe("administrator user controls", () => {
  it("accepts an intentional role grant", () => {
    expect(
      userAccessActionSchema.safeParse({
        userId,
        action: "grant_role",
        role: "moderator",
        reason: "Approved for the community safety rotation.",
      }).success,
    ).toBe(true);
  });

  it("protects the baseline role and requires a reason", () => {
    expect(
      userAccessActionSchema.safeParse({
        userId,
        action: "revoke_role",
        role: "viewer",
        reason: "Routine change requested by administrator.",
      }).success,
    ).toBe(false);
    expect(
      userAccessActionSchema.safeParse({
        userId,
        action: "suspend",
        reason: "Too short",
      }).success,
    ).toBe(false);
  });

  it("validates bounded search pagination", () => {
    expect(
      userSearchSchema.parse({ query: "  dana ", cursor: "2", limit: "25" }),
    ).toEqual({ query: "dana", cursor: 2, limit: 25 });
    expect(userSearchSchema.safeParse({ limit: 500 }).success).toBe(false);
  });

  it("provides a readable audit label", () => {
    expect(accessActionLabel("restore")).toBe("Account restored");
  });
});
