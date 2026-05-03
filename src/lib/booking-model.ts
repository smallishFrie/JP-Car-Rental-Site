/** Pure booking types and helpers — safe to import from Client Components (no Supabase / next/headers). */

export const bookingStatuses = ["pending", "upcoming", "active", "completed", "cancel_requested", "canceled"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

/** Bookings in these states still need the car row; car delete is blocked until resolved. */
export const BOOKING_STATUSES_BLOCKING_CAR_DELETE = ["pending", "upcoming", "active", "cancel_requested"] as const;

export function bookingStatusBlocksCarDelete(status: BookingStatus): boolean {
  return (BOOKING_STATUSES_BLOCKING_CAR_DELETE as readonly string[]).includes(status);
}

export const refundStatuses = ["none", "pending", "succeeded", "failed", "not_applicable"] as const;
export type RefundStatus = (typeof refundStatuses)[number];

export type BookingRecord = {
  id: string;
  user_id: string;
  car_id: string | null;
  /** Snapshot of car name at booking time; shown after car is deleted (car_id null). */
  car_display_name?: string | null;
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
  refund_status?: RefundStatus;
  refund_amount_php?: number | null;
  cancellation_reason?: string | null;
  canceled_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export function formatBookingVehicleName(
  booking: Pick<BookingRecord, "car_id" | "car_display_name"> & { car?: { name: string } | null },
): string {
  const fromJoin = booking.car?.name?.trim();
  if (fromJoin) return fromJoin;
  const snapshot = booking.car_display_name?.trim();
  if (snapshot) return snapshot;
  const id = booking.car_id?.trim();
  if (id) return id;
  return "Vehicle removed from fleet";
}

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
