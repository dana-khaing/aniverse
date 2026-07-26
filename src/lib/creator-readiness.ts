import { z } from "zod";
import { locales } from "@/lib/i18n";

export const creatorMediaSnapshotSchema = z.object({
  titleId: z.uuid(),
  titleName: z.string().min(1),
  status: z.string().min(1),
  episodeIds: z.array(z.uuid()),
  assetKinds: z.array(z.enum(["poster", "backdrop", "trailer"])),
  translationLocales: z.array(z.enum(locales)),
  readyVideoEpisodeIds: z.array(z.uuid()),
  readyAudioEpisodeIds: z.array(z.uuid()),
});

export type CreatorMediaSnapshot = z.infer<typeof creatorMediaSnapshotSchema>;
export type ReadinessCheck = {
  key: "artwork" | "trailer" | "translations" | "video" | "audio";
  label: string;
  complete: boolean;
  detail: string;
  target: string;
};

export function creatorReleaseReadiness(snapshot: CreatorMediaSnapshot) {
  const assets = new Set(snapshot.assetKinds);
  const translations = new Set(snapshot.translationLocales);
  const readyVideo = new Set(snapshot.readyVideoEpisodeIds);
  const readyAudio = new Set(snapshot.readyAudioEpisodeIds);
  const episodeCount = snapshot.episodeIds.length;
  const videoCount = snapshot.episodeIds.filter((id) =>
    readyVideo.has(id),
  ).length;
  const audioCount = snapshot.episodeIds.filter((id) =>
    readyAudio.has(id),
  ).length;
  const checks: ReadinessCheck[] = [
    {
      key: "artwork",
      label: "Poster and backdrop",
      complete: assets.has("poster") && assets.has("backdrop"),
      detail: `${Number(assets.has("poster")) + Number(assets.has("backdrop"))}/2 required images`,
      target: "#artwork",
    },
    {
      key: "trailer",
      label: "Trailer",
      complete: assets.has("trailer"),
      detail: assets.has("trailer")
        ? "Trailer is ready"
        : "Add a secure trailer reference",
      target: "#artwork",
    },
    {
      key: "translations",
      label: "English and Japanese metadata",
      complete: locales.every((locale) => translations.has(locale)),
      detail: `${locales.filter((locale) => translations.has(locale)).length}/${locales.length} locales complete`,
      target: "#translations",
    },
    {
      key: "video",
      label: "Processed episode video",
      complete: episodeCount > 0 && videoCount === episodeCount,
      detail: `${videoCount}/${episodeCount} episodes ready`,
      target: "#uploads",
    },
    {
      key: "audio",
      label: "Default audio tracks",
      complete: episodeCount > 0 && audioCount === episodeCount,
      detail: `${audioCount}/${episodeCount} episodes ready`,
      target: "#audio-tracks",
    },
  ];
  const completed = checks.filter((check) => check.complete).length;
  return {
    titleId: snapshot.titleId,
    titleName: snapshot.titleName,
    status: snapshot.status,
    checks,
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
    canSubmit: checks.every((check) => check.complete),
  };
}
