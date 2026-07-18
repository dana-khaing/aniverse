import { z } from "zod";

export const creatorStudioActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create-title"), name: z.string().trim().min(2).max(120) }),
  z.object({ type: z.literal("add-episode"), titleId: z.string().uuid() }),
  z.object({ type: z.literal("add-member"), email: z.string().trim().email().max(254), role: z.enum(["editor", "uploader", "analyst"]) }),
]);

export type CreatorStudioTitle = {
  id: string;
  name: string;
  status: "Draft" | "Review" | "Scheduled" | "Published" | "Unpublished" | "Removed";
  episodes: number;
};

export type CreatorStudioWorkspace = {
  team: { id: string; name: string; role: string; members: Array<{ name: string; role: string }> };
  titles: CreatorStudioTitle[];
};

export function studioSlug(name: string, id: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "untitled";
  return `${base}-${id.replaceAll("-", "").slice(0, 8)}`;
}

export function studioStatus(status: string): CreatorStudioTitle["status"] {
  return `${status.slice(0, 1).toUpperCase()}${status.slice(1)}` as CreatorStudioTitle["status"];
}
