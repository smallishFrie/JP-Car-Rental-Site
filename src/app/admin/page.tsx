import Link from "next/link";
import { redirect } from "next/navigation";
import AdminCarManager from "@/app/admin/AdminCarManager";
import AdminBookingManager from "@/app/admin/AdminBookingManager";
import { bookingStatusBlocksCarDelete } from "@/lib/booking-model";
import { listBookingsForAdmin } from "@/lib/bookings";
import { listCarsForAdmin, requireAdmin } from "@/lib/cars";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function AdminPage() {
  if (!hasSupabaseEnv()) {
    redirect("/auth?message=Supabase environment variables are not configured yet.");
  }

  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    if (message === "Please sign in first.") {
      redirect("/auth?message=Please sign in first.");
    }
    redirect("/?message=Unauthorized");
  }

  let cars: Awaited<ReturnType<typeof listCarsForAdmin>> = [];
  let bookings: Awaited<ReturnType<typeof listBookingsForAdmin>> = [];
  try {
    cars = await listCarsForAdmin();
    bookings = await listBookingsForAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cars.";
    if (message.includes("Could not find the table") || message.includes("relation") && message.includes("cars")) {
      redirect("/?message=Please run supabase/admin_cars_setup.sql first.");
    }
    throw error;
  }

  const bookingCountByCarId = bookings.reduce<Record<string, number>>((acc, booking) => {
    const carKey = booking.car_id;
    if (!carKey || !bookingStatusBlocksCarDelete(booking.status)) {
      return acc;
    }
    acc[carKey] = (acc[carKey] ?? 0) + 1;
    return acc;
  }, {});

  const carsWithBookingCounts = cars.map((car) => ({
    ...car,
    booking_count: bookingCountByCarId[car.id] ?? 0,
  }));

  return (
    <main className="auth-main auth-main--no-site-header">
      <section className="auth-shell">
        <h1 className="admin-page-heading">Admin panel</h1>
        <AdminCarManager initialCars={carsWithBookingCounts} />
        <AdminBookingManager initialBookings={bookings} />
        <p className="auth-back-link">
          <Link href="/">← Back to home</Link>
        </p>
      </section>
    </main>
  );
}
