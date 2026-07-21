import { describe, expect, it } from "vitest";
import { isWebVtt, safeSubtitleFilename, subtitleMetadataSchema } from "./creator-subtitles";

describe("creator subtitle validation", () => {
  it("accepts constrained WebVTT metadata", () => {
    expect(subtitleMetadataSchema.parse({ episodeId: "987f6543-e21b-43d2-a456-426614174000", language: "en-GB", label: "English", isDefault: "true" }).isDefault).toBe(true);
    expect(isWebVtt(new File(["WEBVTT\n"], "episode.vtt", { type: "text/vtt" }))).toBe(true);
  });

  it("rejects unsupported files and sanitizes names", () => {
    expect(isWebVtt(new File(["1"], "episode.srt"))).toBe(false);
    expect(safeSubtitleFilename("Episode 01 (English).vtt")).toBe("episode-01-english");
  });
});
