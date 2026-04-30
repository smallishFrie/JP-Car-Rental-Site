"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function getReturnPath(formData: FormData, fallbackPath: string) {
  const rawPath = String(formData.get("returnPath") ?? "");
  if (rawPath === "/auth/sign-in" || rawPath === "/auth/create-account") {
    return rawPath;
  }

  return fallbackPath;
}

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${proto}://${host}`;
}

export async function signUpWithEmail(formData: FormData) {
  const returnPath = getReturnPath(formData, "/auth/create-account");

  if (!hasSupabaseEnv()) {
    redirect(`${returnPath}?message=Supabase environment variables are not configured yet.`);
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`${returnPath}?message=${encodeURIComponent(error.message)}`);
  }

  redirect(`${returnPath}?message=Check your inbox to confirm your account.`);
}

export async function signInWithEmail(formData: FormData) {
  const returnPath = getReturnPath(formData, "/auth/sign-in");

  if (!hasSupabaseEnv()) {
    redirect(`${returnPath}?message=Supabase environment variables are not configured yet.`);
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`${returnPath}?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signOut() {
  if (!hasSupabaseEnv()) {
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
