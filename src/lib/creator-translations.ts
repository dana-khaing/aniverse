import { z } from "zod";
import { locales } from "@/lib/i18n";

export const creatorTranslationSchema = z.object({
  titleId: z.string().uuid(),
  locale: z.enum(locales),
  name: z.string().trim().min(1).max(160),
  nativeName: z.string().trim().max(160).optional().default(""),
  synopsis: z.string().trim().min(1).max(5000),
  seoTitle: z.string().trim().max(70).optional().default(""),
  seoDescription: z.string().trim().max(160).optional().default(""),
});

export type CreatorTranslationInput = z.infer<typeof creatorTranslationSchema>;

export function translationCompleteness(
  translation: Partial<CreatorTranslationInput> | undefined,
) {
  const required = [
    translation?.name,
    translation?.synopsis,
    translation?.seoTitle,
    translation?.seoDescription,
  ];
  return Math.round(
    (required.filter((value) => Boolean(value?.trim())).length /
      required.length) *
      100,
  );
}
