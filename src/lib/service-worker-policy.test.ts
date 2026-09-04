import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

describe("service worker navigation policy", () => {
  it("uses a dedicated offline document instead of the homepage", () => {
    expect(worker).toContain('const OFFLINE_URL = "/offline"');
    expect(worker).toContain("caches.match(OFFLINE_URL)");
    expect(worker).not.toContain('caches.match("/")');
  });

  it("does not cache API or authentication traffic", () => {
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain('url.pathname.startsWith("/auth/")');
  });
});
