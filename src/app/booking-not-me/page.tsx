import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import BookingNotMeClient from "@/app/booking-not-me/BookingNotMeClient";

type PageProps = {
  searchParams: Promise<{ t?: string }>;
};

export default async function BookingNotMePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const token = String(sp.t ?? "").trim();

  return (
    <>
      <SiteHeader />
      <main className="auth-main">
        {token ? (
          <BookingNotMeClient token={token} />
        ) : (
          <section className="auth-shell">
            <header className="auth-header">
              <h1 className="page-intro-fade">Link not valid</h1>
              <p>This page needs a secure link from your email. If something looks wrong, contact us from our website.</p>
            </header>
            <p className="auth-back-link">
              <Link href="/">← Back to home</Link>
            </p>
          </section>
        )}
      </main>
    </>
  );
}
