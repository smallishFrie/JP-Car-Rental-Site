import "server-only";

import { readServerEnv } from "@/lib/env";
import { parsePhoneNumberFromString } from "libphonenumber-js";

type XenditInvoiceResponse = {
  id?: string;
  invoice_url?: string;
  status?: string;
  message?: string;
};

type XenditPaymentRequestResponse = {
  payment_request_id?: string;
  status?: string;
  actions?: Array<{ type?: string; value?: string }>;
  message?: string;
};

type XenditRefundResponse = {
  id?: string;
  status?: string;
  message?: string;
};

type XenditPaymentSessionResponse = {
  payment_session_id?: string;
  status?: string;
  components_sdk_key?: string;
  message?: string;
};

function xenditAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

function normalizeXenditMobileNumber(rawPhone?: string) {
  const candidate = String(rawPhone ?? "").trim();
  if (!candidate) return undefined;

  const parsedPh = parsePhoneNumberFromString(candidate, "PH");
  if (parsedPh?.isValid()) {
    return parsedPh.number;
  }

  const parsedGeneric = parsePhoneNumberFromString(candidate);
  if (parsedGeneric?.isValid()) {
    return parsedGeneric.number;
  }

  // Fallback: keep only + and digits so obvious separators do not break validation.
  const compact = candidate.replace(/[^\d+]/g, "");
  return compact.startsWith("+") ? compact : undefined;
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

export async function createXenditPaymentRequest(input: {
  bookingId: string;
  amountPhp: number;
  channelCode: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerReferenceId: string;
  successUrl: string;
  failureUrl: string;
}) {
  const secretKey = readServerEnv("XENDIT_SECRET_KEY");
  const normalizedMobile = normalizeXenditMobileNumber(input.customerPhone);
  // #region agent log
  fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
    body: JSON.stringify({
      sessionId: "46aa6d",
      runId: "run1",
      hypothesisId: "H6",
      location: "src/lib/xendit.ts:117",
      message: "createXenditPaymentRequest phone normalization",
      data: {
        hadInputPhone: Boolean(input.customerPhone),
        hadNormalizedPhone: Boolean(normalizedMobile),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const response = await fetch("https://api.xendit.co/v3/payment_requests", {
    method: "POST",
    headers: {
      Authorization: xenditAuthHeader(secretKey),
      "Content-Type": "application/json",
      "api-version": "2024-11-11",
    },
    body: JSON.stringify({
      reference_id: input.bookingId,
      type: "PAY",
      country: "PH",
      currency: "PHP",
      request_amount: Number(input.amountPhp.toFixed(2)),
      capture_method: "AUTOMATIC",
      channel_code: input.channelCode,
      channel_properties: {
        success_return_url: input.successUrl,
        failure_return_url: input.failureUrl,
      },
      customer: {
        reference_id: input.customerReferenceId,
        type: "INDIVIDUAL",
        individual_detail: {
          given_names: input.customerName,
        },
        email: input.customerEmail || undefined,
        mobile_number: normalizedMobile,
      },
      description: `JP Car Rental booking ${input.bookingId}`,
      metadata: {
        booking_id: input.bookingId,
      },
    }),
  });

  const payload = (await response.json()) as XenditPaymentRequestResponse;
  if (!response.ok || !payload.payment_request_id) {
    throw new Error(payload.message || "Failed to create payment request.");
  }

  const actionUrl =
    payload.actions?.find((action) => action.type === "REDIRECT_CUSTOMER")?.value ??
    payload.actions?.find((action) => action.value)?.value ??
    undefined;

  return {
    paymentRequestId: payload.payment_request_id,
    actionUrl,
    raw: payload as unknown as Record<string, unknown>,
  };
}

export async function createXenditRefund(input: {
  bookingId: string;
  amountPhp: number;
  currency?: string;
  paymentReference: string;
  paymentReferenceKind: "payment_request" | "invoice" | "payment_id";
  reason?: string;
}) {
  const secretKey = readServerEnv("XENDIT_SECRET_KEY");
  const idField =
    input.paymentReferenceKind === "payment_request"
      ? { payment_request_id: input.paymentReference }
      : input.paymentReferenceKind === "invoice"
        ? { invoice_id: input.paymentReference }
        : { payment_id: input.paymentReference };
  const response = await fetch("https://api.xendit.co/refunds", {
    method: "POST",
    headers: {
      Authorization: xenditAuthHeader(secretKey),
      "Content-Type": "application/json",
      "Idempotency-Key": `refund-${input.bookingId}`,
    },
    body: JSON.stringify({
      reference_id: input.bookingId,
      amount: Number(input.amountPhp.toFixed(2)),
      currency: input.currency ?? "PHP",
      reason: input.reason ?? "CANCELLATION",
      ...idField,
      metadata: {
        booking_id: input.bookingId,
      },
    }),
  });

  const payload = (await response.json()) as XenditRefundResponse;
  if (!response.ok || !payload.id) {
    throw new Error(payload.message || "Failed to create refund.");
  }

  return payload as unknown as Record<string, unknown>;
}

export async function createXenditComponentsPaymentSession(input: {
  bookingId: string;
  amountPhp: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  origins: string[];
}) {
  const secretKey = readServerEnv("XENDIT_SECRET_KEY");
  const uniqueCustomerReferenceId = `cust-${crypto.randomUUID()}`;
  const normalizedMobile = normalizeXenditMobileNumber(input.customerPhone);
  // #region agent log
  fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
    body: JSON.stringify({
      sessionId: "46aa6d",
      runId: "run1",
      hypothesisId: "H6",
      location: "src/lib/xendit.ts:237",
      message: "createXenditComponentsPaymentSession phone normalization",
      data: {
        hadInputPhone: Boolean(input.customerPhone),
        hadNormalizedPhone: Boolean(normalizedMobile),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const response = await fetch("https://api.xendit.co/sessions", {
    method: "POST",
    headers: {
      Authorization: xenditAuthHeader(secretKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_id: input.bookingId,
      session_type: "PAY",
      mode: "COMPONENTS",
      amount: Number(input.amountPhp.toFixed(2)),
      currency: "PHP",
      country: "PH",
      customer: {
        reference_id: uniqueCustomerReferenceId,
        type: "INDIVIDUAL",
        email: input.customerEmail || undefined,
        mobile_number: normalizedMobile,
        individual_detail: {
          given_names: input.customerName,
        },
      },
      components_configuration: {
        origins: input.origins,
      },
    }),
  });

  const payload = (await response.json()) as XenditPaymentSessionResponse;
  // #region agent log
  fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
    body: JSON.stringify({
      sessionId: "46aa6d",
      runId: "run1",
      hypothesisId: "H6",
      location: "src/lib/xendit.ts:272",
      message: "createXenditComponentsPaymentSession response",
      data: {
        ok: response.ok,
        status: response.status,
        hasPaymentSessionId: Boolean(payload.payment_session_id),
        hasComponentsSdkKey: Boolean(payload.components_sdk_key),
        message: payload.message ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!response.ok || !payload.payment_session_id || !payload.components_sdk_key) {
    throw new Error(payload.message || "Failed to create payment session.");
  }

  return {
    paymentSessionId: payload.payment_session_id,
    componentsSdkKey: payload.components_sdk_key,
    raw: payload as unknown as Record<string, unknown>,
  };
}

export function verifyXenditWebhookToken(callbackTokenHeader: string | null) {
  const token = readServerEnv("XENDIT_WEBHOOK_VERIFICATION_TOKEN");
  return Boolean(callbackTokenHeader && callbackTokenHeader === token);
}
