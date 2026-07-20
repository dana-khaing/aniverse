import { describe, expect, it } from "vitest";
import { notificationSettingsSchema } from "./notification-settings";

describe("notification settings", () => {
  it("requires explicit boolean channels", () => {
    expect(notificationSettingsSchema.safeParse({ releaseEmail: true, communityEmail: false, creatorEmail: true, inAppEnabled: true }).success).toBe(true);
    expect(notificationSettingsSchema.safeParse({ releaseEmail: "yes" }).success).toBe(false);
  });
});
