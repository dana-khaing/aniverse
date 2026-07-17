import { z } from "zod";

export const releaseSchema = z.object({
  title: z.string().trim().min(2).max(160),
  kind: z.enum(["Episode", "Premiere", "Trailer", "Announcement"]),
  scheduledAt: z.string().datetime(),
});

export type CloudCreatorRelease = { id: string; title: string; kind: "Episode" | "Premiere" | "Trailer" | "Announcement"; scheduledAt: string; status: "Draft" | "Scheduled" | "Live" | "Published" | "Cancelled" };

export function releaseLabel(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`;
}
