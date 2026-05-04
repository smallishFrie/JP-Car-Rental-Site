import "server-only";

import {
  emailBrand,
  emailHeaderBlock,
  emailMutedButton,
  emailPrimaryButton,
  escapeHtml,
  wrapEmailDocument,
} from "@/lib/notifications/email-brand";

export type BookingConfirmationEmailInput = {
  customerName: string;
  carName: string;
  startDate: string;
  endDate: string;
  formattedTotal: string;
  myBookingsUrl: string;
  notMeUrl?: string | null;
};

export function buildBookingConfirmationEmailHtml(input: BookingConfirmationEmailInput) {
  const b = emailBrand;
  const notMeSection = input.notMeUrl
    ? `<div style="margin-top:28px;padding-top:22px;border-top:1px solid ${b.border};">
        <p style="margin:0 0 8px;font-family:${b.fontStack};font-size:14px;font-weight:600;color:${b.text};">Don’t recognize this booking?</p>
        <p style="margin:0 0 14px;font-family:${b.fontStack};font-size:13px;line-height:1.5;color:${b.textMuted};">
          If you didn’t reserve this vehicle, tap the button below — we’ll flag it for our team, place a cancellation request where possible, and follow up with you.
        </p>
        ${emailMutedButton(input.notMeUrl, "This wasn’t me — secure this booking")}
      </div>`
    : `<p style="margin:22px 0 0;font-family:${b.fontStack};font-size:12px;line-height:1.5;color:${b.textMuted};">
        If you didn’t make this booking, contact us right away from the phone number on our website.
      </p>`;

  const inner = `
${emailHeaderBlock("You’re all set", "Your rental is confirmed")}
<tr>
  <td style="padding:22px 28px 8px;">
    <p style="margin:0 0 16px;font-family:${b.fontStack};font-size:15px;line-height:1.55;color:${b.text};">
      Hi ${escapeHtml(input.customerName)}, thanks for choosing JP Car Rental. Here’s a summary of your trip.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0;font-family:${b.fontStack};font-size:14px;color:${b.textMuted};">Vehicle</td>
        <td style="padding:10px 0;font-family:${b.fontStack};font-size:14px;color:${b.text};font-weight:600;text-align:right;">${escapeHtml(input.carName)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-family:${b.fontStack};font-size:14px;color:${b.textMuted};">Dates</td>
        <td style="padding:10px 0;font-family:${b.fontStack};font-size:14px;color:${b.text};font-weight:600;text-align:right;">${escapeHtml(input.startDate)} → ${escapeHtml(input.endDate)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-family:${b.fontStack};font-size:14px;color:${b.textMuted};">Total</td>
        <td style="padding:10px 0;font-family:${b.fontStack};font-size:14px;color:${b.text};font-weight:600;text-align:right;">${escapeHtml(input.formattedTotal)}</td>
      </tr>
    </table>
    ${emailPrimaryButton(input.myBookingsUrl, "View my bookings")}
    ${notMeSection}
  </td>
</tr>`;

  return wrapEmailDocument(inner);
}

export function buildBookingConfirmationEmailText(input: BookingConfirmationEmailInput) {
  const lines = [
    `Hi ${input.customerName}, your booking is confirmed.`,
    "",
    `Vehicle: ${input.carName}`,
    `Dates: ${input.startDate} to ${input.endDate}`,
    `Total: ${input.formattedTotal}`,
    "",
    `Manage your trip: ${input.myBookingsUrl}`,
  ];
  if (input.notMeUrl) {
    lines.push("", `If this wasn’t you, open this link: ${input.notMeUrl}`);
  }
  return lines.join("\n");
}
