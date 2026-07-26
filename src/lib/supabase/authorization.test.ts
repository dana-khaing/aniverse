import { describe, expect, it } from "vitest";
import { includesRequiredRole } from "./authorization";

describe("trusted role authorization", () => {
  it("accepts a role loaded from the role table", () => {
    expect(includesRequiredRole(["viewer", "admin"], ["admin"])).toBe(true);
    expect(
      includesRequiredRole(["viewer", "moderator"], ["moderator", "admin"]),
    ).toBe(true);
  });

  it("rejects absent, unrelated, and metadata-shaped roles", () => {
    expect(includesRequiredRole([], ["admin"])).toBe(false);
    expect(includesRequiredRole(["creator"], ["moderator", "admin"])).toBe(
      false,
    );
    expect(includesRequiredRole(["{\"role\":\"admin\"}"], ["admin"])).toBe(
      false,
    );
  });
});
