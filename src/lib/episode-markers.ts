export type EpisodeMarker = { id: string; label: string; start: number; end?: number; kind: "chapter" | "intro" | "outro" };

export const demoEpisodeMarkers: EpisodeMarker[] = [
  { id: "opening", label: "Opening", start: 0, end: 90, kind: "intro" },
  { id: "chapter-1", label: "Chapter 1", start: 90, kind: "chapter" },
  { id: "chapter-2", label: "Chapter 2", start: 690, kind: "chapter" },
  { id: "ending", label: "Ending", start: 1350, end: 1440, kind: "outro" },
];

export function activeSkipMarker(markers: EpisodeMarker[], position: number) {
  return markers.find((marker) => (marker.kind === "intro" || marker.kind === "outro") && marker.end !== undefined && position >= marker.start && position < marker.end);
}
