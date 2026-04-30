import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpWithEmail } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type CreateAccountPageProps = {
  searchParams: Promise<{
    message?: string;
    returnTo?: string;
  }>;
};

export default async function CreateAccountPage({
  searchParams,
}: CreateAccountPageProps) {
  const { message, returnTo } = await searchParams;
  const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/");
    }
  }

  return (
    <main className="auth-main">
      <section className="auth-shell">
        <header className="auth-header">
          <h1>Create account</h1>
          <p>Set up your account to start managing bookings.</p>
        </header>

        {message ? <p className="auth-message">{message}</p> : null}

        <form action={signUpWithEmail} className="auth-form">
          <input type="hidden" name="returnPath" value="/auth/create-account" />
          <h2>Create account</h2>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" required minLength={6} />
          </label>
          <button type="submit" className="auth-primary">
            Create account
          </button>
        </form>

        <p className="auth-back-link">
          <Link href="/">← Back to home</Link>
        </p>
        <p className="auth-back-link">
          Already have an account? <Link href={`/auth/sign-in?returnTo=${encodeURIComponent(safeReturnTo)}`}>→ Sign in</Link>
        </p>
      </section>
    </main>
  );
}
