import "server-only";

import { canSignBookingEmailActions, signBookingEmailActionToken } from "@/lib/booking-email-token";
import type { BookingRecord } from "@/lib/booking-model";
import { formatBookingVehicleName } from "@/lib/booking-model";
import { adminEventEmailHtml, notifyAdmins } from "@/lib/notifications/admin-notify";
import { buildBookingConfirmationEmailHtml, buildBookingConfirmationEmailText } from "@/lib/notifications/booking-emails";
import { sendBookingEmail } from "@/lib/notifications/email";
import { sendBookingSms } from "@/lib/notifications/sms";
import { createAdminClient } from "@/lib/supabase/admin";

async function carLabelForBookingReceipt(booking: BookingRecord) {
  const supabase = createAdminClient();
  const { data: car } =
    booking.car_id != null
      ? await supabase.from("cars").select("name").eq("id", booking.car_id).maybeSingle()
      : { data: null };
  return formatBookingVehicleName({ ...booking, car: car as { name: string } | null });
}

export async function notifyAfterBookingPaid(booking: BookingRecord) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const myBookingsUrl = `${siteUrl}/account/bookings`;
  const carName = await carLabelForBookingReceipt(booking);
  const formattedTotal = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(booking.total_price),
  );

  let notMeUrl: string | null = null;
  try {
    if (canSignBookingEmailActions()) {
      const token = signBookingEmailActionToken(booking.id);
      notMeUrl = `${siteUrl.replace(/\/+$/, "")}/booking-not-me?t=${encodeURIComponent(token)}`;
    }
  } catch {
    notMeUrl = null;
  }

  const emailInput = {
    customerName: booking.customer_name,
    carName,
    startDate: booking.start_date,
    endDate: booking.end_date,
    formattedTotal,
    myBookingsUrl,
    notMeUrl,
  };

  const smsMessage = `JP Car Rental: Booking confirmed for ${booking.customer_name} from ${booking.start_date} to ${booking.end_date}.`;

  const driverNotes = booking.driver_notes?.trim() || "";
  const adminHtml = adminEventEmailHtml("Paid booking confirmed", [
    { label: "Booking ID", value: booking.id },
    { label: "Customer", value: booking.customer_name },
    { label: "Vehicle", value: carName },
    { label: "Dates", value: `${booking.start_date} → ${booking.end_date}` },
    { label: "Total", value: formattedTotal },
    ...(driverNotes ? [{ label: "Driver notes", value: driverNotes }] : []),
  ]);

  await Promise.allSettled([
    sendBookingSms({ to: booking.customer_phone, message: smsMessage }),
    booking.customer_email
      ? sendBookingEmail({
          to: booking.customer_email,
          subject: "Your JP Car Rental booking is confirmed",
          text: buildBookingConfirmationEmailText(emailInput),
          html: buildBookingConfirmationEmailHtml(emailInput),
        })
      : Promise.resolve(),
    notifyAdmins({
      subject: `JP Car Rental — paid booking ${booking.id.slice(0, 8)}…`,
      text: `Paid booking confirmed.\nID: ${booking.id}\nCustomer: ${booking.customer_name}\nCar: ${carName}\nDates: ${booking.start_date} to ${booking.end_date}\nTotal: ${formattedTotal}${driverNotes ? `\nDriver notes: ${driverNotes}` : ""}`,
      html: adminHtml,
    }),
  ]);
}
