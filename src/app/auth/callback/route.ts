import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?message=Supabase environment variables are not configured yet.", request.url),
    );
  }

  const requestUrl = new URL(request.url);
  const authError = requestUrl.searchParams.get("error_description");
  if (authError) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?message=${encodeURIComponent(authError)}`, request.url),
    );
  }

  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL(`/auth/sign-in?message=${encodeURIComponent(error.message)}`, request.url),
        );
      }
    } catch {
      return NextResponse.redirect(
        new URL("/auth/sign-in?message=Could not complete OAuth sign in.", request.url),
      );
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}
