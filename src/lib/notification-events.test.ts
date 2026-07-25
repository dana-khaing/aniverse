import { describe, expect, it } from "vitest";
import { deliveryChannels, notificationEmailHtml } from "./notification-events";

describe("notification delivery policy", () => {
  it("honors category-specific email and global push preferences", () => {
    const preferences = {
      release_email: false,
      community_email: true,
      creator_email: false,
      push_enabled: true,
    };
    expect(deliveryChannels("release", preferences)).toEqual({
      email: false,
      push: true,
    });
    expect(deliveryChannels("moderation", preferences)).toEqual({
      email: true,
      push: true,
    });
  });

  it("escapes user-controlled notification content", () => {
    const html = notificationEmailHtml({
      title: "<New release>",
      body: "Watch & enjoy",
      href: "/watch/show/1",
      origin: "https://aniverse.example",
    });
    expect(html).toContain("&lt;New release&gt;");
    expect(html).toContain("Watch &amp; enjoy");
    expect(html).toContain("https://aniverse.example/watch/show/1");
  });
});
