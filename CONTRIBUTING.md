# Contributing to AniVerse

Thank you for helping make AniVerse better. Contributions should preserve its
creator-first content policy, accessible interface, and rights-aware publishing
model.

## Before you begin

- Use Node.js 22 or newer and pnpm 8.15.1.
- Read `AGENTS.md` before making framework changes.
- Never commit secrets, provider credentials, copyrighted media, or user data.
- Keep each pull request focused on one independently reviewable change.

## Local setup

```bash
corepack enable
pnpm install
pnpm dev
```

AniVerse runs without provider credentials using browser-backed demo data. Copy
`.env.example` to `.env.local` only when testing an integration you control.

## Development workflow

1. Start from an up-to-date `main` branch.
2. Create a short, date-free branch name such as `feature/search-filters` or
   `fix/player-focus`.
3. Add or update tests for behavior changes.
4. Keep commits small, descriptive, and logically complete.
5. Open a pull request that explains the problem, solution, and validation.

## Required validation

Run the checks appropriate to your change. Before requesting review, the baseline
suite is:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For user-interface changes, also run the relevant Playwright tests and inspect the
affected desktop and mobile layouts. Database, security, media, and provider changes
have additional commands documented in [the quality matrix](docs/quality-matrix.md).

## Pull-request checklist

- The change has one clear purpose.
- New UI is keyboard accessible and works with reduced motion.
- Loading, empty, error, and offline states are considered.
- Authorization is enforced on the server, not only in the interface.
- Public responses do not expose secrets or private account data.
- Documentation and `.env.example` are updated when configuration changes.
- Tests and validation results are recorded in the pull request.

By contributing, you agree that your code is licensed under the repository's
[MIT License](LICENSE). Media and content remain governed by their respective rights
holders and must not be added without permission.
