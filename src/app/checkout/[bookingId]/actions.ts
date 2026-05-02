"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { attachPaymentReference } from "@/lib/bookings";
import { createXenditComponentsPaymentSession } from "@/lib/xendit";

type InitCheckoutComponentsResult =
  | { ok: true; nextUrl?: string; componentsSdkKey?: string }
  | { ok: false; message: string; redirectTo?: string };

export async function initCheckoutComponentsSessionAction(input: {
  bookingId: string;
  origin: string;
}): Promise<InitCheckoutComponentsResult> {
  try {
    const bookingId = String(input.bookingId ?? "").trim();
    const origin = String(input.origin ?? "").trim();
    if (!bookingId) {
      throw new Error("Booking id is required.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        ok: false,
        message: "Please sign in to continue.",
        redirectTo: `/auth/sign-in?returnTo=${encodeURIComponent(`/checkout/${bookingId}`)}`,
      };
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();
    if (error || !booking) {
      throw new Error(error?.message ?? "Booking not found.");
    }

    if (String((booking as any).payment_status) === "paid") {
      return { ok: true, nextUrl: "/account/bookings" };
    }

    const totalPrice = Number((booking as any).total_price);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      throw new Error("Invalid booking price.");
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const requestedOrigin = origin || siteUrl;
    const normalizedOrigin = requestedOrigin.replace(/\/+$/, "");
    if (!normalizedOrigin.toLowerCase().startsWith("https://")) {
      return {
        ok: false,
        message:
          "Embedded checkout requires HTTPS. Please run the site on an HTTPS domain (e.g. deploy preview or use an HTTPS tunnel) and try again.",
      };
    }
    const origins = [normalizedOrigin];
    const session = await createXenditComponentsPaymentSession({
      bookingId,
      amountPhp: totalPrice,
      customerName: String((booking as any).customer_name ?? ""),
      customerEmail: String((booking as any).customer_email ?? "") || undefined,
      customerPhone: String((booking as any).customer_phone ?? "") || undefined,
      origins,
    });

    await attachPaymentReference(bookingId, session.paymentSessionId);
    await supabase
      .from("bookings")
      .update({
        payment_metadata: {
          ...(booking as any).payment_metadata,
          components_session: session.raw,
        },
      })
      .eq("id", bookingId)
      .eq("user_id", user.id);

    revalidatePath(`/checkout/${bookingId}`);
    return { ok: true, componentsSdkKey: session.componentsSdkKey };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Failed to start payment." };
  }
}
