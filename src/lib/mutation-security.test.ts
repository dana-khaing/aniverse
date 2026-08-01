import { describe, expect, it } from "vitest";
import { z } from "zod";
import { enforceMutationRequest, readJsonBody } from "./mutation-security";

describe("mutation request enforcement", () => {
  it("rejects cross-site and unsupported browser mutations", () => {
    expect(enforceMutationRequest(new Request("https://aniverse.test/api", { method: "POST", headers: { origin: "https://evil.test", "content-type": "application/json" } }))?.status).toBe(403);
    expect(enforceMutationRequest(new Request("https://aniverse.test/api", { method: "POST", headers: { "content-type": "text/plain" } }))?.status).toBe(415);
  });
  it("bounds decoded JSON bodies", async () => {
    const result = await readJsonBody(new Request("https://aniverse.test/api", { method: "POST", body: JSON.stringify({ value: "abcd" }) }), z.object({ value: z.string() }), 4);
    if (!("response" in result) || !result.response) throw new Error("Expected rejection");
    expect(result.response.status).toBe(413);
  });
});
