import Link from "next/link";
import RevealOnScroll from "@/app/components/RevealOnScroll";

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page privacy-policy-page">
      <div className="legal-page-inner privacy-policy-inner">
        <RevealOnScroll>
          <section className="privacy-policy-hero">
            <p className="privacy-policy-kicker">JP Car Rental</p>
            <h1 className="page-intro-fade">Privacy Policy</h1>
            <p className="legal-meta">Last Updated: May 6, 2026</p>
            <p className="privacy-policy-summary">
              Your trust matters to us. This page explains what information we collect, how we use it, and how we
              protect it when you book and manage rentals with JP Car Rental.
            </p>
          </section>
        </RevealOnScroll>

        <RevealOnScroll>
        <section className="privacy-policy-card">
          <h2>1. Introduction</h2>
          <p>
            JP Car Rental (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how
            we collect, use, disclose, and safeguard your information when you visit our website and use our car rental
            services in compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the
            Philippines.
          </p>
        </section>

        <section className="privacy-policy-card">
          <h2>2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when booking a car, including:</p>
          <ul>
            <li>
              <strong>Identity Data:</strong> Full name, date of birth, and driver&apos;s license number.
            </li>
            <li>
              <strong>Contact Data:</strong> Email address and phone number.
            </li>
            <li>
              <strong>Transaction Data:</strong> Payment details (processed securely via Xendit) and booking history.
            </li>
            <li>
              <strong>Location Data:</strong> Pickup and drop-off locations.
            </li>
          </ul>
        </section>

        <section className="privacy-policy-card">
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>To process and manage your car rental bookings.</li>
            <li>To verify your identity and driver&apos;s license validity.</li>
            <li>To communicate with you regarding your booking and provide customer support.</li>
            <li>To send you administrative information and updates.</li>
            <li>To comply with legal obligations and protect our rights.</li>
          </ul>
        </section>
        </RevealOnScroll>

        <RevealOnScroll>
        <section className="privacy-policy-card">
          <h2>4. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal information. We may share your data with third-party service providers (such as
            payment processors like Xendit and email providers) who perform services for us, provided they adhere to
            strict data protection standards.
          </p>
        </section>

        <section className="privacy-policy-card">
          <h2>5. Your Rights</h2>
          <p>Under the Data Privacy Act, you have the right to:</p>
          <ul>
            <li>Be informed of the collection and processing of your data.</li>
            <li>Access your personal data held by us.</li>
            <li>Object to the processing of your data.</li>
            <li>Request correction or deletion of your data.</li>
            <li>File a complaint with the National Privacy Commission (NPC).</li>
          </ul>
        </section>

        <section className="privacy-policy-card">
          <h2>6. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            <br />
            Email: privacy@jpcarrental.com
          </p>
        </section>
        </RevealOnScroll>

        <RevealOnScroll>
        <section className="privacy-policy-placeholder" aria-label="Placeholder policy notice">
          <h2>Important Notice</h2>
          <p>
            This privacy policy is a temporary placeholder for demo and development purposes.
          </p>
          <p>
            It is <strong>not the final legal policy</strong> and will be replaced with an officially reviewed version.
          </p>
        </section>

        <div className="legal-page-footer">
          <Link href="/">&larr; Back to Home</Link>
        </div>
        </RevealOnScroll>
      </div>
    </main>
  );
}
