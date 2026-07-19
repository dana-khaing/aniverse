import { describe, expect, it } from "vitest";
import { accountProfileSchema } from "./account-profile";

describe("account profile settings", () => {
  it("normalizes a valid profile", () => {
    const result = accountProfileSchema.parse({ displayName: " Dana ", username: "Dana_04", bio: "Animation fan", matureContentEnabled: false });
    expect(result).toMatchObject({ displayName: "Dana", username: "dana_04" });
  });

  it("rejects unsafe usernames", () => {
    expect(accountProfileSchema.safeParse({ displayName: "Dana", username: "dana khaing", bio: "", matureContentEnabled: true }).success).toBe(false);
  });
});
