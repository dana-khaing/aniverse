export const publicCatalogHeaders = {
  "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
  "cdn-cache-control": "public, s-maxage=60, stale-while-revalidate=300",
  vary: "accept-encoding",
} as const;

export const privatePlaybackHeaders = {
  "cache-control": "private, no-store",
  "cdn-cache-control": "private, no-store",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  vary: "cookie, authorization",
} as const;

export function parseSingleByteRange(value: string | null, size: number) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || size <= 0) return null;
  const [, startText, endText] = match;
  if (!startText && !endText) return null;
  const suffix = !startText;
  const start = suffix ? Math.max(0, size - Number(endText)) : Number(startText);
  let end = suffix ? size - 1 : endText ? Number(endText) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return null;
  if (startText && !endText) end = size - 1;
  if (start < 0 || start >= size || end < start) return null;
  end = Math.min(end, size - 1);
  return { start, end, length: end - start + 1 };
}
