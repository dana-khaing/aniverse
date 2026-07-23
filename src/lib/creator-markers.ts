import { z } from "zod";

export const markerKindSchema = z.enum(["chapter", "intro", "outro"]);

export const episodeMarkerInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    label: z.string().trim().min(1).max(80),
    startSeconds: z.number().int().min(0).max(86_400),
    endSeconds: z.number().int().min(1).max(86_400).nullable().optional(),
    kind: markerKindSchema,
  })
  .refine(
    (marker) =>
      marker.endSeconds == null || marker.endSeconds > marker.startSeconds,
    {
      message: "End time must be after the start time",
      path: ["endSeconds"],
    },
  );

export const episodeMarkerCollectionSchema = z.object({
  episodeId: z.string().uuid(),
  markers: z.array(episodeMarkerInputSchema).max(100),
});

export type EpisodeMarkerInput = z.infer<typeof episodeMarkerInputSchema>;

export function normalizeEpisodeMarkers(markers: EpisodeMarkerInput[]) {
  return [...markers]
    .sort(
      (left, right) =>
        left.startSeconds - right.startSeconds ||
        left.label.localeCompare(right.label),
    )
    .map((marker, position) => ({ ...marker, position }));
}

export function markerCollectionError(markers: EpisodeMarkerInput[]) {
  const segments = normalizeEpisodeMarkers(markers).filter(
    (marker) => marker.kind !== "chapter",
  );
  for (const kind of ["intro", "outro"] as const) {
    if (segments.filter((marker) => marker.kind === kind).length > 1)
      return `Only one ${kind} segment is allowed per episode`;
  }
  for (let index = 1; index < segments.length; index += 1) {
    const previous = segments[index - 1];
    const current = segments[index];
    if (
      previous.endSeconds != null &&
      previous.endSeconds > current.startSeconds
    )
      return "Intro and outro segments cannot overlap";
  }
  return null;
}
