import { describe, expect, it } from "vitest";
import { supportAdminSchema, supportTicketSchema } from "./support";

describe("support workflows", () => {
  it("requires an actionable first message", () => {
    expect(supportTicketSchema.safeParse({
      category: "playback",
      subject: "Video stops during playback",
      message: "The stream stops at 12:31 in Firefox after changing quality.",
    }).success).toBe(true);
    expect(supportTicketSchema.safeParse({
      category: "other",
      subject: "Help",
      message: "Short",
    }).success).toBe(false);
  });

  it("validates staff incident transitions", () => {
    expect(supportAdminSchema.safeParse({
      action: "incident",
      title: "Playback delivery degraded",
      body: "Some viewers may see longer startup times while we investigate.",
      severity: "minor",
      status: "investigating",
      affectedServices: ["Playback"],
      published: true,
    }).success).toBe(true);
  });
});
