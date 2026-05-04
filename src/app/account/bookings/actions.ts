"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cancelPendingUnpaidBookingForUser, requestBookingCancellationForUser } from "@/lib/bookings";
import { formatBookingVehicleName } from "@/lib/booking-model";
import { notifyAdminsCancellationRequested, notifyAdminsPendingBookingCanceled } from "@/lib/notifications/booking-admin-events";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please sign in first.");
  }

  return user.id;
}

export async function cancelPendingBookingAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Booking id is required.");
  }

  const canceled = await cancelPendingUnpaidBookingForUser(id, userId);
  const carName = formatBookingVehicleName({ ...canceled, car: null });
  void notifyAdminsPendingBookingCanceled(canceled, carName).catch(() => undefined);
  revalidatePath("/account/bookings");
  revalidatePath("/admin");
}

export async function requestCancellationAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Booking id is required.");
  }

  const cancellationReason = String(formData.get("cancellationReason") ?? "").trim() || null;

  const updated = await requestBookingCancellationForUser(id, userId, cancellationReason);
  const carName = formatBookingVehicleName({ ...updated, car: null });
  void notifyAdminsCancellationRequested(updated, carName).catch(() => undefined);
  revalidatePath("/account/bookings");
  revalidatePath("/admin");
}
