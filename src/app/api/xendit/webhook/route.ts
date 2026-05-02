import { NextRequest, NextResponse } from "next/server";
import { sendBookingEmail } from "@/lib/notifications/email";
import { sendBookingSms } from "@/lib/notifications/sms";
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const myBookingsUrl = `${siteUrl}/account/bookings`;
    const supabase = createAdminClient();
    const { data: car } = await supabase.from("cars").select("name").eq("id", booking.car_id).maybeSingle();
    const carName = String((car as any)?.name ?? booking.car_id);
    const formattedTotal = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
      Number(booking.total_price),
    );

    const smsMessage = `JP Car Rental: Booking confirmed for ${booking.customer_name} from ${booking.start_date} to ${booking.end_date}.`;
    await Promise.allSettled([
      sendBookingSms({ to: booking.customer_phone, message: smsMessage }),
      booking.customer_email
        ? sendBookingEmail({
            to: booking.customer_email,
            subject: "JP Car Rental Confirmation Receipt",
            text: `Your booking is confirmed.\nCar: ${carName}\nDates: ${booking.start_date} to ${booking.end_date}\nTotal: ${formattedTotal}\nMy bookings: ${myBookingsUrl}`,
            html: `
              <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#f9fafb; padding:24px;">
                <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">
                  <div style="padding:20px 20px 12px;border-bottom:1px solid #e5e7eb;">
                    <h1 style="margin:0;font-size:20px;line-height:1.2;color:#111827;">Confirmation Receipt</h1>
                    <p style="margin:6px 0 0;color:#374151;font-size:14px;">JP Car Rental</p>
                  </div>
                  <div style="padding:18px 20px;color:#111827;">
                    <p style="margin:0 0 12px;font-size:14px;color:#111827;">Hi ${booking.customer_name}, your booking is confirmed.</p>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr>
                        <td style="padding:10px 0;color:#6b7280;">Car</td>
                        <td style="padding:10px 0;text-align:right;font-weight:700;">${carName}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;color:#6b7280;">Rental dates</td>
                        <td style="padding:10px 0;text-align:right;font-weight:700;">${booking.start_date} → ${booking.end_date}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;color:#6b7280;">Total</td>
                        <td style="padding:10px 0;text-align:right;font-weight:700;">${formattedTotal}</td>
                      </tr>
                    </table>
                    <div style="margin-top:18px;">
                      <a href="${myBookingsUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;font-weight:700;font-size:14px;">
                        View My Bookings
                      </a>
                    </div>
                    <p style="margin:16px 0 0;color:#6b7280;font-size:12px;">If you didn’t make this booking, reply to this email.</p>
                  </div>
                </div>
              </div>
            `,
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true });
  }

  if ((raw as any)?.event === "payment_session.completed") {
    const bookingId = String((raw as any)?.data?.reference_id ?? "").trim();
    const paymentReference = String((raw as any)?.data?.payment_id ?? (raw as any)?.data?.payment_session_id ?? "").trim();
    if (!bookingId || !paymentReference) {
      return NextResponse.json({ error: "Missing booking/payment reference." }, { status: 400 });
    }

    const booking = await setBookingPaid({
      bookingId,
      paymentReference,
      paymentMetadata: raw as Record<string, unknown>,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const myBookingsUrl = `${siteUrl}/account/bookings`;
    const supabase = createAdminClient();
    const { data: car } = await supabase.from("cars").select("name").eq("id", booking.car_id).maybeSingle();
    const carName = String((car as any)?.name ?? booking.car_id);
    const formattedTotal = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
      Number(booking.total_price),
    );

    const smsMessage = `JP Car Rental: Booking confirmed for ${booking.customer_name} from ${booking.start_date} to ${booking.end_date}.`;
    await Promise.allSettled([
      sendBookingSms({ to: booking.customer_phone, message: smsMessage }),
      booking.customer_email
        ? sendBookingEmail({
            to: booking.customer_email,
            subject: "JP Car Rental Confirmation Receipt",
            text: `Your booking is confirmed.\nCar: ${carName}\nDates: ${booking.start_date} to ${booking.end_date}\nTotal: ${formattedTotal}\nMy bookings: ${myBookingsUrl}`,
            html: `
              <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#f9fafb; padding:24px;">
                <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">
                  <div style="padding:20px 20px 12px;border-bottom:1px solid #e5e7eb;">
                    <h1 style="margin:0;font-size:20px;line-height:1.2;color:#111827;">Confirmation Receipt</h1>
                    <p style="margin:6px 0 0;color:#374151;font-size:14px;">JP Car Rental</p>
                  </div>
                  <div style="padding:18px 20px;color:#111827;">
                    <p style="margin:0 0 12px;font-size:14px;color:#111827;">Hi ${booking.customer_name}, your booking is confirmed.</p>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr>
                        <td style="padding:10px 0;color:#6b7280;">Car</td>
                        <td style="padding:10px 0;text-align:right;font-weight:700;">${carName}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;color:#6b7280;">Rental dates</td>
                        <td style="padding:10px 0;text-align:right;font-weight:700;">${booking.start_date} → ${booking.end_date}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;color:#6b7280;">Total</td>
                        <td style="padding:10px 0;text-align:right;font-weight:700;">${formattedTotal}</td>
                      </tr>
                    </table>
                    <div style="margin-top:18px;">
                      <a href="${myBookingsUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;font-weight:700;font-size:14px;">
                        View My Bookings
                      </a>
                    </div>
                    <p style="margin:16px 0 0;color:#6b7280;font-size:12px;">If you didn’t make this booking, reply to this email.</p>
                  </div>
                </div>
              </div>
            `,
          })
        : Promise.resolve(),
    ]);

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const myBookingsUrl = `${siteUrl}/account/bookings`;
  const supabase = createAdminClient();
  const { data: car } = await supabase.from("cars").select("name").eq("id", booking.car_id).maybeSingle();
  const carName = String((car as any)?.name ?? booking.car_id);
  const formattedTotal = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(booking.total_price),
  );

  const smsMessage = `JP Car Rental: Booking confirmed for ${booking.customer_name} from ${booking.start_date} to ${booking.end_date}.`;
  await Promise.allSettled([
    sendBookingSms({ to: booking.customer_phone, message: smsMessage }),
    booking.customer_email
      ? sendBookingEmail({
          to: booking.customer_email,
          subject: "JP Car Rental Confirmation Receipt",
          text: `Your booking is confirmed.\nCar: ${carName}\nDates: ${booking.start_date} to ${booking.end_date}\nTotal: ${formattedTotal}\nMy bookings: ${myBookingsUrl}`,
          html: `
            <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#f9fafb; padding:24px;">
              <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">
                <div style="padding:20px 20px 12px;border-bottom:1px solid #e5e7eb;">
                  <h1 style="margin:0;font-size:20px;line-height:1.2;color:#111827;">Confirmation Receipt</h1>
                  <p style="margin:6px 0 0;color:#374151;font-size:14px;">JP Car Rental</p>
                </div>
                <div style="padding:18px 20px;color:#111827;">
                  <p style="margin:0 0 12px;font-size:14px;color:#111827;">Hi ${booking.customer_name}, your booking is confirmed.</p>
                  <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <tr>
                      <td style="padding:10px 0;color:#6b7280;">Car</td>
                      <td style="padding:10px 0;text-align:right;font-weight:700;">${carName}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;color:#6b7280;">Rental dates</td>
                      <td style="padding:10px 0;text-align:right;font-weight:700;">${booking.start_date} → ${booking.end_date}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;color:#6b7280;">Total</td>
                      <td style="padding:10px 0;text-align:right;font-weight:700;">${formattedTotal}</td>
                    </tr>
                  </table>
                  <div style="margin-top:18px;">
                    <a href="${myBookingsUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;font-weight:700;font-size:14px;">
                      View My Bookings
                    </a>
                  </div>
                  <p style="margin:16px 0 0;color:#6b7280;font-size:12px;">If you didn’t make this booking, reply to this email.</p>
                </div>
              </div>
            </div>
          `,
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
