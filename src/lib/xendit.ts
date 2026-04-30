import "server-only";

import { readServerEnv } from "@/lib/env";

type XenditInvoiceResponse = {
  id?: string;
  invoice_url?: string;
  status?: string;
  message?: string;
};

function xenditAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

export async function createXenditInvoice(input: {
  bookingId: string;
  carName: string;
  amountPhp: number;
  customerEmail?: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const secretKey = readServerEnv("XENDIT_SECRET_KEY");
  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: xenditAuthHeader(secretKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: input.bookingId,
      amount: Number(input.amountPhp.toFixed(2)),
      currency: "PHP",
      description: `Booking for ${input.carName}`,
      payer_email: input.customerEmail || undefined,
      customer: {
        given_names: input.customerName,
        email: input.customerEmail || undefined,
      },
      success_redirect_url: input.successUrl,
      failure_redirect_url: input.cancelUrl,
    }),
  });

  const payload = (await response.json()) as XenditInvoiceResponse;
  if (!response.ok || !payload.id || !payload.invoice_url) {
    throw new Error(payload.message || "Failed to create Xendit invoice.");
  }

  return {
    invoiceId: payload.id,
    checkoutUrl: payload.invoice_url,
  };
}

export function verifyXenditWebhookToken(callbackTokenHeader: string | null) {
  const token = readServerEnv("XENDIT_WEBHOOK_VERIFICATION_TOKEN");
  return Boolean(callbackTokenHeader && callbackTokenHeader === token);
}
