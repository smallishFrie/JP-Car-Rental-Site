import "server-only";

import type { BookingRecord } from "@/lib/booking-model";
import { adminEventEmailHtml, notifyAdmins } from "@/lib/notifications/admin-notify";

function moneyPhp(n: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);
}

export async function notifyAdminsPendingBookingCreated(booking: BookingRecord, carName: string) {
  const total = moneyPhp(Number(booking.total_price));
  const html = adminEventEmailHtml("New booking (pending payment)", [
    { label: "Booking ID", value: booking.id },
    { label: "Customer", value: booking.customer_name },
    { label: "Vehicle", value: carName },
    { label: "Dates", value: `${booking.start_date} → ${booking.end_date}` },
    { label: "Total", value: total },
  ]);
  await notifyAdmins({
    subject: `JP Car Rental — new checkout ${booking.id.slice(0, 8)}…`,
    text: `A customer started checkout (pending payment).\nID: ${booking.id}\nCustomer: ${booking.customer_name}\nCar: ${carName}\nDates: ${booking.start_date} to ${booking.end_date}\nTotal: ${total}`,
    html,
  });
}

export async function notifyAdminsPendingBookingCanceled(booking: BookingRecord, carName: string) {
  const html = adminEventEmailHtml("Booking canceled (unpaid)", [
    { label: "Booking ID", value: booking.id },
    { label: "Customer", value: booking.customer_name },
    { label: "Vehicle", value: carName },
    { label: "Dates", value: `${booking.start_date} → ${booking.end_date}` },
  ]);
  await notifyAdmins({
    subject: `JP Car Rental — unpaid booking canceled ${booking.id.slice(0, 8)}…`,
    text: `Customer canceled an unpaid pending booking.\nID: ${booking.id}\nCustomer: ${booking.customer_name}\nCar: ${carName}`,
    html,
  });
}

export async function notifyAdminsCancellationRequested(booking: BookingRecord, carName: string) {
  const html = adminEventEmailHtml("Cancellation requested", [
    { label: "Booking ID", value: booking.id },
    { label: "Customer", value: booking.customer_name },
    { label: "Vehicle", value: carName },
    { label: "Dates", value: `${booking.start_date} → ${booking.end_date}` },
    { label: "Customer note", value: booking.cancellation_reason?.trim() || "—" },
  ]);
  await notifyAdmins({
    subject: `JP Car Rental — cancel request ${booking.id.slice(0, 8)}…`,
    text: `Customer requested cancellation.\nID: ${booking.id}\nCustomer: ${booking.customer_name}\nCar: ${carName}\nNote: ${booking.cancellation_reason ?? "—"}`,
    html,
  });
}

export async function notifyAdminsSecurityBookingReport(booking: BookingRecord, carName: string) {
  const html = adminEventEmailHtml("Security: “This wasn’t me” report", [
    { label: "Booking ID", value: booking.id },
    { label: "Customer", value: booking.customer_name },
    { label: "Vehicle", value: carName },
    { label: "Status", value: booking.status },
    { label: "Payment", value: booking.payment_status },
  ]);
  await notifyAdmins({
    subject: `JP Car Rental — SECURITY report ${booking.id.slice(0, 8)}…`,
    text: `Customer used the email security link.\nID: ${booking.id}\nStatus: ${booking.status}\nPayment: ${booking.payment_status}\nCar: ${carName}`,
    html,
  });
}
