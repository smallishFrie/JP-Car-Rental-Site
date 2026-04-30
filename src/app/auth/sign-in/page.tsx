import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithEmail } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type SignInPageProps = {
  searchParams: Promise<{
    message?: string;
    returnTo?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { message, returnTo } = await searchParams;
  const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(safeReturnTo);
    }
  }

  return (
    <main className="auth-main">
      <section className="auth-shell">
        <header className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to manage your bookings.</p>
        </header>

        {message ? <p className="auth-message">{message}</p> : null}

        <form action={signInWithEmail} className="auth-form">
          <input type="hidden" name="returnPath" value="/auth/sign-in" />
          <input type="hidden" name="redirectTo" value={safeReturnTo} />
          <h2>Sign in</h2>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" required minLength={6} />
          </label>
          <button type="submit" className="auth-primary">
            Sign in
          </button>
        </form>

        <p className="auth-back-link">
          <Link href="/">← Back to home</Link>
        </p>
        <p className="auth-back-link">
          New here? <Link href={`/auth/create-account?returnTo=${encodeURIComponent(safeReturnTo)}`}>→ Create an account</Link>
        </p>
      </section>
    </main>
  );
}
