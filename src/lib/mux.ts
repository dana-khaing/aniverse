import {
  createHmac,
  createPrivateKey,
  createSign,
  timingSafeEqual,
} from "node:crypto";

const MUX_API = "https://api.mux.com/video/v1";

type MuxUpload = { id: string; url: string; status: string };
type MuxEvent = {
  id: string;
  type: string;
  data: {
    id?: string;
    upload_id?: string;
    playback_ids?: Array<{ id: string; policy: string }>;
    errors?: { messages?: string[] };
  };
};

function credentials() {
  const id = process.env.MUX_TOKEN_ID;
  const secret = process.env.MUX_TOKEN_SECRET;
  if (!id || !secret) throw new Error("Mux API credentials are not configured");
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

export async function createDirectUpload({
  uploadId,
  origin,
}: {
  uploadId: string;
  origin: string;
}) {
  const response = await fetch(`${MUX_API}/uploads`, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      cors_origin: origin,
      timeout: 3600,
      new_asset_settings: {
        playback_policies: ["signed"],
        passthrough: uploadId,
        video_quality: "basic",
      },
    }),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Mux upload creation failed (${response.status})`);
  return ((await response.json()) as { data: MuxUpload }).data;
}

export async function cancelDirectUpload(uploadId: string) {
  const response = await fetch(
    `${MUX_API}/uploads/${encodeURIComponent(uploadId)}/cancel`,
    {
      method: "PUT",
      headers: {
        authorization: `Basic ${credentials()}`,
        "content-type": "application/json",
      },
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(`Mux upload cancellation failed (${response.status})`);
}

export async function deleteVideoAsset(assetId: string) {
  const response = await fetch(
    `${MUX_API}/assets/${encodeURIComponent(assetId)}`,
    {
      method: "DELETE",
      headers: {
        authorization: `Basic ${credentials()}`,
        "content-type": "application/json",
      },
      cache: "no-store",
    },
  );
  if (!response.ok && response.status !== 404)
    throw new Error(`Mux asset deletion failed (${response.status})`);
}

export function parseMuxSignature(value: string) {
  return Object.fromEntries(
    value
      .split(",")
      .map((part) => part.trim().split("=", 2))
      .filter(([key, item]) => key && item),
  );
}

export function verifyMuxWebhook(
  body: string,
  signature: string,
  secret: string,
  now = Date.now(),
) {
  const values = parseMuxSignature(signature);
  const timestamp = Number(values.t);
  if (
    !values.v1 ||
    !Number.isFinite(timestamp) ||
    Math.abs(now - timestamp * 1000) > 300_000
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(`${values.t}.${body}`)
    .digest("hex");
  const supplied = Buffer.from(values.v1);
  const calculated = Buffer.from(expected);
  return (
    supplied.length === calculated.length &&
    timingSafeEqual(supplied, calculated)
  );
}

export function parseMuxEvent(body: string): MuxEvent {
  return JSON.parse(body) as MuxEvent;
}

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createPlaybackToken(
  playbackId: string,
  expiresInSeconds = 3600,
  now = Math.floor(Date.now() / 1000),
) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const privateKey = process.env.MUX_SIGNING_PRIVATE_KEY?.replaceAll(
    "\\n",
    "\n",
  );
  if (!keyId || !privateKey)
    throw new Error("Mux signing credentials are not configured");
  const header = encode({ alg: "RS256", typ: "JWT", kid: keyId });
  const payload = encode({
    sub: playbackId,
    aud: "v",
    exp: now + expiresInSeconds,
    kid: keyId,
  });
  const unsigned = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(createPrivateKey(privateKey), "base64url");
  return `${unsigned}.${signature}`;
}

export function signedPlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${encodeURIComponent(playbackId)}.m3u8?token=${createPlaybackToken(playbackId)}`;
}
