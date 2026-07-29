import { z } from "zod";

export const supportTicketSchema = z.object({
  category: z.enum(["account", "playback", "creator", "billing", "safety", "other"]),
  subject: z.string().trim().min(5).max(160),
  message: z.string().trim().min(10).max(5000),
});

export const supportReplySchema = z.object({
  ticketId: z.uuid(),
  message: z.string().trim().min(1).max(5000),
});

export const supportAdminSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reply"),
    ticketId: z.uuid(),
    message: z.string().trim().min(1).max(5000),
    internal: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("status"),
    ticketId: z.uuid(),
    status: z.enum(["open", "in_progress", "waiting_on_user", "resolved", "closed"]),
    priority: z.enum(["low", "normal", "high", "urgent"]),
  }),
  z.object({
    action: z.literal("incident"),
    incidentId: z.uuid().optional(),
    title: z.string().trim().min(5).max(160),
    body: z.string().trim().min(10).max(5000),
    severity: z.enum(["maintenance", "minor", "major", "critical"]),
    status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
    affectedServices: z.array(z.string().trim().min(1).max(80)).max(12),
    published: z.boolean(),
  }),
]);
