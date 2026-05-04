import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createXenditRefund } from "@/lib/xendit";
import { verifyBookingEmailActionToken } from "@/lib/booking-email-token";
import { notifyAdminsSecurityBookingReport } from "@/lib/notifications/booking-admin-events";
import type { BookingRecord, BookingStatus, RefundStatus } from "./booking-model";
import { computeDerivedStatus, formatBookingVehicleName } from "./booking-model";

export type { BookingRecord, BookingStatus, RefundStatus } from "./booking-model";
export { computeDerivedStatus } from "./booking-model";

function toDateOnly(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date value.");
  }
  return parsed.toISOString().slice(0, 10);
}

/** Maps stored payment metadata + payment_reference to Xendit refund API fields. */
export function resolveXenditRefundReference(booking: BookingRecord): {
  paymentReference: string;
  paymentReferenceKind: "payment_request" | "invoice" | "payment_id";
} {
  const meta = (booking.payment_metadata ?? {}) as Record<string, unknown>;
  const data = (meta.data ?? {}) as Record<string, unknown>;
  const pr =
    (typeof data.payment_request_id === "string" && data.payment_request_id) ||
    (typeof meta.payment_request_id === "string" && meta.payment_request_id);
  if (pr) {
    return { paymentReference: pr, paymentReferenceKind: "payment_request" };
  }
  const ref = booking.payment_reference;
  if (!ref) {
    throw new Error("Missing payment reference for refund.");
  }
  if (meta.components_session || meta.payment_session || String(meta.event ?? "").includes("payment_session")) {
    const payId =
      (typeof data.payment_id === "string" && data.payment_id) ||
      (typeof meta.payment_id === "string" && meta.payment_id) ||
      ref;
    return { paymentReference: String(payId), paymentReferenceKind: "payment_id" };
  }
  if (String(ref).startsWith("pr-")) {
    return { paymentReference: ref, paymentReferenceKind: "payment_request" };
  }
  return { paymentReference: ref, paymentReferenceKind: "invoice" };
}

export async function checkCarAvailability(carId: string, startDate: string, endDate: string, excludeBookingId?: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("has_booking_overlap", {
    p_car_id: carId,
    p_start_date: toDateOnly(startDate),
    p_end_date: toDateOnly(endDate),
    p_exclude_booking_id: excludeBookingId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return !Boolean(data);
}

export async function createPendingBooking(input: {
  userId: string;
  carId: string;
  carDisplayName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupLocation: string;
  driverLicenseNumber?: string;
  driverNotes?: string;
}): Promise<BookingRecord> {
  const supabase = await createClient();
  const payload = {
    user_id: input.userId,
    car_id: input.carId,
    car_display_name: input.carDisplayName.trim() || "Vehicle",
    start_date: toDateOnly(input.startDate),
    end_date: toDateOnly(input.endDate),
    total_price: input.totalPrice,
    status: "pending" as BookingStatus,
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    customer_email: input.customerEmail?.trim() || null,
    pickup_location: input.pickupLocation.trim(),
    driver_license_number: input.driverLicenseNumber?.trim() || null,
    driver_notes: input.driverNotes?.trim() || null,
    payment_provider: "xendit",
    payment_status: "unpaid",
  };

  const { data, error } = await supabase.from("bookings").insert(payload).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create booking.");
  }
  return data as BookingRecord;
}

export async function attachPaymentReference(bookingId: string, paymentReference: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ payment_reference: paymentReference })
    .eq("id", bookingId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function setBookingPaid(input: {
  bookingId: string;
  paymentReference: string;
  paymentMetadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase.from("bookings").select("*").eq("id", input.bookingId).single();
  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "Booking not found.");
  }

  const booking = existing as BookingRecord;
  const nextStatus = computeDerivedStatus({
    currentStatus: booking.status,
    paymentStatus: "paid",
    startDate: booking.start_date,
    endDate: booking.end_date,
  });

  const { data, error } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      payment_reference: input.paymentReference,
      payment_metadata: input.paymentMetadata ?? {},
      paid_at: new Date().toISOString(),
      status: nextStatus,
    })
    .eq("id", input.bookingId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update booking payment.");
  }
  return data as BookingRecord;
}

export async function syncDerivedStatusForBooking(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (error || !data) {
    throw new Error(error?.message ?? "Booking not found.");
  }

  const booking = data as BookingRecord;
  const nextStatus = computeDerivedStatus({
    currentStatus: booking.status,
    paymentStatus: booking.payment_status,
    startDate: booking.start_date,
    endDate: booking.end_date,
  });

  if (nextStatus === booking.status) {
    return booking;
  }

  const prevStatus = booking.status;

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: nextStatus })
    .eq("id", bookingId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to sync booking status.");
  }

  if (nextStatus === "completed" && prevStatus === "active" && booking.car_id) {
    const admin = createAdminClient();
    const { error: carErr } = await admin.from("cars").update({ pending_turnover: true }).eq("id", booking.car_id);
    if (carErr) {
      throw new Error(carErr.message);
    }
  }

  return updated as BookingRecord;
}

async function markCarPendingTurnoverIfNeeded(
  admin: ReturnType<typeof createAdminClient>,
  carId: string | null | undefined,
  prevStatus: BookingStatus,
  nextStatus: BookingStatus,
) {
  if (nextStatus === "completed" && prevStatus === "active" && carId) {
    const { error } = await admin.from("cars").update({ pending_turnover: true }).eq("id", carId);
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function syncStaleDerivedStatusesForUserBookings(userId: string): Promise<{ updated: number }> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "upcoming", "active"]);
  if (error) {
    throw new Error(error.message);
  }

  let updated = 0;
  for (const row of rows ?? []) {
    const booking = row as BookingRecord;
    const nextStatus = computeDerivedStatus({
      currentStatus: booking.status,
      paymentStatus: booking.payment_status,
      startDate: booking.start_date,
      endDate: booking.end_date,
    });
    if (nextStatus === booking.status) {
      continue;
    }

    const prevStatus = booking.status;
    const { data: updatedRow, error: updateError } = await admin
      .from("bookings")
      .update({ status: nextStatus })
      .eq("id", booking.id)
      .eq("status", booking.status)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedRow) {
      continue;
    }
    updated += 1;
    await markCarPendingTurnoverIfNeeded(admin, booking.car_id, prevStatus, nextStatus);
  }

  return { updated };
}

export async function syncStaleDerivedStatusesForAllBookings(): Promise<{ updated: number }> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin.from("bookings").select("*").in("status", ["pending", "upcoming", "active"]);
  if (error) {
    throw new Error(error.message);
  }

  let updated = 0;
  for (const row of rows ?? []) {
    const booking = row as BookingRecord;
    const nextStatus = computeDerivedStatus({
      currentStatus: booking.status,
      paymentStatus: booking.payment_status,
      startDate: booking.start_date,
      endDate: booking.end_date,
    });
    if (nextStatus === booking.status) {
      continue;
    }

    const prevStatus = booking.status;
    const { data: updatedRow, error: updateError } = await admin
      .from("bookings")
      .update({ status: nextStatus })
      .eq("id", booking.id)
      .eq("status", booking.status)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedRow) {
      continue;
    }
    updated += 1;
    await markCarPendingTurnoverIfNeeded(admin, booking.car_id, prevStatus, nextStatus);
  }

  return { updated };
}

const DISPUTE_REASON = "Customer reported unrecognized booking via secure email link.";

async function notifySecurityAdminsForBooking(bookingId: string) {
  const admin = createAdminClient();
  const { data: latest } = await admin.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (!latest) {
    return;
  }
  const b = latest as BookingRecord;
  const { data: car } =
    b.car_id != null
      ? await admin.from("cars").select("name").eq("id", b.car_id).maybeSingle()
      : { data: null };
  const carName = formatBookingVehicleName({ ...b, car: car as { name: string } | null });
  await notifyAdminsSecurityBookingReport(b, carName);
}

export async function reportBookingNotRecognizedFromEmailToken(token: string): Promise<
  | { ok: true; message: string }
  | { ok: false; message: string }
> {
  const verified = verifyBookingEmailActionToken(token);
  if (!verified.ok) {
    return { ok: false, message: verified.reason };
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin.from("bookings").select("*").eq("id", verified.bookingId).maybeSingle();
  if (error) {
    return { ok: false, message: error.message };
  }
  if (!row) {
    return { ok: false, message: "Booking not found." };
  }

  const booking = row as BookingRecord;
  if (booking.dispute_reported_at) {
    return { ok: true, message: "We already received a report for this booking. Our team will follow up if needed." };
  }

  const now = new Date().toISOString();

  if (booking.status === "canceled") {
    await admin.from("bookings").update({ dispute_reported_at: now }).eq("id", booking.id);
    await notifySecurityAdminsForBooking(booking.id);
    return { ok: true, message: "This booking is already canceled. We’ve logged your report." };
  }

  if (booking.status === "pending" && booking.payment_status === "unpaid") {
    const { error: upErr } = await admin
      .from("bookings")
      .update({
        status: "canceled",
        canceled_at: now,
        dispute_reported_at: now,
        refund_status: "not_applicable",
      })
      .eq("id", booking.id)
      .eq("status", "pending");
    if (upErr) {
      return { ok: false, message: upErr.message };
    }
    await notifySecurityAdminsForBooking(booking.id);
    return {
      ok: true,
      message: "We’ve canceled this unpaid hold and flagged it for review. If anything still looks wrong, contact us from our website.",
    };
  }

  if (booking.payment_status === "paid" && (booking.status === "upcoming" || booking.status === "active")) {
    const { error: upErr } = await admin
      .from("bookings")
      .update({
        status: "cancel_requested",
        cancellation_reason: DISPUTE_REASON,
        dispute_reported_at: now,
      })
      .eq("id", booking.id)
      .in("status", ["upcoming", "active"]);
    if (upErr) {
      return { ok: false, message: upErr.message };
    }
    await notifySecurityAdminsForBooking(booking.id);
    return {
      ok: true,
      message:
        "Thanks — we’ve placed a cancellation request on this reservation and notified our team. You’ll get updates by SMS or email once it’s processed.",
    };
  }

  if (booking.status === "cancel_requested") {
    await admin
      .from("bookings")
      .update({ dispute_reported_at: now, cancellation_reason: booking.cancellation_reason ?? DISPUTE_REASON })
      .eq("id", booking.id);
    await notifySecurityAdminsForBooking(booking.id);
    return { ok: true, message: "We’ve added your report to this cancellation request." };
  }

  await admin.from("bookings").update({ dispute_reported_at: now }).eq("id", booking.id);
  await notifySecurityAdminsForBooking(booking.id);
  return { ok: true, message: "We’ve logged your report and our team will review it." };
}

export async function listBookingsForAdmin() {
  await syncStaleDerivedStatusesForAllBookings();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      car:cars (
        id,
        name,
        category
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ??[]) as Array<BookingRecord & { car: { id: string; name: string; category: string } | null }>;
}

export async function listBookingsForUser(userId: string) {
  await syncStaleDerivedStatusesForUserBookings(userId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      car:cars (
        id,
        name,
        category
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ??[]) as Array<BookingRecord & { car: { id: string; name: string; category: string } | null }>;
}

export async function cleanupExpiredPendingBookings() {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const canceledAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "canceled", canceled_at: canceledAt, refund_status: "not_applicable" })
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .lte("created_at", cutoff)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return { cleaned: rows.length, canceledIds: rows.map((r) => r.id) };
}

export async function cancelPendingUnpaidBookingForUser(bookingId: string, userId: string) {
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "Booking not found.");
  }

  const booking = existing as BookingRecord;
  if (booking.status !== "pending" || booking.payment_status !== "unpaid") {
    throw new Error("Only pending unpaid bookings can be canceled directly.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .update({ status: "canceled", canceled_at: new Date().toISOString(), refund_status: "not_applicable" })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to cancel booking.");
  }

  return data as BookingRecord;
}

const MAX_CANCELLATION_REASON_LENGTH = 2000;

export async function requestBookingCancellationForUser(
  bookingId: string,
  userId: string,
  cancellationReason?: string | null,
) {
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "Booking not found.");
  }

  const booking = existing as BookingRecord;
  const derived = computeDerivedStatus({
    currentStatus: booking.status,
    paymentStatus: booking.payment_status,
    startDate: booking.start_date,
    endDate: booking.end_date,
  });

  if (derived !== "upcoming") {
    throw new Error("Only upcoming bookings can request cancellation.");
  }

  const reason =
    cancellationReason === undefined || cancellationReason === null
      ? null
      : cancellationReason.trim().slice(0, MAX_CANCELLATION_REASON_LENGTH) || null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .update({ status: "cancel_requested", cancellation_reason: reason })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to request cancellation.");
  }

  return data as BookingRecord;
}

export async function confirmCancellationForAdmin(bookingId: string, refundAmountPhpInput: number) {
  const admin = createAdminClient();
  const amount = Number(Number(refundAmountPhpInput).toFixed(2));
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Refund amount must be a valid non-negative number.");
  }

  const { data: preRow, error: preErr } = await admin.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (preErr) {
    throw new Error(preErr.message);
  }
  if (!preRow) {
    throw new Error("Booking not found.");
  }

  const pre = preRow as BookingRecord;
  if (pre.status === "canceled") {
    return pre;
  }
  if (pre.status !== "cancel_requested") {
    throw new Error("Only cancel requested bookings can be confirmed.");
  }

  if (amount > Number(pre.total_price)) {
    throw new Error("Refund amount cannot exceed the booking total.");
  }

  const paid = pre.payment_status === "paid" && Boolean(pre.payment_reference);
  const willCallXendit = paid && amount > 0;

  const { data: claimed, error: claimErr } = await admin
    .from("bookings")
    .update({
      refund_status: willCallXendit ? "pending" : "not_applicable",
      refund_amount_php: amount,
    })
    .eq("id", bookingId)
    .eq("status", "cancel_requested")
    .or("refund_status.is.null,refund_status.eq.none,refund_status.eq.failed")
    .select("*")
    .maybeSingle();

  if (claimErr) {
    throw new Error(claimErr.message);
  }

  if (!claimed) {
    const { data: cur } = await admin.from("bookings").select("*").eq("id", bookingId).single();
    const b = cur as BookingRecord;
    if (b.status === "canceled") {
      return b;
    }
    if (b.status === "cancel_requested" && b.refund_status === "pending") {
      throw new Error("This cancellation is already being processed. Please refresh.");
    }
    throw new Error("Unable to confirm cancellation. Please refresh and try again.");
  }

  const booking = claimed as BookingRecord;
  const canceledAt = new Date().toISOString();

  if (willCallXendit) {
    try {
      const { paymentReference, paymentReferenceKind } = resolveXenditRefundReference(booking);
      const refund = await createXenditRefund({
        bookingId: booking.id,
        amountPhp: amount,
        paymentReference,
        paymentReferenceKind,
        reason: "CANCELLATION",
      });
      const metadata = { ...(booking.payment_metadata ?? {}), refund } as Record<string, unknown>;
      const { data: finalized, error: finErr } = await admin
        .from("bookings")
        .update({
          status: "canceled",
          canceled_at: canceledAt,
          payment_metadata: metadata,
        })
        .eq("id", bookingId)
        .eq("status", "cancel_requested")
        .select("*")
        .single();
      if (finErr || !finalized) {
        throw new Error(finErr?.message ?? "Failed to finalize cancellation.");
      }
      return finalized as BookingRecord;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Refund failed.";
      const metadata = { ...(booking.payment_metadata ?? {}), refund_last_error: message } as Record<string, unknown>;
      await admin.from("bookings").update({ refund_status: "failed", payment_metadata: metadata }).eq("id", bookingId);
      throw new Error(message);
    }
  }

  const { data: finalized, error: finErr } = await admin
    .from("bookings")
    .update({ status: "canceled", canceled_at: canceledAt })
    .eq("id", bookingId)
    .eq("status", "cancel_requested")
    .select("*")
    .single();
  if (finErr || !finalized) {
    throw new Error(finErr?.message ?? "Failed to confirm cancellation.");
  }
  return finalized as BookingRecord;
}

export async function getBookingByPaymentReference(paymentReference: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("payment_reference", paymentReference)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as BookingRecord | null) ?? null;
}