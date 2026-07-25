export type DeliveryPreferences = {
  release_email: boolean;
  community_email: boolean;
  creator_email: boolean;
  push_enabled: boolean;
};

export type NotificationCategory =
  "release" | "community" | "moderation" | "creator";

export function deliveryChannels(
  category: NotificationCategory,
  preferences: DeliveryPreferences,
) {
  const email =
    category === "release"
      ? preferences.release_email
      : category === "community" || category === "moderation"
        ? preferences.community_email
        : preferences.creator_email;
  return { email, push: preferences.push_enabled };
}

export function notificationEmailHtml(input: {
  title: string;
  body: string;
  href?: string | null;
  origin: string;
}) {
  const escape = (value: string) =>
    value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character]!;
    });
  const url = input.href
    ? new URL(input.href, input.origin).toString()
    : input.origin;
  return `<div style="background:#09090e;color:#f8f5ff;padding:32px;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;background:#14131c;border:1px solid #302b39;border-radius:12px;padding:28px"><p style="color:#b979ff;letter-spacing:2px;font-size:12px">ANIVERSE</p><h1 style="font-size:24px">${escape(input.title)}</h1><p style="color:#b8b1c0;line-height:1.6">${escape(input.body)}</p><a href="${escape(url)}" style="display:inline-block;margin-top:12px;background:#a45fff;color:white;padding:11px 16px;border-radius:7px;text-decoration:none">Open AniVerse</a></div></div>`;
}
