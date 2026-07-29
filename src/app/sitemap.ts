import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";
import { locales } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pages: MetadataRoute.Sitemap = [
    "",
    "/browse",
    "/schedule",
    "/community",
    "/terms",
    "/privacy",
    "/copyright",
    "/takedown",
    "/creator/dmca",
    "/about",
    "/help",
    "/status",
    "/support",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path ? "daily" : "hourly",
    priority: path ? 0.8 : 1,
  }));
  const localized = locales.flatMap((locale) =>
    ["", "/browse", "/schedule"].map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: path ? 0.8 : 0.9,
      alternates: {
        languages: Object.fromEntries(
          locales.map((language) => [language, `${base}/${language}${path}`]),
        ),
      },
    })),
  );
  return [
    ...pages,
    ...localized,
    ...catalog.map((title) => ({
      url: `${base}/anime/${title.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
