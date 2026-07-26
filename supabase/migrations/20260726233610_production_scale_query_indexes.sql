-- Playback selects the newest ready asset for one episode. Keeping only ready
-- Mux rows makes this hot index small even while uploads are being processed.
create index if not exists video_uploads_episode_ready_created_idx
  on public.video_uploads(episode_id, created_at desc)
  where provider = 'mux' and status = 'ready';

-- Creator analytics scans a team's recent events by title and time.
create index if not exists playback_events_title_recent_covering_idx
  on public.playback_events(title_id, occurred_at desc)
  include (user_id, episode_id, event_type, position_seconds, duration_seconds, country_code);

-- The public feed only reads top-level posts in newest-first order.
create index if not exists community_posts_root_created_idx
  on public.community_posts(created_at desc)
  where parent_id is null;

-- Creator Studio repeatedly resolves published titles within one team.
create index if not exists titles_creator_team_status_created_idx
  on public.titles(creator_team_id, status, created_at desc)
  where creator_team_id is not null;

-- Active invitations are resolved case-insensitively by recipient and expiry.
create index if not exists creator_team_invitations_active_email_idx
  on public.creator_team_invitations(lower(email), expires_at, created_at desc)
  where accepted_at is null;
