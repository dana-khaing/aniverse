import { z } from "zod";

export const partyActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("invite"),
    email: z.string().trim().email(),
    role: z.enum(["moderator", "viewer"]).default("viewer"),
  }),
  z.object({
    action: z.literal("lifecycle"),
    status: z.enum(["scheduled", "live", "ended"]),
  }),
  z.object({
    action: z.literal("member-role"),
    userId: z.string().uuid(),
    role: z.enum(["moderator", "viewer"]),
  }),
  z.object({
    action: z.literal("remove-member"),
    userId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("presence"),
    state: z.enum(["online", "away", "offline"]),
    reconnected: z.boolean().default(false),
  }),
]);

export function canManageParty(role: string | null | undefined) {
  return role === "host" || role === "moderator";
}

export function canControlParty(role: string | null | undefined) {
  return role === "host" || role === "moderator";
}
