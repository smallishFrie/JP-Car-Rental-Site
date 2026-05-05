// NOTE: In Next.js, client-side env var access must be statically analyzable
// (e.g. `process.env.NEXT_PUBLIC_*`). Dynamic access like `process.env[key]`
// will not be inlined and may evaluate to `undefined` in the browser.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function hasSupabaseEnv() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function readEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? SUPABASE_URL
      : name === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
        ? SUPABASE_PUBLISHABLE_KEY
        : undefined;

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}
