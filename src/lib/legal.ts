import { z } from "zod";

export const legalVersion = "2026-07-27";

export const consentSchema = z.object({
  type: z.enum(["terms", "privacy", "playback_analytics", "marketing"]),
  version: z.string().trim().min(1).max(40),
  granted: z.boolean(),
});

export const dmcaRequestSchema = z.object({
  claimantName: z.string().trim().min(2).max(120),
  claimantEmail: z.email().max(320),
  organization: z.string().trim().max(160).default(""),
  workDescription: z.string().trim().min(30).max(5000),
  materialUrls: z
    .array(z.url().refine((url) => /^https?:\/\//.test(url)))
    .min(1)
    .max(20),
  goodFaithConfirmed: z.literal(true),
  accuracyConfirmed: z.literal(true),
  signature: z.string().trim().min(2).max(120),
});
