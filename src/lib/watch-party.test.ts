import { describe, expect, it } from "vitest";
import {
  canControlParty,
  canManageParty,
  partyActionSchema,
} from "./watch-party";

describe("watch party permissions", () => {
  it("allows hosts and moderators to manage a live room", () => {
    expect(canManageParty("host")).toBe(true);
    expect(canControlParty("moderator")).toBe(true);
    expect(canManageParty("viewer")).toBe(false);
  });

  it("validates invitation and participant actions", () => {
    expect(
      partyActionSchema.safeParse({
        action: "invite",
        email: "friend@example.com",
        role: "viewer",
      }).success,
    ).toBe(true);
    expect(
      partyActionSchema.safeParse({
        action: "member-role",
        userId: "not-an-id",
        role: "host",
      }).success,
    ).toBe(false);
  });

  it("validates authoritative playback sequence input", () => {
    expect(partyActionSchema.safeParse({ action: "playback", operationId: crypto.randomUUID(), expectedSequence: 4, command: "seek", position: 120, playbackRate: 1 }).success).toBe(true);
    expect(partyActionSchema.safeParse({ action: "playback", operationId: crypto.randomUUID(), expectedSequence: -1, command: "play", position: 0, playbackRate: 1 }).success).toBe(false);
  });
});
