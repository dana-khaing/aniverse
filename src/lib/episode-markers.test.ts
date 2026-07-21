import { describe, expect, it } from "vitest";
import { activeSkipMarker, demoEpisodeMarkers } from "./episode-markers";

describe("episode markers", () => {
  it("offers skipping only inside intro and outro ranges", () => {
    expect(activeSkipMarker(demoEpisodeMarkers, 30)?.kind).toBe("intro");
    expect(activeSkipMarker(demoEpisodeMarkers, 500)).toBeUndefined();
    expect(activeSkipMarker(demoEpisodeMarkers, 1390)?.kind).toBe("outro");
  });
});
