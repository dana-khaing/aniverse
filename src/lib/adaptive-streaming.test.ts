import { describe, expect, it } from "vitest";
import { formatPlaybackTime, qualityOptions } from "./adaptive-streaming";

describe("adaptive streaming helpers", () => {
  it("builds unique descending quality choices", () => {
    expect(qualityOptions([{ height: 720 }, { height: 1080 }, { height: 720 }, { height: 480 }])).toEqual([
      { label: "1080p", level: 1 },
      { label: "720p", level: 0 },
      { label: "480p", level: 3 },
    ]);
  });

  it("formats playback durations safely", () => {
    expect(formatPlaybackTime(65.8)).toBe("1:05");
    expect(formatPlaybackTime(Number.NaN)).toBe("0:00");
  });
});
