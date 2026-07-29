import { z } from "zod";

export const maxNotificationAttempts = 10;
export function notificationRetryDelay(attempt: number) {
  return Math.min(24 * 60 * 60_000, 5 * 60_000 * 2 ** Math.max(0, attempt - 1));
}

export const notificationReplaySchema = z.object({
  action: z.literal("replay"),
  id: z.string().uuid(),
});
