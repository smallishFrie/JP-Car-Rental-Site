"use server";

import { revalidatePath } from "next/cache";
import { reportBookingNotRecognizedFromEmailToken } from "@/lib/bookings";

export async function submitBookingNotMeAction(token: string): Promise<{ ok: boolean; message: string }> {
  const result = await reportBookingNotRecognizedFromEmailToken(token);
  revalidatePath("/admin");
  revalidatePath("/account/bookings");
  return result;
}
