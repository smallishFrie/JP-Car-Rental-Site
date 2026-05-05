"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function isSafePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

function getReturnPath(formData: FormData, fallbackPath: string) {
  const rawPath = String(formData.get("returnPath") ?? "");
  if (isSafePath(rawPath)) {
    return rawPath;
  }

  return fallbackPath;
}

function getRedirectTo(formData: FormData, fallbackPath: string) {
  const rawPath = String(formData.get("redirectTo") ?? "");
  if (isSafePath(rawPath)) {
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
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 6) {
    redirect(`${returnPath}?message=${encodeURIComponent("Password must be at least 6 characters.")}`);
  }

  if (password !== confirmPassword) {
    redirect(`${returnPath}?message=${encodeURIComponent("Passwords do not match.")}`);
  }

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
  const redirectTo = getRedirectTo(formData, "/");

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

  redirect(redirectTo);
}

export async function signOut() {
  if (!hasSupabaseEnv()) {
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
