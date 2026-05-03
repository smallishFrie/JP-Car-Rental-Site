import Link from "next/link";
import { redirect } from "next/navigation";
import MyBookingsClient from "@/app/account/bookings/MyBookingsClient";
import { listBookingsForUser } from "@/lib/bookings";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function AccountBookingsPage() {
  if (!hasSupabaseEnv()) {
    redirect("/auth?message=Supabase environment variables are not configured yet.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?returnTo=/account/bookings");
  }

  const bookings = await listBookingsForUser(user.id);

  return (
    <main className="auth-main auth-main--no-site-header">
      <section className="auth-shell">
        <MyBookingsClient initialBookings={bookings} />
        <p className="auth-back-link">
          <Link href="/">← Back to home</Link>
        </p>
      </section>
    </main>
  );
}
