import "server-only";

import { readOptionalServerEnv } from "@/lib/env";
import { sendBookingEmail } from "@/lib/notifications/email";
import { emailBrand, escapeHtml, wrapEmailDocument, emailHeaderBlock } from "@/lib/notifications/email-brand";

function adminRecipientEmails() {
  const raw = readOptionalServerEnv("ADMIN_NOTIFICATION_EMAILS").trim();
  if (!raw) {
    return [] as string[];
  }
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes("@"));
}

export async function notifyAdmins(input: { subject: string; text: string; html?: string }) {
  const recipients = adminRecipientEmails();
  if (!recipients.length) {
    return { sent: 0, skipped: true as const };
  }
  await Promise.allSettled(
    recipients.map((to) =>
      sendBookingEmail({
        to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    ),
  );
  return { sent: recipients.length, skipped: false as const };
}

export function adminEventEmailHtml(title: string, lines: Array<{ label: string; value: string }>) {
  const b = emailBrand;
  const rows = lines
    .map(
      (row) => `<tr>
  <td style="padding:10px 0;font-family:${b.fontStack};font-size:14px;color:${b.textMuted};vertical-align:top;width:38%;">${escapeHtml(row.label)}</td>
  <td style="padding:10px 0;font-family:${b.fontStack};font-size:14px;color:${b.text};font-weight:600;text-align:right;">${escapeHtml(row.value)}</td>
</tr>`,
    )
    .join("");
  const inner = `
${emailHeaderBlock(title, "Admin notification")}
<tr>
  <td style="padding:22px 28px 28px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows}</table>
  </td>
</tr>`;
  return wrapEmailDocument(inner);
}
