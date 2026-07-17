import { createHmac, generateKeyPairSync, verify } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { createPlaybackToken, parseMuxSignature, verifyMuxWebhook } from "./mux";

describe("Mux security adapter", () => {
  afterEach(() => { delete process.env.MUX_SIGNING_KEY_ID; delete process.env.MUX_SIGNING_PRIVATE_KEY; });

  it("parses and verifies a current Mux webhook signature", () => {
    const body = JSON.stringify({ id: "event-1" });
    const timestamp = 1_700_000_000;
    const digest = createHmac("sha256", "secret").update(`${timestamp}.${body}`).digest("hex");
    const signature = `t=${timestamp},v1=${digest}`;
    expect(parseMuxSignature(signature)).toEqual({ t: String(timestamp), v1: digest });
    expect(verifyMuxWebhook(body, signature, "secret", timestamp * 1000)).toBe(true);
    expect(verifyMuxWebhook(body, signature, "wrong", timestamp * 1000)).toBe(false);
  });

  it("creates a verifiable short-lived RS256 playback token", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    process.env.MUX_SIGNING_KEY_ID = "signing-key";
    process.env.MUX_SIGNING_PRIVATE_KEY = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const token = createPlaybackToken("playback-123", 900, 1_700_000_000);
    const [header, payload, signature] = token.split(".");
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toMatchObject({ sub: "playback-123", aud: "v", exp: 1_700_000_900 });
    expect(verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, "base64url"))).toBe(true);
  });
});
