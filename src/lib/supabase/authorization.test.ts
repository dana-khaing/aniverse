import { describe, expect, it } from "vitest";
import {
  includesRequiredRole,
  rejectCrossOriginMutation,
} from "./authorization";

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

  it("rejects cross-origin staff mutations before authorization", async () => {
    const rejected = rejectCrossOriginMutation(
      new Request("https://aniverse.example/api/v1/admin/users", {
        method: "PATCH",
        headers: { origin: "https://attacker.example" },
      }),
    );
    expect(rejected?.status).toBe(403);
    expect(rejectCrossOriginMutation(
      new Request("https://aniverse.example/api/v1/admin/users", {
        method: "PATCH",
        headers: { origin: "https://aniverse.example" },
      }),
    )).toBeNull();
  });
});
