export type LocalMediaAsset = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  titleId: string;
  episode: number;
  kind: "video" | "audio" | "subtitle" | "trailer";
  language?: string;
  label?: string;
};

export type MediaRendition = {
  id: string;
  assetId: string;
  quality: string;
  width?: number;
  height?: number;
  bitrate?: number;
};

export type AudioTrack = {
  id: string;
  assetId: string;
  language: string;
  label: string;
  default: boolean;
};

export type SubtitleTrack = {
  id: string;
  assetId: string;
  language: string;
  label: string;
  format: "vtt" | "srt";
  default: boolean;
};

export type ChapterMarker = {
  id: string;
  titleId: string;
  episode: number;
  label: string;
  start: number;
  end?: number;
  kind: "chapter" | "intro" | "outro";
};

export type PlaybackEvent = {
  id: string;
  titleId: string;
  episode: number;
  type: "start" | "progress" | "complete" | "seek";
  position: number;
  duration: number;
  occurredAt: string;
  locale?: string;
};

export type BackupManifest = {
  format: "aniverse-backup";
  version: 1;
  createdAt: string;
  databaseVersion: number;
  records: Record<string, number>;
};

export type StoredMedia = LocalMediaAsset & { blob: Blob };

