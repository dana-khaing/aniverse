import { z } from "zod";

export const audioTrackSchema = z.object({
  episodeId: z.string().uuid(),
  languageCode: z
    .string()
    .regex(/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2}|-[0-9]{3})?$/),
  label: z.string().trim().min(1).max(80),
  sourceUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://")),
  isDefault: z.boolean().default(false),
});

export type AudioTrackInput = z.infer<typeof audioTrackSchema>;
