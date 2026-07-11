# AniVerse

AniVerse is a creator-first anime streaming platform for licensed, public-domain,
and creator-owned content. It combines a polished discovery and viewing experience
with creator publishing, community participation, and transparent moderation.

> [!IMPORTANT]
> AniVerse does not scrape, mirror, or embed unauthorized streams. Every published
> title must have documented distribution rights and pass the platform's review
> process.

## Product vision

AniVerse gives viewers a fast, accessible way to discover and watch animation while
giving approved creators the tools to publish, manage, and understand their work.
The initial release is free to use and supports an English interface with multilingual
audio, subtitles, and localized title metadata.

### Viewer experience

- Responsive dark interface with featured titles, trending rows, latest episodes,
  recommendations, top charts, genres, studios, creators, and release schedules.
- Full-text search with autocomplete and filters for genre, year, season, status,
  format, language, age rating, and creator.
- Adaptive HLS playback with quality, audio, subtitle, speed, picture-in-picture,
  fullscreen, keyboard, autoplay, auto-next, and intro/outro controls.
- Cross-device watch progress, history, continue watching, favorites, custom lists,
  completion states, follows, and release notifications.
- Behavior-based recommendations using genres, follows, history, completion,
  ratings, freshness, and popularity.
- Installable progressive web application with accessible loading, empty, error,
  and reduced-motion states.

### Accounts and community

- Email, magic-link, and Google authentication with recovery, verification, session
  management, privacy controls, account export, and deletion.
- Viewer, verified creator, moderator, and administrator roles enforced on the server.
- Ratings, spoiler-aware comments, threaded replies, reactions, creator follows,
  public profiles, announcements, and in-app or email notifications.
- Blocking, reporting, spam controls, rate limits, moderation queues, suspensions,
  bans, and immutable audit records.
- Mature content hidden by default and available only to signed-in adults who confirm
  their date of birth and explicitly enable it. Illegal or exploitative content is
  prohibited in all cases.

### Creator publishing

- Creator applications with identity, contact, sample, and rights information;
  administrator approval is required before uploads are enabled.
- Organization and team management plus tools for shows, seasons, episodes,
  localized metadata, artwork, trailers, schedules, audio, WebVTT subtitles,
  chapters, intro/outro markers, drafts, and analytics.
- Direct managed-video uploads with processing status, thumbnail generation,
  adaptive streaming, signed playback, and verified idempotent webhooks.
- Moderation review before first publication and after video replacement, with
  version history for metadata changes.
- Rights complaints, takedowns, creator strikes, appeals, evidence retention, and
  administrator audit trails.

### Administration

- Catalog and release review, homepage curation, creator approval, user management,
  moderation, takedowns, analytics, configuration, and audit dashboards.
- Structured operational logs, health checks, failed-webhook visibility, playback
  metrics, upload-processing alerts, backups, and recovery procedures.

## Architecture

| Area | Technology | Responsibility |
| --- | --- | --- |
| Web application | Next.js 16, React, TypeScript | App Router UI, server rendering, route handlers, and mutations |
| Design system | Tailwind CSS, shadcn/ui, Geist | Responsive, accessible interface and reusable components |
| Data platform | Supabase Postgres | Catalog, profiles, community, progress, moderation, and audit data |
| Identity | Supabase Auth | Authentication, sessions, providers, and verified account lifecycle |
| Realtime | Supabase Realtime | Notifications and live community updates |
| Media | Mux | Direct uploads, transcoding, thumbnails, signed HLS, and media webhooks |
| File storage | Supabase Storage | Avatars, approved artwork, documents, and subtitle files |
| Hosting | Vercel | Web deployment, caching, functions, analytics, and observability |
| Email | Resend | Verification-adjacent product mail and notification delivery |
| Monitoring | Sentry and Vercel | Error reporting, traces, performance, and release health |

Provider-specific video identifiers will be isolated behind a media service adapter
so the managed video provider can be replaced later without changing the catalog
domain model.

## Core data domains

- Identity: profiles, roles, preferences, sessions, and blocked users.
- Creators: applications, organizations, members, rights records, and strikes.
- Catalog: titles, localized metadata, seasons, episodes, genres, credits, ratings,
  schedules, video assets, audio tracks, subtitles, and publication states.
- Viewer activity: progress, history, lists, ratings, follows, and recommendation events.
- Community: comments, replies, reactions, reports, notifications, and announcements.
- Governance: moderation cases, takedowns, appeals, configuration, and audit logs.

All exposed Supabase tables use Row Level Security. Public users may read only
published and unrestricted catalog data. Viewers control their private activity;
creators control only their organization's drafts; privileged operations require
server-side authorization. Secrets and service credentials never enter browser code.

## API and media flow

Versioned endpoints under `/api/v1` will handle search suggestions, playback
authorization, progress updates, creator upload sessions, reports, moderation,
account exports, and provider webhooks. Inputs and outputs use shared Zod schemas
and a consistent error envelope.

1. An approved creator requests a one-time upload URL.
2. The browser uploads directly to Mux rather than passing video through Next.js.
3. Signed webhooks update processing state using stored provider event IDs for
   replay-safe, idempotent handling.
4. Moderators review the rights record, metadata, content rating, and processed media.
5. Published episodes receive short-lived playback tokens after access, maturity,
   suspension, and regional-policy checks.
6. The player periodically saves progress and resumes from the latest valid position.

Public catalog data may use tagged caching with on-demand invalidation. Personalized,
moderation, and playback authorization responses remain private and uncached.

## Security, safety, and accessibility

- Revalidate authorization in server components, actions, and route handlers rather
  than relying on request middleware alone.
- Verify webhook signatures; sanitize community content; validate uploads; use
  CSRF-safe mutations, security headers, bot protection, and per-user/IP rate limits.
- Preserve auditable records with soft deletion where governance requires it.
- Target WCAG 2.2 AA for keyboard navigation, focus, contrast, forms, captions,
  player controls, and screen-reader semantics.
- Use original, licensed, or public-domain seed media and artwork only.

## Quality strategy

- Unit tests cover ranking, validation, publication transitions, permissions,
  age gates, playback progress, lists, comment trees, and webhook idempotency.
- Database tests exercise every RLS policy and cross-account or cross-creator boundary.
- Integration tests cover authentication, creator approval, upload processing,
  publication, signed playback, reports, takedowns, and account lifecycle operations.
- Playwright tests cover browsing, search, playback controls, resume behavior,
  community flows, creator publishing, moderation, administration, and maturity gates.
- Accessibility, responsive-layout, current-browser, dependency, rate-limit,
  webhook-replay, load, and degraded-network checks run before release.

## Delivery roadmap

The product is intended to ship as one complete public release, but implementation
will proceed through independently testable pull requests:

1. Foundation: application scaffold, design system, environments, CI, and observability.
2. Identity and authorization: authentication, profiles, roles, RLS, and account tools.
3. Catalog and discovery: data model, browsing, search, schedules, and recommendations.
4. Creator platform: applications, organizations, uploads, metadata, and publishing.
5. Playback: secure media authorization, player controls, progress, and history.
6. Community: ratings, comments, follows, notifications, reports, and moderation.
7. Administration and governance: curation, analytics, takedowns, and audit tools.
8. Release hardening: performance, accessibility, security, recovery, and end-to-end QA.

## Planned local development

The application scaffold will be added in a dedicated feature branch. Development
will require Node.js 20.9 or newer, pnpm, a Supabase project, a Mux environment,
and configured Vercel and Resend accounts. Environment values will be documented in
an example file; real credentials must remain in ignored local files and deployment
secret stores.

## License and content policy

The software license will be selected before source implementation begins. Content
uploaded to AniVerse remains subject to its creator's ownership and distribution
terms. Repository availability does not grant permission to reuse media, artwork,
branding, or user submissions.
