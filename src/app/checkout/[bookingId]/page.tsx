import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "@/app/checkout/[bookingId]/CheckoutClient";
import { getCarById } from "@/lib/cars";

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

  const car = await getCarById(String((booking as any).car_id));

  return (
    <main className="auth-main">
      <CheckoutClient
        bookingId={id}
        carName={car?.name ?? String((booking as any).car_id)}
        startDate={String((booking as any).start_date)}
        endDate={String((booking as any).end_date)}
        totalPrice={Number((booking as any).total_price)}
        customerName={String((booking as any).customer_name)}
        customerEmail={String((booking as any).customer_email ?? "") || null}
      />
    </main>
  );
}

