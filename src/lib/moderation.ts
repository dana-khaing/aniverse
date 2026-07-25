import { z } from "zod";
export const moderationActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("report"),
    id: z.string().uuid(),
    decision: z.enum(["actioned", "dismissed"]),
  }),
  z.object({
    type: z.literal("appeal"),
    id: z.string().uuid(),
    decision: z.enum(["closed", "dismissed"]),
  }),
  z.object({ type: z.literal("mature-content"), enabled: z.boolean() }),
]);

export const evidenceDecisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  notes: z.string().trim().max(2000).default(""),
});

export const enforcementActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("execute-takedown"),
    id: z.string().uuid(),
    notes: z.string().trim().min(10).max(2000),
  }),
  z.object({
    action: z.literal("resolve-appeal"),
    id: z.string().uuid(),
    decision: z.enum(["approved", "denied"]),
    notes: z.string().trim().min(10).max(2000),
  }),
]);
