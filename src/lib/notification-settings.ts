import { z } from "zod";

export const notificationSettingsSchema = z.object({
  releaseEmail: z.boolean(),
  communityEmail: z.boolean(),
  creatorEmail: z.boolean(),
  inAppEnabled: z.boolean(),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
