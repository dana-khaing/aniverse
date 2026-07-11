import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pages: MetadataRoute.Sitemap = ["", "/browse", "/schedule", "/community"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path ? "daily" : "hourly", priority: path ? 0.8 : 1 }));
  return [...pages, ...catalog.map((title) => ({ url: `${base}/anime/${title.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 }))];
}
