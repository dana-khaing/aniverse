import { describe, expect, it } from "vitest";
import {
  parseSingleByteRange,
  privatePlaybackHeaders,
  publicCatalogHeaders,
} from "./delivery-policy";

describe("CDN and media delivery policy", () => {
  it("shares only public discovery responses", () => {
    expect(publicCatalogHeaders["cache-control"]).toContain("s-maxage=60");
    expect(privatePlaybackHeaders["cache-control"]).toBe("private, no-store");
    expect(privatePlaybackHeaders.vary).toContain("authorization");
  });

  it("parses bounded, open, and suffix byte ranges", () => {
    expect(parseSingleByteRange("bytes=0-99", 1_000)).toEqual({
      start: 0,
      end: 99,
      length: 100,
    });
    expect(parseSingleByteRange("bytes=900-", 1_000)?.length).toBe(100);
    expect(parseSingleByteRange("bytes=-50", 1_000)?.start).toBe(950);
  });

  it("rejects malformed and unsatisfiable ranges", () => {
    expect(parseSingleByteRange("bytes=1000-", 1_000)).toBeNull();
    expect(parseSingleByteRange("bytes=20-10", 1_000)).toBeNull();
    expect(parseSingleByteRange("items=0-10", 1_000)).toBeNull();
  });
});
