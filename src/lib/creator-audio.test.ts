import { describe, expect, it } from "vitest";
import { audioTrackSchema } from "./creator-audio";

describe("creator audio metadata", () => {
  it("accepts secure BCP-47 audio sources", () => {
    expect(
      audioTrackSchema.safeParse({
        episodeId: "9bfe485e-7531-4d6a-a8a6-7cc45feeb936",
        languageCode: "zh-Hant-TW",
        label: "Traditional Chinese",
        sourceUrl: "https://media.example/audio.m4a",
        isDefault: false,
      }).success,
    ).toBe(true);
  });

  it("rejects insecure provider inputs", () => {
    expect(
      audioTrackSchema.safeParse({
        episodeId: "9bfe485e-7531-4d6a-a8a6-7cc45feeb936",
        languageCode: "en",
        label: "English",
        sourceUrl: "http://media.example/audio.mp3",
      }).success,
    ).toBe(false);
  });
});
