import "server-only";

import { Resend } from "resend";

let resend: Resend | undefined;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resend ??= new Resend(apiKey);
  return resend;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) {
  const client = getResend();
  if (!client) {
    console.info(JSON.stringify({ level: "info", message: "email_skipped_local", to: input.to, subject: input.subject }));
    return { id: `local-${input.idempotencyKey}`, local: true };
  }

  const { data, error } = await client.emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL ?? "AniVerse <onboarding@resend.dev>",
      to: input.to,
      subject: input.subject,
      html: input.html,
    },
    { idempotencyKey: input.idempotencyKey },
  );

  if (error) throw new Error(`Email delivery failed: ${error.message}`);
  return { id: data?.id, local: false };
}
