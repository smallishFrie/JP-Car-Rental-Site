import { notFound } from "next/navigation";
import CheckoutClient from "@/app/checkout/[bookingId]/CheckoutClient";
import { getCarById } from "@/lib/cars";
import type { BookingRecord } from "@/lib/booking-model";
import { createClient } from "@/lib/supabase/server";

type CheckoutPageProps = {
  params: Promise<{ bookingId: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { bookingId } = await params;
  const id = String(bookingId ?? "").trim();
  if (!id) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
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
      <CheckoutClient
        bookingId={id}
        carName={carName}
        startDate={String(row.start_date)}
        endDate={String(row.end_date)}
        totalPrice={Number(row.total_price)}
        basePrice={Number(row.base_price ?? row.total_price)}
        dropoffFee={Number(row.dropoff_fee ?? 0)}
        pickupLocation={String(row.pickup_location)}
        dropoffLocation={String(row.dropoff_location ?? "")}
        customerName={String(row.customer_name)}
        customerEmail={String(row.customer_email ?? "") || null}
      />
    </main>
  );
}

