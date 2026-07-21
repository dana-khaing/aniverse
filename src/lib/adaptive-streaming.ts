export type StreamLevel = { height?: number; bitrate?: number };
export type QualityOption = { label: string; level: number };

export function qualityOptions(levels: StreamLevel[]): QualityOption[] {
  const seen = new Set<number>();
  return levels
    .map((item, level) => ({ height: item.height ?? 0, bitrate: item.bitrate ?? 0, level }))
    .filter((item) => item.height > 0 && !seen.has(item.height) && seen.add(item.height))
    .sort((a, b) => b.height - a.height)
    .map((item) => ({ label: `${item.height}p`, level: item.level }));
}

export function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
