import { describe, expect, it } from "vitest";
import { releaseLabel, releaseSchema } from "@/lib/creator-releases";

describe("creator releases", () => {
  it("requires a complete scheduled release", () => {
    expect(releaseSchema.safeParse({ title: "Finale", kind: "Premiere", scheduledAt: "2026-07-18T18:30:00.000Z" }).success).toBe(true);
    expect(releaseSchema.safeParse({ title: "", kind: "Stream", scheduledAt: "later" }).success).toBe(false);
  });
  it("formats database labels", () => expect(releaseLabel("ANNOUNCEMENT")).toBe("Announcement"));
});
