/** Inline styles for transactional email — mirrors site tokens (globals.css light theme). */

export const emailBrand = {
  bgPage: "#f5f5f7",
  bgElevated: "#ffffff",
  text: "#1d1d1f",
  textMuted: "#6e6e73",
  accent: "#0066cc",
  accentHover: "#004d99",
  border: "rgba(0,0,0,0.08)",
  radius: "14px",
  fontStack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function wrapEmailDocument(inner: string) {
  const b = emailBrand;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${b.bgPage};">
  <div style="display:none;max-height:0;overflow:hidden;">JP Car Rental</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${b.bgPage};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:${b.bgElevated};border-radius:${b.radius};border:1px solid ${b.border};box-shadow:0 4px 16px rgba(0,0,0,0.06);" cellspacing="0" cellpadding="0">
          ${inner}
        </table>
        <p style="font-family:${b.fontStack};font-size:12px;color:${b.textMuted};margin:20px 8px 0;text-align:center;">
          JP Car Rental · Simple online booking
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailHeaderBlock(title: string, subtitle?: string) {
  const b = emailBrand;
  const sub = subtitle
    ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.45;color:${b.textMuted};">${escapeHtml(subtitle)}</p>`
    : "";
  return `<tr>
  <td style="padding:26px 28px 18px;border-bottom:1px solid ${b.border};">
    <p style="margin:0;font-family:${b.fontStack};font-size:13px;font-weight:600;letter-spacing:0.04em;color:${b.accent};text-transform:uppercase;">JP Car Rental</p>
    <h1 style="margin:10px 0 0;font-family:${b.fontStack};font-size:22px;line-height:1.25;font-weight:600;color:${b.text};">${escapeHtml(title)}</h1>
    ${sub}
  </td>
</tr>`;
}

export function emailPrimaryButton(href: string, label: string) {
  const b = emailBrand;
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:22px;">
  <tr>
    <td style="border-radius:10px;background:${b.accent};">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-family:${b.fontStack};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function emailMutedButton(href: string, label: string) {
  const b = emailBrand;
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:12px;">
  <tr>
    <td style="border-radius:10px;border:1px solid ${b.border};background:${b.bgPage};">
      <a href="${href}" style="display:inline-block;padding:10px 18px;font-family:${b.fontStack};font-size:14px;font-weight:600;color:${b.text};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}
