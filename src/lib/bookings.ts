import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const bookingStatuses =["pending", "upcoming", "active", "completed", "cancel_requested", "canceled"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export type BookingRecord = {
  id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: BookingStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  pickup_location: string;
  driver_license_number: string | null;
  driver_notes: string | null;
  payment_provider: string;
  payment_reference: string | null;
  payment_status: string;
  payment_metadata: Record<string, unknown> | null;
  canceled_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

function toDateOnly(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date value.");
  }
  return parsed.toISOString().slice(0, 10);
}

export function computeDerivedStatus(input: {
  currentStatus: BookingStatus;
  paymentStatus: string;
  startDate: string;
  endDate: string;
  now?: Date;
}): BookingStatus {
  if (input.currentStatus === "canceled" || input.currentStatus === "cancel_requested") {
    return input.currentStatus;
  }

  if (input.paymentStatus !== "paid") {
    return "pending";
  }

  const now = input.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const start = toDateOnly(input.startDate);
  const end = toDateOnly(input.endDate);

  if (today < start) {
    return "upcoming";
  }
  if (today > end) {
    return "completed";
  }
  return "active";
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

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: nextStatus })
    .eq("id", bookingId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to sync booking status.");
  }

  return updated as BookingRecord;
}

export async function listBookingsForAdmin() {
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
    .update({ status: "canceled", canceled_at: canceledAt })
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .lte("created_at", cutoff)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return { cleaned: data?.length ?? 0 };
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

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to cancel booking.");
  }

  return data as BookingRecord;
}

export async function requestBookingCancellationForUser(bookingId: string, userId: string) {
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

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancel_requested" })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to request cancellation.");
  }

  return data as BookingRecord;
}

export async function confirmCancellationForAdmin(bookingId: string) {
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "Booking not found.");
  }

  const booking = existing as BookingRecord;
  if (booking.status !== "cancel_requested") {
    throw new Error("Only cancel requested bookings can be confirmed.");
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to confirm cancellation.");
  }
  return data as BookingRecord;
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