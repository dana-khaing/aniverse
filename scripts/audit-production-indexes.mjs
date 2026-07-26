import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL(
    "../supabase/migrations/20260726233610_production_scale_query_indexes.sql",
    import.meta.url,
  ),
  "utf8",
);
const expected = [
  ["video_uploads", "episode_id, created_at desc", "status = 'ready'"],
  ["playback_events", "title_id, occurred_at desc", "include"],
  ["community_posts", "created_at desc", "parent_id is null"],
  ["titles", "creator_team_id, status, created_at desc", "creator_team_id is not null"],
  ["creator_team_invitations", "lower(email), expires_at, created_at desc", "accepted_at is null"],
];
const normalized = migration.toLowerCase().replace(/\s+/g, " ");
const missing = expected.filter((parts) =>
  parts.some((part) => !normalized.includes(part)),
);
if (missing.length) {
  console.error(`Production index audit failed for: ${missing.map(([table]) => table).join(", ")}`);
  process.exit(1);
}
console.log(`Production index audit passed (${expected.length} hot query paths covered).`);
