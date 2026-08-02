# AniVerse user guide

This guide explains how to use AniVerse as a guest, viewer, creator, moderator,
or administrator. Features that use cloud accounts require the production
providers to be configured. A local development copy stores supported demo data
in the current browser instead.

## Quick start

1. Open the home page and use **Browse**, **Schedule**, or search to find a title.
2. Open a title to see its description, seasons, episodes, languages, maturity
   rating, community score, and available actions.
3. Select an episode to open the player.
4. Sign in to synchronize progress, lists, preferences, comments, follows, and
   notifications between supported devices.

Guests can browse published catalog pages and watch content that does not require
an account. Personal libraries, community actions, watch parties, mature-content
preferences, and creator tools require sign-in.

## Create and access an account

- Choose **Sign in** and use email, a magic link, or an enabled identity provider.
- New users can choose **Sign up** and must accept the current terms and privacy
  policy. Confirm the email address when asked.
- Use **Forgot password** on the sign-in page to request account recovery.
- If a sensitive operation asks you to reauthenticate, sign in again. Some
  administrator and payment operations also require a second authentication
  factor.

Never share a verification link, recovery code, password, or second-factor code.
AniVerse support should not ask for these values.

## Find something to watch

### Browse and search

Use the search field for title autocomplete. The Browse page supports filters for
genre, year, season, publication status, format, language, age rating, studio, and
creator. Remove filters or clear the query if no results appear.

Other discovery areas include:

- personalized and “because you watched” rows on the home page;
- seasonal charts and the release schedule;
- studio pages and public creator profiles;
- trending, recently released, and continue-watching rows.

Only published titles available to the current account and maturity settings are
shown. Recommendations improve after watching, completing, rating, or following
titles and creators.

### Languages and localization

Use the locale selector where available to change interface language and localized
catalog metadata. Audio and subtitle availability is episode-specific and is
selected separately inside the player.

## Use the video player

The player supports play/pause, seeking, volume, playback speed, quality selection,
audio tracks, subtitles, picture-in-picture, fullscreen, autoplay, and automatic
next-episode playback. Available controls depend on the browser and the episode's
media tracks.

When supplied by the creator, the player also displays chapters and offers intro
or outro skipping. Subtitle appearance can be customized in player settings.

Common keyboard controls:

| Key | Action |
| --- | --- |
| Space or `K` | Play or pause |
| Left/Right arrow | Seek backward or forward |
| Up/Down arrow | Raise or lower volume |
| `M` | Mute or unmute |
| `F` | Enter or leave fullscreen |
| `P` | Toggle picture-in-picture when supported |
| `C` | Toggle subtitles when available |

Keyboard commands do not run while focus is inside a text field. Browser or
operating-system media shortcuts may override an AniVerse shortcut.

### Progress and playback history

AniVerse periodically saves the current position for signed-in users. Open
**History** or **Continue watching** to resume. Completing an episode updates its
completion state and may advance the next-episode recommendation.

If progress is updated on two devices at once, refresh the library and keep the
newer version when prompted. Private browsing, cleared site data, or local demo
mode can prevent browser-only progress from reaching another device.

## Build your library

From a title page or library screen, you can:

- add or remove a favorite;
- add a title to the watchlist;
- set a watching, completed, paused, dropped, or planned state;
- create a custom list and add or remove titles;
- review history and continue-watching items.

Open **My List** for watchlist-focused access or **Library** for the complete
dashboard. Changes are private unless a profile feature explicitly says they will
be public.

## Community and profiles

Signed-in users can rate titles, write spoiler-aware comments, reply, react,
follow creators, publish supported community posts, and review public profiles.
Use spoiler controls whenever text reveals important story events.

Your public profile can show the display name, avatar, biography, badges,
achievements, reviews, and activity allowed by your privacy settings. Open account
profile settings to change profile visibility. Blocking another account prevents
supported direct visibility and interaction in both directions.

Use **Report** for spam, harassment, rights concerns, unsafe material, or other
policy violations. A report should describe the problem and include relevant
evidence; repeated reports do not accelerate review.

## Watch parties

Open a party invitation link or create a party from supported viewing surfaces.
The party page contains the synchronized player, participant list, presence state,
and group chat.

- The host controls synchronized playback and can manage participants.
- Moderators can assist with invitations and participant management.
- Viewers follow the authoritative party position and playback state.
- If disconnected, keep the party page open; the client attempts to reconnect and
  reconcile with the latest host event.

Do not share a private invitation code publicly. If synchronization drifts, pause
manual seeking, confirm the connection has recovered, and use the party resync
control or reload the page.

## Notifications

Open **Account → Notifications** to choose supported in-app, email, and push
notifications. Events can include releases, replies, moderation decisions,
creator activity, party invitations, and account/security changes.

Browser push requires notification permission and a supported browser. If push
does not arrive, confirm that notifications are permitted for the site, the device
is online, and the relevant category is enabled. Essential security or legal
messages may not be disabled.

## Account and privacy settings

The Account area provides profile, notification, privacy, security, session,
backup, export, and deletion controls.

- Review active sessions and revoke devices you no longer recognize.
- Configure profile visibility, blocking, mature-content preferences, and related
  privacy options.
- Export supported account data or create an encrypted continuity backup.
- Install AniVerse as a progressive web app when the browser offers **Install**.
- Request account deletion by completing the confirmation and recent-authentication
  step. Deletion revokes sessions and is irreversible after processing.

Mature content is hidden by default. It can only be enabled by an eligible signed-in
adult after confirming the required settings. Content that violates law or platform
policy is never made available by changing maturity preferences.

## Creator guide

### Apply and join a team

Open **Creator → Apply** and submit the requested channel, legal identity,
portfolio, and distribution-rights information. An administrator must approve the
application before publishing tools are enabled. Review notes and application
status appear in the creator area.

Approved creators can create or join a creator team through an invitation. Team
roles determine who may edit metadata, manage media, schedule releases, or manage
other members. A creator can only access teams where they have an active membership.

### Build a title

In Creator Studio:

1. Create the title and complete its core metadata and maturity rating.
2. Add seasons and episodes in the intended order.
3. Upload licensed artwork and an optional trailer.
4. Add translated title metadata for supported locales.
5. Configure episode audio tracks and WebVTT subtitle tracks.
6. Add chapter markers plus optional intro and outro ranges.
7. Save drafts and resolve every release-readiness warning.

Use only media, artwork, subtitles, and music that your team has the right to
distribute. Rights documentation can be requested during review or after a report.

### Upload and replace video

Select an episode in the media console and start a cloud upload. The uploader
supports progress reporting, retry, cancellation, replacement, and deletion when
the account and asset state allow it. Keep the page open until the direct upload
has been accepted.

After upload, processing status is updated by the video provider. Playback is not
available until transcoding succeeds and the episode passes the applicable review.
Replacing a published video may return it to review. Do not repeatedly create
uploads while one is processing; use retry or replacement on the existing item.

### Schedule and publish

Creators can configure scheduled releases, premieres, trailers, announcements,
and countdowns. Check title metadata, rights, maturity rating, artwork, processed
video, tracks, and markers in the release-readiness panel before submission.

The first publication and material replacements may require moderation approval.
Times are stored consistently and displayed using the viewer's supported locale
and timezone.

### Analytics and payments

Creator analytics include qualified views, retention, completion rate, and
available audience geography. Very small or privacy-sensitive cohorts may be
withheld. Analytics can be delayed while playback events are validated.

Where creator tips are enabled, a team owner connects the supported payment
provider using the protected onboarding flow. Payment onboarding can require
recent authentication and MFA. AniVerse never displays the provider's secret
credentials in Creator Studio.

### Rights complaints and strikes

Creators can review applicable complaints, takedowns, strikes, evidence, and
appeal status in the creator rights area. Submit a counter-notice or appeal only
when the information is accurate and you are authorized to act for the rights
holder. Expired strikes remain represented in audit history where required.

## Moderator guide

Moderator access is assigned by an administrator and checked against the current
server-side role on every protected request. Moderator tools cover report queues,
evidence review, appeals, takedown execution, creator strikes, and support cases.

For each case:

1. Confirm the reported object, policy category, parties, and timestamps.
2. Review attached evidence and relevant retained history.
3. Record a clear decision reason without copying unnecessary personal data.
4. Apply only the action supported by policy and current permissions.
5. Confirm notifications and follow-up tasks were created.

Do not use user metadata, screenshots of role labels, or client-visible state as
proof of authorization. Escalate conflicts of interest, credible legal requests,
and uncertain high-impact actions to an administrator.

## Administrator guide

The administrator dashboard includes creator applications, user and role
management, moderation operations, DMCA administration, notification operations,
platform controls, support, and audit history.

- Grant the minimum role required and provide a reason for every access change.
- Do not suspend yourself, remove the final administrator, or use a personal test
  account for production verification.
- Reauthenticate and complete MFA when prompted for sensitive mutations.
- Use audit history to confirm actor, target, reason, outcome, and timestamp.
- Use the status and readiness views when investigating provider incidents.

Service-role credentials belong only in protected server environments. They must
never be pasted into the browser, a support case, chat, source control, or a value
whose name begins with `NEXT_PUBLIC_`.

## Accessibility and keyboard use

AniVerse is designed for keyboard navigation, visible focus, screen readers,
captions, reduced motion, and responsive zoom. Use `Tab` and `Shift+Tab` to move
between controls and `Enter` or `Space` to activate the focused control. Player
shortcuts are listed earlier in this guide.

If an animation causes discomfort, enable reduced motion in the operating system.
If a control cannot be reached, a label is unclear, or captions are unusable,
submit a support ticket with the page, browser, device, and expected behavior.

## Troubleshooting

### Sign-in or synchronization problems

- Confirm the verification or recovery link is the newest one requested.
- Allow first-party cookies and ensure the device clock is correct.
- Refresh after connectivity returns, then review active sessions.
- Local demo data belongs to that browser profile and is not cloud-synchronized.

### Playback problems

- Confirm the episode is published and available to the current account.
- Disable a network-level blocker temporarily if it prevents the media host.
- Try automatic quality, then a lower quality on a constrained connection.
- Check that the selected audio or subtitle track exists for the episode.
- Reload after a watch-party reconnection before manually seeking again.

### Upload problems

- Use a supported file and keep it within the displayed size/type limits.
- Retry a resumable upload instead of creating duplicate episode assets.
- If processing fails, keep the asset ID and error state when contacting support.
- Confirm the creator team role still permits editing the selected title.

### Missing email or push messages

Check spam folders, notification categories, browser permission, and the email on
the account. Delivery can be delayed during a provider incident; consult the
public Status page before repeatedly requesting the same event.

## Help, safety, and legal requests

- Use **Help** for product guidance and **Support** to open or follow a ticket.
- Use **Status** for current service incidents.
- Use the in-product report action for community or catalog policy concerns.
- Use **Copyright** or **Takedown** for rights-owner and DMCA workflows.
- Review **Terms** and **Privacy** for the governing documents and data practices.

For urgent personal safety concerns or illegal activity, contact the appropriate
local authority first. Do not include passwords, authentication codes, payment
credentials, or unrelated personal data in a support ticket.

## Local development users

In an unconfigured local copy, AniVerse exposes demo workflows backed by browser
storage. Start the site with `pnpm dev`, open the URL printed by Next.js, and use
the visible demo controls. Cloud authentication, cross-device synchronization,
managed video processing, email, payment, and production push delivery require
their corresponding providers and cannot be proven by local demo state.
