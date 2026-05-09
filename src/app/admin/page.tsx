import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminCarManager from "@/app/admin/AdminCarManager";
import AdminBookingManager from "@/app/admin/AdminBookingManager";
import AdminDropoffLocationManager from "@/app/admin/AdminDropoffLocationManager";
import AdminContactManager from "@/app/admin/AdminContactManager";
import AdminReviewManager from "@/app/admin/AdminReviewManager";
import AdminTabs from "@/app/admin/AdminTabs";
import AdminAnalytics from "@/app/admin/AdminAnalytics";
import { bookingStatusBlocksCarDelete } from "@/lib/booking-model";
import { listBookingsForAdmin } from "@/lib/bookings";
import { listCarsForAdmin, requireAdmin } from "@/lib/cars";
import { listDropoffLocations } from "@/lib/dropoff-locations";
import { listContactOptionsForAdmin } from "@/lib/contact-options";
import { listReviewsForAdmin } from "@/lib/reviews";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminPage(props: Props) {
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
  let dropoffLocations: Awaited<ReturnType<typeof listDropoffLocations>> = [];
  let reviews: Awaited<ReturnType<typeof listReviewsForAdmin>> = [];
  let contactOptions: Awaited<ReturnType<typeof listContactOptionsForAdmin>> = [];
  try {
    cars = await listCarsForAdmin();
    bookings = await listBookingsForAdmin();
    dropoffLocations = await listDropoffLocations();
    reviews = await listReviewsForAdmin();
    contactOptions = await listContactOptionsForAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cars.";
    if (message.includes("contact_options") || (message.includes("relation") && message.includes("contact_options"))) {
      redirect("/?message=Please run supabase/contact_options_setup.sql first.");
    }
    if (message.includes("Could not find the table") || (message.includes("relation") && message.includes("cars"))) {
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

  const resolvedSearchParams = await props.searchParams;
  const tab = resolvedSearchParams.tab || "analytics";

  return (
    <main className="auth-main auth-main--no-site-header">
      <section className="auth-shell auth-shell--admin">
        <h1 className="admin-page-heading">Admin panel</h1>

        <Suspense fallback={null}>
          <AdminTabs />
        </Suspense>

        {tab === "analytics" && (
          <AdminAnalytics bookings={bookings} cars={carsWithBookingCounts} />
        )}
        {tab === "cars" && <AdminCarManager initialCars={carsWithBookingCounts} />}
        {tab === "reviews" && <AdminReviewManager initialReviews={reviews} initialCars={cars} />}
        {tab === "locations" && <AdminDropoffLocationManager initialLocations={dropoffLocations} />}
        {tab === "contacts" && <AdminContactManager initialOptions={contactOptions} />}
        {tab === "bookings" && <AdminBookingManager initialBookings={bookings} />}

        <p className="auth-back-link">
          <Link href="/">← Back to home</Link>
        </p>
      </section>
    </main>
  );
}
