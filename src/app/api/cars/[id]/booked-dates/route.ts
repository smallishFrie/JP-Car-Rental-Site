import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type BookedRange = { startDate: string; endDate: string };

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const carId = String(id ?? "").trim();
  if (!carId) {
    return NextResponse.json({ error: "Car id is required." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("start_date,end_date,status,payment_status")
    .eq("car_id", carId)
    .in("status", ["pending", "upcoming", "active", "cancel_requested"])
    .gte("end_date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ranges: BookedRange[] = (data ?? []).map((row) => ({
    startDate: String((row as any).start_date),
    endDate: String((row as any).end_date),
  }));

  return NextResponse.json({ ranges });
}

