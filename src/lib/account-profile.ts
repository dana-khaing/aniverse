import { z } from "zod";

export const accountProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),
  bio: z.string().trim().max(500),
  matureContentEnabled: z.boolean(),
});

export type AccountProfile = z.infer<typeof accountProfileSchema>;
