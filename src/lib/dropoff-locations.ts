import "server-only";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type DropoffLocationRecord = {
  id: string;
  name: string;
  extra_fee: number;
  created_at?: string;
  updated_at?: string;
};

export type DropoffLocationOption = {
  id: string;
  name: string;
  extraFee: number;
};

const fallbackDropoffLocations: DropoffLocationOption[] = [
  { id: "fallback-jp-main-office", name: "JP Main Office", extraFee: 0 },
  { id: "fallback-airport-terminal", name: "Airport Terminal", extraFee: 0 },
  { id: "fallback-city-drop-point", name: "City Drop Point", extraFee: 0 },
];

function toOption(record: DropoffLocationRecord): DropoffLocationOption {
  const fee = Number(record.extra_fee);
  return {
    id: record.id,
    name: record.name,
    extraFee: Number.isFinite(fee) ? fee : 0,
  };
}

export async function listDropoffLocations(): Promise<DropoffLocationOption[]> {
  if (!hasSupabaseEnv()) {
    return fallbackDropoffLocations;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("dropoff_locations").select("*").order("name", { ascending: true });
  if (error || !data?.length) {
    return fallbackDropoffLocations;
  }
  return data.map((row) => toOption(row as DropoffLocationRecord));
}

export async function getDropoffLocationByName(name: string): Promise<DropoffLocationOption | null> {
  const target = name.trim();
  if (!target) {
    return null;
  }

  if (!hasSupabaseEnv()) {
    return fallbackDropoffLocations.find((location) => location.name === target) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("dropoff_locations").select("*").eq("name", target).maybeSingle();
  if (error || !data) {
    return null;
  }
  return toOption(data as DropoffLocationRecord);
}

export async function saveDropoffLocation(input: { id?: string; name: string; extraFee: number }) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Location name is required.");
  }
  const extraFee = Number(Number(input.extraFee).toFixed(2));
  if (!Number.isFinite(extraFee) || extraFee < 0) {
    throw new Error("Extra fee must be a valid non-negative amount.");
  }

  const supabase = await createClient();
  const locationId = input.id?.trim();
  const payload = { name, extra_fee: extraFee };
  const { data, error } = locationId
    ? await supabase.from("dropoff_locations").update(payload).eq("id", locationId).select("*").single()
    : await supabase.from("dropoff_locations").insert(payload).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save drop-off location.");
  }
  return toOption(data as DropoffLocationRecord);
}

export async function deleteDropoffLocation(id: string) {
  const supabase = await createClient();
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("Location id is required.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("dropoff_locations")
    .select("id,name")
    .eq("id", trimmedId)
    .maybeSingle();
  if (fetchError) {
    throw new Error(fetchError.message);
  }
  if (!existing) {
    return;
  }

  const name = String((existing as { name?: string }).name ?? "").trim();
  if (!name) {
    throw new Error("Invalid drop-off location.");
  }

  const { count, error: countError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("dropoff_location", name)
    .in("status", ["pending", "upcoming", "active", "cancel_requested"]);
  if (countError) {
    throw new Error(countError.message);
  }
  if ((count ?? 0) > 0) {
    throw new Error("This drop-off location has open bookings and cannot be deleted yet.");
  }

  const { error } = await supabase.from("dropoff_locations").delete().eq("id", trimmedId);
  if (error) {
    throw new Error(error.message);
  }
}
