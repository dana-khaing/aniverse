<div align="center">
  <img src="public/icons/aniverse-192.png" alt="AniVerse orbit logo" width="96" />
  <h1>AniVerse</h1>
  <p><strong>Stories beyond the stars.</strong></p>
  <p>A creator-first home for discovering, watching, and publishing independent animation.</p>
</div>

<div align="center">

[![CI](https://github.com/dana-khaing/aniverse/actions/workflows/ci.yml/badge.svg)](https://github.com/dana-khaing/aniverse/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](package.json)
[![PWA](https://img.shields.io/badge/PWA-installable-8A4FFF?logo=pwa&logoColor=white)](src/app/manifest.ts)

</div>

AniVerse is a creator-first anime streaming platform for licensed, public-domain,
and creator-owned content. It combines a polished discovery and viewing experience
with creator publishing, community participation, and transparent moderation.

**[Explore the product](#product-tour) · [Run locally](#quick-start) · [Read the user guide](docs/user-guide.md) · [Contribute](CONTRIBUTING.md) · [Report a vulnerability](SECURITY.md)**

New to the product? See the [AniVerse user guide](docs/user-guide.md) for viewer,
creator, moderator, administrator, playback, account, and troubleshooting guidance.

> [!IMPORTANT]
> AniVerse does not scrape, mirror, or embed unauthorized streams. Every published
> title must have documented distribution rights and pass the platform's review
> process.

## Product vision

AniVerse gives viewers a fast, accessible way to discover and watch animation while
giving approved creators the tools to publish, manage, and understand their work.
The initial release is free to use and supports English and Japanese interfaces,
multilingual audio, subtitles, and localized title metadata.

## Product tour

| Discover                                                                            | Watch                                                                                  | Create                                                                                          | Connect                                                                              |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Browse, localized search, seasonal charts, schedules, creators, and recommendations | Adaptive playback, chapters, intro/outro skipping, audio, captions, and watch progress | Rights-aware applications, team workflows, uploads, localization, release checks, and analytics | Community posts, replies, reactions, follows, notifications, reports, and moderation |

AniVerse runs in a fully functional local demo mode. Production integrations are
enabled independently through environment variables, so contributors can explore
the complete interface without provider credentials.

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

| Area            | Technology                     | Responsibility                                                          |
| --------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Web application | Next.js 16, React, TypeScript  | App Router UI, server rendering, route handlers, and mutations          |
| Design system   | Tailwind CSS, shadcn/ui, Geist | Responsive, accessible interface and reusable components                |
| Data platform   | Supabase Postgres              | Catalog, profiles, community, progress, moderation, and audit data      |
| Identity        | Supabase Auth                  | Authentication, sessions, providers, and verified account lifecycle     |
| Realtime        | Supabase Realtime              | Notifications and live community updates                                |
| Media           | Mux                            | Direct uploads, transcoding, thumbnails, signed HLS, and media webhooks |
| File storage    | Supabase Storage               | Avatars, approved artwork, documents, and subtitle files                |
| Hosting         | Vercel                         | Web deployment, caching, functions, analytics, and observability        |
| Email           | Resend                         | Verification-adjacent product mail and notification delivery            |
| Monitoring      | Sentry and Vercel              | Error reporting, traces, performance, and release health                |

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

Versioned endpoints under `/api/v1` handle search suggestions, playback
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

## Release status

The complete product foundation is implemented through independently testable pull
requests:

1. Foundation: application scaffold, design system, environments, CI, and observability.
2. Identity and authorization: authentication, profiles, roles, RLS, and account tools.
3. Catalog and discovery: data model, browsing, search, schedules, and recommendations.
4. Creator platform: applications, organizations, uploads, metadata, and publishing.
5. Playback: secure media authorization, player controls, progress, and history.
6. Community: ratings, comments, follows, notifications, reports, and moderation.
7. Administration and governance: curation, analytics, takedowns, and audit tools.
8. Release hardening: performance, accessibility, security, recovery, and end-to-end QA.

## Quick start

AniVerse runs completely in local demo mode without provider accounts. Local browser
storage persists creator, playback, library, community, and moderation workflows.

```bash
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The application uses local demo data until production
providers are configured.

### Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e:chromium
```

See [quality matrix](docs/quality-matrix.md) for broader browser, accessibility,
security, data-policy, and release-gate coverage.

## Production deployment

Use Node.js 22 or newer. Copy `.env.example` to the ignored `.env.local` only when
connecting providers. Supabase, Mux, Resend, and Sentry initialize only when their
credentials exist; secrets never use the `NEXT_PUBLIC_` prefix. Resend defaults to
its testing sender until a production domain is verified.

Vercel Git integration can deploy `main`; configure the variables from `.env.example`
separately for Preview and Production. After deployment, verify `/api/health`, inspect
Vercel runtime errors, confirm Sentry receives a test event, and verify Resend delivery.

## Documentation

- [User guide](docs/user-guide.md)
- [Production provider configuration](docs/production-provider-configuration.md)
- [Quality matrix](docs/quality-matrix.md)
- [Backup and recovery](docs/backup-recovery.md)
- [CDN and media delivery](docs/cdn-media-delivery.md)
- [API enforcement contracts](docs/api-enforcement-contracts.md)
- [Release enforcement](docs/production-release-enforcement.md)

## Contributing and security

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the branch,
validation, and pull-request workflow. Please use the private process in
[SECURITY.md](SECURITY.md) for suspected vulnerabilities rather than opening a
public issue.

## License and content policy

The source code is available under the [MIT License](LICENSE). Content uploaded to
AniVerse remains subject to its creator's ownership and distribution terms.
Repository availability does not grant permission to reuse media, artwork,
branding, or user submissions.
