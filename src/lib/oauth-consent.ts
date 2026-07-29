import { createHmac, timingSafeEqual } from "node:crypto";

export const oauthConsentCookie = "aniverse_oauth_consent";
export function signOAuthConsentIntent(
  secret: string,
  version: string,
  issuedAt = Date.now(),
) {
  const payload = Buffer.from(JSON.stringify({ version, issuedAt })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthConsentIntent(
  value: string,
  secret: string,
  now = Date.now(),
) {
  const [payload, supplied] = value.split(".");
  if (!payload || !supplied) return null;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const received = Buffer.from(supplied, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received))
    return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      version: string;
      issuedAt: number;
    };
    return now - parsed.issuedAt <= 10 * 60_000 && now >= parsed.issuedAt
      ? parsed
      : null;
  } catch {
    return null;
  }
}
