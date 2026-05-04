import { NextRequest, NextResponse } from "next/server";
import type { BookingRecord } from "@/lib/booking-model";
import { notifyAfterBookingPaid } from "@/lib/notifications/booking-paid-side-effects";
import { setBookingPaid } from "@/lib/bookings";
import { verifyXenditWebhookToken } from "@/lib/xendit";
import { createAdminClient } from "@/lib/supabase/admin";

type XenditInvoiceWebhookPayload = { id?: string; external_id?: string; status?: string };

type XenditPaymentCaptureWebhookPayload = {
  event?: string;
  data?: {
    reference_id?: string;
    payment_request_id?: string;
    payment_id?: string;
    payment_session_id?: string;
    status?: string;
  };
};

async function finalizePaidBooking(booking: BookingRecord) {
  await notifyAfterBookingPaid(booking);
}

export async function POST(request: NextRequest) {
  const callbackToken = request.headers.get("x-callback-token");
  if (!verifyXenditWebhookToken(callbackToken)) {
    return NextResponse.json({ error: "Invalid webhook token." }, { status: 401 });
  }

  const raw = (await request.json()) as unknown;

  const outer = raw as Record<string, unknown>;
  const eventName = String(outer.event ?? "");
  if (eventName === "refund.succeeded" || eventName === "refund.failed") {
    const dataLayer = (outer.data ?? {}) as Record<string, unknown>;
    const nested = dataLayer.data;
    const refundRow =
      typeof nested === "object" && nested !== null
        ? (nested as Record<string, unknown>)
        : dataLayer;
    const referenceId = String(refundRow.reference_id ?? dataLayer.reference_id ?? "").trim();
    if (!referenceId) {
      return NextResponse.json({ error: "Missing refund reference_id." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: existing } = await supabase.from("bookings").select("id, payment_metadata, refund_status").eq("id", referenceId).maybeSingle();
    if (!existing) {
      return NextResponse.json({ ok: true });
    }

    const row = existing as { id: string; payment_metadata: Record<string, unknown> | null; refund_status: string };
    const meta = { ...(row.payment_metadata ?? {}), refund_webhook_event: raw } as Record<string, unknown>;
    const nextRefundStatus = eventName === "refund.succeeded" ? "succeeded" : "failed";

    if (nextRefundStatus === "succeeded") {
      await supabase
        .from("bookings")
        .update({ refund_status: "succeeded", payment_metadata: meta })
        .eq("id", referenceId)
        .in("refund_status", ["pending"]);
    } else {
      await supabase
        .from("bookings")
        .update({ refund_status: "failed", payment_metadata: meta })
        .eq("id", referenceId)
        .in("refund_status", ["pending"]);
    }

    return NextResponse.json({ ok: true });
  }

  const payPayload = raw as XenditPaymentCaptureWebhookPayload;
  if (payPayload.event && payPayload.event.startsWith("payment.")) {
    if (payPayload.event !== "payment.capture") {
      return NextResponse.json({ ok: true });
    }
    const bookingId = String(payPayload.data?.reference_id ?? "").trim();
    const paymentReference = String(payPayload.data?.payment_request_id ?? payPayload.data?.payment_id ?? "").trim();
    if (!bookingId || !paymentReference) {
      return NextResponse.json({ error: "Missing booking/payment reference." }, { status: 400 });
    }

    const booking = await setBookingPaid({
      bookingId,
      paymentReference,
      paymentMetadata: raw as Record<string, unknown>,
    });

    await finalizePaidBooking(booking as BookingRecord);
    return NextResponse.json({ ok: true });
  }

  if ((raw as { event?: string }).event === "payment_session.completed") {
    const r = raw as { data?: { reference_id?: string; payment_id?: string; payment_session_id?: string } };
    const bookingId = String(r.data?.reference_id ?? "").trim();
    const paymentReference = String(r.data?.payment_id ?? r.data?.payment_session_id ?? "").trim();
    if (!bookingId || !paymentReference) {
      return NextResponse.json({ error: "Missing booking/payment reference." }, { status: 400 });
    }

    const booking = await setBookingPaid({
      bookingId,
      paymentReference,
      paymentMetadata: raw as Record<string, unknown>,
    });

    await finalizePaidBooking(booking as BookingRecord);
    return NextResponse.json({ ok: true });
  }

  const payload = raw as XenditInvoiceWebhookPayload;
  if (payload.status !== "PAID") {
    return NextResponse.json({ ok: true });
  }

  const bookingId = String(payload.external_id ?? "").trim();
  const paymentReference = String(payload.id ?? "").trim();
  if (!bookingId || !paymentReference) {
    return NextResponse.json({ error: "Missing booking/payment reference." }, { status: 400 });
  }

  const booking = await setBookingPaid({
    bookingId,
    paymentReference,
    paymentMetadata: payload as Record<string, unknown>,
  });

  await finalizePaidBooking(booking as BookingRecord);
  return NextResponse.json({ ok: true });
}
