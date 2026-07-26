import { describe, expect, it } from "vitest";
import { creatorReleaseReadiness } from "@/lib/creator-readiness";

const ids = {
  title: "b7c096d8-28dd-46b7-84fb-13ea8483b80b",
  episode: "218d82f6-7fe3-4691-8c64-dbb69afc1709",
};

describe("creator release readiness", () => {
  it("allows review only when every media requirement is complete", () => {
    const result = creatorReleaseReadiness({
      titleId: ids.title,
      titleName: "Echoes of Asteria",
      status: "draft",
      episodeIds: [ids.episode],
      assetKinds: ["poster", "backdrop", "trailer"],
      translationLocales: ["en", "ja"],
      readyVideoEpisodeIds: [ids.episode],
      readyAudioEpisodeIds: [ids.episode],
    });
    expect(result.percent).toBe(100);
    expect(result.canSubmit).toBe(true);
  });

  it("identifies the exact controls still blocking submission", () => {
    const result = creatorReleaseReadiness({
      titleId: ids.title,
      titleName: "Echoes of Asteria",
      status: "draft",
      episodeIds: [ids.episode],
      assetKinds: ["poster"],
      translationLocales: ["en"],
      readyVideoEpisodeIds: [],
      readyAudioEpisodeIds: [],
    });
    expect(result.canSubmit).toBe(false);
    expect(
      result.checks
        .filter((check) => !check.complete)
        .map((check) => check.key),
    ).toEqual(["artwork", "trailer", "translations", "video", "audio"]);
  });
});
