import { describe, expect, it } from "vitest";
import {
  episodeMarkerCollectionSchema,
  markerCollectionError,
  normalizeEpisodeMarkers,
} from "./creator-markers";

const episodeId = "987f6543-e21b-43d2-a456-426614174000";

describe("creator episode marker validation", () => {
  it("validates, sorts, and positions episode markers", () => {
    const parsed = episodeMarkerCollectionSchema.parse({
      episodeId,
      markers: [
        {
          label: "Ending",
          startSeconds: 1320,
          endSeconds: 1380,
          kind: "outro",
        },
        {
          label: "Opening",
          startSeconds: 15,
          endSeconds: 90,
          kind: "intro",
        },
      ],
    });

    expect(normalizeEpisodeMarkers(parsed.markers)).toEqual([
      expect.objectContaining({ label: "Opening", position: 0 }),
      expect.objectContaining({ label: "Ending", position: 1 }),
    ]);
    expect(markerCollectionError(parsed.markers)).toBeNull();
  });

  it("rejects invalid ranges and overlapping skip segments", () => {
    expect(() =>
      episodeMarkerCollectionSchema.parse({
        episodeId,
        markers: [
          {
            label: "Opening",
            startSeconds: 90,
            endSeconds: 30,
            kind: "intro",
          },
        ],
      }),
    ).toThrow();

    expect(
      markerCollectionError([
        {
          label: "Opening",
          startSeconds: 0,
          endSeconds: 90,
          kind: "intro",
        },
        {
          label: "Credits",
          startSeconds: 80,
          endSeconds: 120,
          kind: "outro",
        },
      ]),
    ).toBe("Intro and outro segments cannot overlap");
  });
});
