const present = (value) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  !/^(replace-|your-|example|changeme)/i.test(value.trim());

const validators = {
  text(value) {
    return value.length >= 2;
  },
  url(value, { production }) {
    try {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        (!production || url.protocol === "https:")
      );
    } catch {
      return false;
    }
  },
  secret(value) {
    return value.length >= 24;
  },
  supabaseKey(value) {
    return value.length >= 32;
  },
  muxPrivateKey(value) {
    return value.replaceAll("\\n", "\n").includes("BEGIN PRIVATE KEY");
  },
  resendKey(value) {
    return /^re_[A-Za-z0-9_]+$/.test(value);
  },
  sender(value) {
    return /(?:<)?[^<>\s]+@[^<>\s]+\.[^<>\s]+>?$/.test(value);
  },
  stripeKey(value) {
    return /^sk_(?:test|live)_[A-Za-z0-9]+$/.test(value);
  },
  stripeWebhook(value) {
    return /^whsec_[A-Za-z0-9]+$/.test(value);
  },
  sentryDsn(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.includes("sentry");
    } catch {
      return false;
    }
  },
  vapidPublic(value) {
    return /^[A-Za-z0-9_-]{80,120}$/.test(value);
  },
  vapidPrivate(value) {
    return /^[A-Za-z0-9_-]{40,80}$/.test(value);
  },
  vapidSubject(value) {
    return value.startsWith("mailto:") || value.startsWith("https://");
  },
};

export const providerDefinitions = [
  {
    id: "supabase",
    variables: [
      ["NEXT_PUBLIC_SUPABASE_URL", "url"],
      ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "supabaseKey"],
      ["SUPABASE_SERVICE_ROLE_KEY", "supabaseKey"],
    ],
  },
  {
    id: "mux",
    variables: [
      ["MUX_TOKEN_ID", "text"],
      ["MUX_TOKEN_SECRET", "secret"],
      ["MUX_WEBHOOK_SECRET", "secret"],
      ["MUX_SIGNING_KEY_ID", "text"],
      ["MUX_SIGNING_PRIVATE_KEY", "muxPrivateKey"],
    ],
  },
  {
    id: "resend",
    variables: [
      ["RESEND_API_KEY", "resendKey"],
      ["RESEND_FROM_EMAIL", "sender"],
    ],
  },
  {
    id: "stripe",
    variables: [
      ["STRIPE_SECRET_KEY", "stripeKey"],
      ["STRIPE_WEBHOOK_SECRET", "stripeWebhook"],
    ],
  },
  {
    id: "sentry",
    variables: [
      ["NEXT_PUBLIC_SENTRY_DSN", "sentryDsn"],
      ["SENTRY_ORG", "text"],
      ["SENTRY_PROJECT", "text"],
      ["SENTRY_AUTH_TOKEN", "secret"],
    ],
  },
  {
    id: "vapid",
    variables: [
      ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "vapidPublic"],
      ["VAPID_PRIVATE_KEY", "vapidPrivate"],
      ["VAPID_SUBJECT", "vapidSubject"],
    ],
  },
  {
    id: "vercel",
    variables: [
      ["NEXT_PUBLIC_SITE_URL", "url"],
      ["CRON_SECRET", "secret"],
    ],
  },
];

export function evaluateProviderReadiness(
  env,
  { production = env.NODE_ENV === "production" } = {},
) {
  const providers = providerDefinitions.map((provider) => {
    const missing = provider.variables
      .filter(([name]) => !present(env[name]))
      .map(([name]) => name);
    const invalid = provider.variables
      .filter(([name, validator]) => {
        const value = env[name];
        return (
          present(value) && !validators[validator](value.trim(), { production })
        );
      })
      .map(([name]) => name);
    const status = missing.length
      ? "missing"
      : invalid.length
        ? "invalid"
        : "ready";
    return { id: provider.id, status, missing, invalid };
  });
  return {
    status: providers.every((provider) => provider.status === "ready")
      ? "ready"
      : "incomplete",
    providers,
  };
}

export function publicProviderReadiness(readiness) {
  return Object.fromEntries(
    readiness.providers.map(({ id, status }) => [id, status]),
  );
}
