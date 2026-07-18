import { describe, expect, it } from "vitest";
import { creatorStudioActionSchema, studioSlug, studioStatus } from "@/lib/creator-studio";

describe("creator studio helpers", () => {
  it("validates publishing actions", () => {
    expect(creatorStudioActionSchema.safeParse({ type: "create-title", name: "Moon Garden" }).success).toBe(true);
    expect(creatorStudioActionSchema.safeParse({ type: "add-episode", titleId: "not-an-id" }).success).toBe(false);
    expect(creatorStudioActionSchema.safeParse({ type: "add-member", email: "editor@example.com", role: "editor" }).success).toBe(true);
  });

  it("creates stable database-safe title values", () => {
    expect(studioSlug("Moon Garden!", "12345678-aaaa-bbbb-cccc-123456789012")).toBe("moon-garden-12345678");
    expect(studioStatus("scheduled")).toBe("Scheduled");
  });
});
