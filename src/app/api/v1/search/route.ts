import { searchCatalog } from "@/lib/catalog-repository";
import { publicCatalogHeaders } from "@/lib/delivery-policy";
import { consumeDistributedRateLimit } from "@/lib/distributed-security";
import { searchKitsu, type KitsuTitle } from "@/lib/kitsu/client";

function normalizeTitle(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export function omitLocalMatches(
  discovery: KitsuTitle[],
  local: Array<{ name: string; nativeName: string }>,
) {
  const localNames = new Set(
    local.flatMap(({ name, nativeName }) => [normalizeTitle(name), normalizeTitle(nativeName)]),
  );
  return discovery.filter(
    ({ title, nativeTitle }) =>
      !localNames.has(normalizeTitle(title)) &&
      !localNames.has(normalizeTitle(nativeTitle)),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = request.headers.get("x-forwarded-for") ?? "local";
  if (!(await consumeDistributedRateLimit("search", key)))
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": "2", "cache-control": "private, no-store" },
      },
    );
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const results = await searchCatalog(q);
  let discovery: KitsuTitle[] = [];
  let discoveryAvailable = true;
  try {
    discovery = omitLocalMatches(await searchKitsu(q, 6), results).slice(0, 6);
  } catch {
    discoveryAvailable = false;
  }
  return Response.json(
    {
      data: results
        .slice(0, 8)
        .map(({ slug, name, nativeName, genre, year, studio, tone }) => ({
          slug,
          name,
          nativeName,
          genre,
          year,
          studio,
          tone,
        })),
      discovery: discovery.map(({ id, title, nativeTitle, subtype, posterImage }) => ({
        id,
        title,
        nativeTitle,
        subtype,
        posterImage,
      })),
      meta: { query: q, discoveryAvailable },
    },
    { headers: publicCatalogHeaders },
  );
}
