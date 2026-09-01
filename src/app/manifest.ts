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
    icons: [
      { src: "/icons/aniverse-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/aniverse-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/aniverse-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
