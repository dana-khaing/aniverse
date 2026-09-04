# Security policy

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's
**Security → Report a vulnerability** flow to submit a private report to the
maintainer. Include:

- the affected route, component, or workflow;
- the impact and required conditions;
- reproducible steps or a minimal proof of concept;
- any suggested mitigation; and
- whether sensitive data may have been exposed.

Do not access data that is not yours, disrupt the service, perform denial-of-service
testing, or publish details before a fix is available. Reports made in good faith
will be investigated and handled as quickly as practical.

## Supported version

AniVerse is currently maintained on the latest commit of `main`. Security fixes are
applied there; older commits and forks are not supported release lines.

## Security model

AniVerse treats authentication, authorization, content rights, moderation, media
delivery, webhooks, and account lifecycle operations as security boundaries. See
the repository's production and enforcement documents for the relevant operational
controls. Secrets belong only in deployment-managed environment variables and must
never use a `NEXT_PUBLIC_` prefix.
