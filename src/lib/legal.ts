import { z } from "zod";

export const legalVersion = "2026-07-27";

export const consentSchema = z.object({
  type: z.enum(["terms", "privacy", "playback_analytics", "marketing"]),
  version: z.string().trim().min(1).max(40),
  granted: z.boolean(),
  source: z.enum(["account_settings", "version_gate"]).default("account_settings"),
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

export const dmcaAdminActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("review"),
    id: z.string().uuid(),
    decision: z.enum(["reviewing", "rejected"]),
    titleId: z.string().uuid().nullable().default(null),
    notes: z.string().trim().min(10).max(2000),
  }),
  z.object({
    action: z.literal("execute"),
    id: z.string().uuid(),
    notes: z.string().trim().min(10).max(2000),
  }),
  z.object({
    action: z.literal("counter"),
    id: z.string().uuid(),
    decision: z.enum(["reviewing", "accepted", "rejected"]),
    notes: z.string().trim().min(10).max(2000),
  }),
]);

export const dmcaCounterNoticeSchema = z.object({
  requestId: z.string().uuid(),
  contactEmail: z.email().max(320),
  statement: z.string().trim().min(30).max(5000),
  goodFaithConfirmed: z.literal(true),
  jurisdictionConfirmed: z.literal(true),
  signature: z.string().trim().min(2).max(120),
});
