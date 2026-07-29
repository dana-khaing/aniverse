import { describe, expect, it } from "vitest";
import {
  maxNotificationAttempts,
  notificationReplaySchema,
  notificationRetryDelay,
} from "./notification-operations";

describe("notification operations", () => {
  it("backs off exponentially and caps retries at one day", () => {
    expect(notificationRetryDelay(1)).toBe(300_000);
    expect(notificationRetryDelay(3)).toBe(1_200_000);
    expect(notificationRetryDelay(maxNotificationAttempts)).toBe(86_400_000);
  });

  it("accepts only a valid replay operation", () => {
    expect(
      notificationReplaySchema.safeParse({
        action: "replay",
        id: "24fd8712-e874-4fde-820b-9c9dff9ce6f1",
      }).success,
    ).toBe(true);
  });
});
