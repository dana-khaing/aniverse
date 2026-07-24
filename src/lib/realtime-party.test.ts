import { describe, expect, it } from "vitest";
import {
  synchronizedPosition,
  type PartyPlaybackEvent,
} from "./realtime-party";

const event: PartyPlaybackEvent = {
  id: "sync-1",
  author: "Host",
  body: "play",
  type: "playback",
  action: "play",
  position: 120,
  playbackRate: 1.5,
  sentAt: 10_000,
  sequence: 1,
};

describe("party playback synchronization", () => {
  it("compensates for transit time while the host is playing", () => {
    expect(synchronizedPosition(event, 12_000)).toBe(123);
  });

  it("does not advance paused or seek events", () => {
    expect(synchronizedPosition({ ...event, action: "pause" }, 12_000)).toBe(
      120,
    );
    expect(synchronizedPosition({ ...event, action: "seek" }, 12_000)).toBe(
      120,
    );
  });
});
