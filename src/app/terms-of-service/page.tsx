import Link from "next/link";
import RevealOnScroll from "@/app/components/RevealOnScroll";
import SiteHeader from "@/app/components/SiteHeader";

export default function TermsOfServicePage() {
  return (
    <>
      <SiteHeader />
    <main className="legal-page">
      <div className="legal-page-inner">
        <RevealOnScroll>
          <h1 className="page-intro-fade">Terms of Service</h1>
          <p className="legal-meta">Last Updated: May 1, 2026</p>
        </RevealOnScroll>

        <RevealOnScroll>
        <section>
          <h2>1. Rental Agreement</h2>
          <p>
            By booking a vehicle through JP Car Rental, you agree to enter into a rental agreement governed by the laws of
            the Republic of the Philippines.
          </p>
        </section>

        <section>
          <h2>2. Driver Requirements</h2>
          <p>To rent a vehicle, the driver must:</p>
          <ul>
            <li>Be at least 21 years of age.</li>
            <li>Possess a valid Philippine Driver&apos;s License or an International Driver&apos;s Permit.</li>
            <li>Provide a valid government-issued ID for identity verification.</li>
          </ul>
        </section>

        <section>
          <h2>3. Vehicle Use</h2>
          <p>The renter agrees that the vehicle will not be used:</p>
          <ul>
            <li>For any illegal purposes or in violation of traffic laws.</li>
            <li>To carry passengers or property for hire (unless authorized).</li>
            <li>To tow or push any vehicle or trailer.</li>
            <li>By any person under the influence of alcohol or drugs.</li>
            <li>Outside the agreed-upon geographic limits.</li>
          </ul>
        </section>
        </RevealOnScroll>

        <RevealOnScroll>
        <section>
          <h2>4. Fuel and Maintenance</h2>
          <p>
            Vehicles are typically provided with a full tank of fuel and should be returned with a full tank. A refueling
            fee will apply if the vehicle is returned with less fuel than provided. The renter is responsible for basic
            checks (oil, tire pressure) during the rental period.
          </p>
        </section>

        <section>
          <h2>5. Insurance and Liability</h2>
          <p>
            Our vehicles are covered by standard comprehensive insurance. However, the renter may be liable for a
            deductible amount (participation fee) in the event of an accident or damage. The renter is fully responsible
            for any damage caused by negligence or violation of these terms.
          </p>
        </section>

        <section id="cancellation">
          <h2>6. Cancellation and Refunds</h2>
          <p>
            Cancellations made 48 hours or more before the pickup time are eligible for a full refund. Cancellations made
            within 48 hours may be subject to a cancellation fee. &quot;No-shows&quot; are non-refundable.
          </p>
        </section>

        <section>
          <h2>7. Late Fees</h2>
          <p>
            Late returns will be charged an hourly fee. Returns exceeding 3 hours late will be charged a full day&apos;s rental
            rate.
          </p>
        </section>
        </RevealOnScroll>

        <RevealOnScroll>
        <div className="legal-page-footer">
          <Link href="/">&larr; Back to Home</Link>
        </div>
        </RevealOnScroll>
      </div>
    </main>
    </>
  );
}
