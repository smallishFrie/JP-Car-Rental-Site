"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cancelPendingUnpaidBookingForUser, requestBookingCancellationForUser } from "@/lib/bookings";

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

  await cancelPendingUnpaidBookingForUser(id, userId);
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

  await requestBookingCancellationForUser(id, userId, cancellationReason);
  revalidatePath("/account/bookings");
  revalidatePath("/admin");
}
