import { z } from "zod";

export const subtitleMetadataSchema = z.object({
  episodeId: z.string().uuid(),
  language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/),
  label: z.string().trim().min(1).max(80),
  isDefault: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export function isWebVtt(file: File) {
  return (
    file.size > 0 &&
    file.size <= 5_242_880 &&
    file.name.toLowerCase().endsWith(".vtt")
  );
}

export function safeSubtitleFilename(filename: string) {
  return (
    filename
      .toLowerCase()
      .replace(/\.vtt$/, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "subtitles"
  );
}
