import { describe, expect, it } from "vitest";
import {
  artworkFileError,
  safeArtworkFilename,
  trailerReferenceSchema,
} from "./creator-title-assets";

describe("creator title assets", () => {
  it("accepts safe artwork and normalizes its filename", () => {
    const artwork = new File(["image"], "Moon Garden (Key Art).PNG", {
      type: "image/png",
    });
    expect(artworkFileError(artwork)).toBeNull();
    expect(safeArtworkFilename(artwork.name)).toBe(
      "moon-garden-key-art.png",
    );
  });

  it("rejects unsupported artwork and insecure trailers", () => {
    expect(
      artworkFileError(
        new File(["svg"], "poster.svg", { type: "image/svg+xml" }),
      ),
    ).toContain("JPEG");
    expect(() =>
      trailerReferenceSchema.parse({
        titleId: "987f6543-e21b-43d2-a456-426614174000",
        kind: "trailer",
        sourceUrl: "http://media.example/trailer.mp4",
      }),
    ).toThrow();
  });
});
