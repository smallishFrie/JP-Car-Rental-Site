import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listCarsForAdmin, requireAdmin } from "@/lib/cars";
import AdminCarManager from "@/app/admin/AdminCarManager";

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

  let cars = [];
  try {
    cars = await listCarsForAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cars.";
    if (message.includes("Could not find the table") || message.includes("relation") && message.includes("cars")) {
      redirect("/?message=Please run supabase/admin_cars_setup.sql first.");
    }
    throw error;
  }

  return (
    <main className="auth-main">
      <section className="auth-shell">
        <header className="auth-header">
          <h1>Admin panel</h1>
        </header>
        <AdminCarManager initialCars={cars} />
        <p className="auth-back-link">
          <Link href="/">← Back to home</Link>
        </p>
      </section>
    </main>
  );
}
