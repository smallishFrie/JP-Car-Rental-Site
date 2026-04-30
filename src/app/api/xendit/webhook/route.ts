import { NextRequest, NextResponse } from "next/server";
import { sendBookingEmail } from "@/lib/notifications/email";
import { sendBookingSms } from "@/lib/notifications/sms";
import { setBookingPaid } from "@/lib/bookings";
import { verifyXenditWebhookToken } from "@/lib/xendit";

type XenditInvoiceWebhookPayload = {
  id?: string;
  external_id?: string;
  status?: string;
};

export async function POST(request: NextRequest) {
  const callbackToken = request.headers.get("x-callback-token");
  if (!verifyXenditWebhookToken(callbackToken)) {
    return NextResponse.json({ error: "Invalid webhook token." }, { status: 401 });
  }

  const payload = (await request.json()) as XenditInvoiceWebhookPayload;
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

  const smsMessage = `JP Car Rental: Booking confirmed for ${booking.customer_name} from ${booking.start_date} to ${booking.end_date}.`;
  await Promise.allSettled([
    sendBookingSms({ to: booking.customer_phone, message: smsMessage }),
    booking.customer_email
      ? sendBookingEmail({
          to: booking.customer_email,
          subject: "JP Car Rental Booking Confirmation",
          text: `Your booking is confirmed.\nCar ID: ${booking.car_id}\nDates: ${booking.start_date} to ${booking.end_date}\nAmount: PHP ${booking.total_price}`,
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
