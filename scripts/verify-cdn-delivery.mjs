const baseUrl = String(process.env.CDN_TEST_URL ?? "").replace(/\/$/, "");
const mediaPath = process.env.CDN_MEDIA_PATH;
if (!/^https?:\/\//.test(baseUrl)) {
  console.error("Set CDN_TEST_URL to an approved staging or local target.");
  process.exit(2);
}

const failures = [];
const search = await fetch(`${baseUrl}/api/v1/search?q=asteria`, {
  headers: { "x-cdn-verification": "aniverse" },
});
const searchCache = search.headers.get("cache-control") ?? "";
if (!search.ok) failures.push(`search returned ${search.status}`);
if (!/s-maxage=60/.test(searchCache))
  failures.push(`search cache policy is ${JSON.stringify(searchCache)}`);
if (!/accept-encoding/i.test(search.headers.get("vary") ?? ""))
  failures.push("search response does not vary by content encoding");

const worker = await fetch(`${baseUrl}/sw.js`, { cache: "no-store" });
if (!/must-revalidate/.test(worker.headers.get("cache-control") ?? ""))
  failures.push("service worker can become stale at the CDN");

if (mediaPath) {
  const media = await fetch(`${baseUrl}${mediaPath}`, {
    headers: { range: "bytes=0-31" },
  });
  if (media.status !== 206)
    failures.push(`media range returned ${media.status}, expected 206`);
  if (!/^bytes 0-31\/\d+$/.test(media.headers.get("content-range") ?? ""))
    failures.push("media response has an invalid content-range");
  if (!/bytes/i.test(media.headers.get("accept-ranges") ?? ""))
    failures.push("media response does not advertise byte ranges");
}

if (failures.length) {
  console.error("CDN delivery verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `CDN delivery verification passed${mediaPath ? " with byte-range playback" : ""}.`,
);
