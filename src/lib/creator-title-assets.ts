import { z } from "zod";

export const titleAssetKindSchema = z.enum([
  "poster",
  "backdrop",
  "trailer",
]);

export const trailerReferenceSchema = z.object({
  titleId: z.string().uuid(),
  kind: z.literal("trailer"),
  sourceUrl: z
    .string()
    .url()
    .max(2048)
    .refine((value) => new URL(value).protocol === "https:", {
      message: "Trailer URL must use HTTPS",
    }),
});

export const artworkMetadataSchema = z.object({
  titleId: z.string().uuid(),
  kind: z.enum(["poster", "backdrop"]),
});

export function artworkFileError(file: File) {
  if (!file.size) return "Choose a non-empty artwork file.";
  if (file.size > 20_971_520) return "Artwork must be 20 MB or smaller.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Artwork must be JPEG, PNG, or WebP.";
  return null;
}

export function safeArtworkFilename(filename: string) {
  const extension = filename.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1];
  return `${
    filename
      .toLowerCase()
      .replace(/\.(jpe?g|png|webp)$/, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "artwork"
  }.${extension === "jpeg" ? "jpg" : extension ?? "webp"}`;
}
