import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AniVerse",
    short_name: "AniVerse",
    description: "Discover original and creator-owned animation.",
    start_url: "/en",
    scope: "/",
    orientation: "any",
    display: "standalone",
    background_color: "#08080d",
    theme_color: "#08080d",
    categories: ["entertainment", "video"],
  };
}
