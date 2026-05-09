import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VISIT_COOKIE = "jp_site_visit";
const VISIT_COOKIE_VALUE = "1";

const COOKIE_OPTS = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

async function readVisitsCount(): Promise<{ visits: number; error?: string; misconfigured?: boolean }> {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return { visits: 0, error: "Supabase admin client not configured.", misconfigured: true };
  }

  const { data, error } = await supabase
    .from("site_visit_stats")
    .select("visits")
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    return { visits: 0, error: error.message };
  }

  const visits = typeof data?.visits === "number" ? data.visits : Number(data?.visits ?? 0);
  return { visits: Number.isFinite(visits) ? visits : 0 };
}

export async function GET() {
  const { visits, error, misconfigured } = await readVisitsCount();
  if (misconfigured && error) {
    return NextResponse.json({ visits, error }, { status: 501 });
  }
  if (error) {
    return NextResponse.json({ visits, error }, { status: 500 });
  }
  return NextResponse.json({ visits });
}

export async function POST() {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server misconfigured.";
    return NextResponse.json({ visits: 0, incremented: false, error: message }, { status: 501 });
  }

  const jar = await cookies();
  const alreadyCounted = jar.get(VISIT_COOKIE)?.value === VISIT_COOKIE_VALUE;

  if (alreadyCounted) {
    const { visits, error } = await readVisitsCount();
    if (error) {
      return NextResponse.json({ visits, incremented: false, error }, { status: 500 });
    }
    return NextResponse.json({ visits, incremented: false });
  }

  const { data, error } = await supabase.rpc("increment_site_visits");

  if (error) {
    return NextResponse.json({ visits: 0, incremented: false, error: error.message }, { status: 500 });
  }

  const raw = data as unknown;
  const visits = typeof raw === "number" ? raw : Number(raw ?? 0);
  const safe = Number.isFinite(visits) ? visits : 0;

  const res = NextResponse.json({ visits: safe, incremented: true });
  res.cookies.set(VISIT_COOKIE, VISIT_COOKIE_VALUE, COOKIE_OPTS);
  return res;
}
