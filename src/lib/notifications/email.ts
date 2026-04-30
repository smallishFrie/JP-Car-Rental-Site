import "server-only";

import { readOptionalServerEnv, readServerEnv } from "@/lib/env";

export async function sendBookingEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const provider = readOptionalServerEnv("EMAIL_PROVIDER").toLowerCase();

  if (provider === "resend") {
    const apiKey = readServerEnv("RESEND_API_KEY");
    const from = readServerEnv("RESEND_FROM_EMAIL");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to send email via Resend.");
    }
    return;
  }

  if (provider === "sendgrid") {
    const apiKey = readServerEnv("SENDGRID_API_KEY");
    const from = readServerEnv("SENDGRID_FROM_EMAIL");
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }] }],
        from: { email: from },
        subject: input.subject,
        content: [
          { type: "text/plain", value: input.text },
          ...(input.html ? [{ type: "text/html", value: input.html }] : []),
        ],
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to send email via SendGrid.");
    }
  }
}
