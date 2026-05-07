import { notFound, redirect } from "next/navigation";
import CheckoutResultClient from "@/app/checkout/[bookingId]/result/CheckoutResultClient";
import type { BookingRecord } from "@/lib/booking-model";
import { getCarById } from "@/lib/cars";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ outcome?: string; reason?: string }>;
};

function normalizeOutcome(raw: string | undefined): "success" | "canceled" | "failed" | "unknown" {
  const v = String(raw ?? "").toLowerCase();
  if (v === "success") return "success";
  if (v === "canceled" || v === "cancelled") return "canceled";
  if (v === "failed" || v === "error") return "failed";
  return "unknown";
}

export default async function CheckoutResultPage({ params, searchParams }: PageProps) {
  const { bookingId } = await params;
  const id = String(bookingId ?? "").trim();
  if (!id) {
    notFound();
  }

  const sp = await searchParams;
  const outcome = normalizeOutcome(sp.outcome);
  let reason: string | null = null;
  if (sp.reason) {
    try {
      reason = decodeURIComponent(String(sp.reason));
    } catch {
      reason = String(sp.reason);
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/checkout/${id}/result?outcome=${outcome}`)}`);
  }

  const { data: booking } = await supabase.from("bookings").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!booking) {
    notFound();
  }

  const row = booking as BookingRecord;
  const carId = row.car_id;
  const car = carId ? await getCarById(carId) : null;
  const carName = car?.name ?? row.car_display_name?.trim() ?? "Vehicle";

  return (
    <main className="auth-main auth-main--no-site-header">
      <CheckoutResultClient
        outcome={outcome}
        bookingId={id}
        carName={carName}
        startDate={String(row.start_date)}
        endDate={String(row.end_date)}
        totalPrice={Number(row.total_price)}
        basePrice={Number(row.base_price ?? row.total_price)}
        dropoffFee={Number(row.dropoff_fee ?? 0)}
        pickupLocation={String(row.pickup_location)}
        dropoffLocation={String(row.dropoff_location ?? "")}
        reason={reason}
      />
    </main>
  );
}
