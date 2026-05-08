import Link from "next/link";
import { notFound } from "next/navigation";
import CarDetailClient from "@/app/components/CarDetailClient";
import { getCarById } from "@/lib/cars";
import { listDropoffLocations } from "@/lib/dropoff-locations";
import { listReviewsForCar } from "@/lib/reviews";

type CarDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const { id } = await params;
  const car = await getCarById(id);
  const dropoffLocations = await listDropoffLocations();
  const reviews = await listReviewsForCar(id, 6);

  if (!car) {
    notFound();
  }

  return (
    <main className="car-page-main car-page-main--no-site-header">
      <section className="car-page-shell">
        <p className="car-page-back">
          <Link href="/#available-cars-header">← Back to cars</Link>
        </p>
        <CarDetailClient car={car} dropoffLocations={dropoffLocations} reviews={reviews} />
      </section>
    </main>
  );
}
