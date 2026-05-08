import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/cars";

export type CarReviewRecord = {
  id: string;
  car_id: string;
  reviewer_name: string;
  country_of_origin: string;
  review_text: string;
  created_at: string;
  cars?: { name: string } | null;
};

type CarReviewAdminRow = Omit<CarReviewRecord, "cars"> & {
  cars?: { name: string } | { name: string }[] | null;
};

export type CarReview = {
  id: string;
  carId: string;
  reviewerName: string;
  countryOfOrigin: string;
  reviewText: string;
  createdAt: string;
};

function toAppReview(record: CarReviewRecord): CarReview {
  return {
    id: record.id,
    carId: record.car_id,
    reviewerName: record.reviewer_name,
    countryOfOrigin: record.country_of_origin,
    reviewText: record.review_text,
    createdAt: record.created_at,
  };
}

export async function listRecentReviews(limit = 10): Promise<CarReview[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("car_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, limit));

  if (error || !data?.length) {
    return [];
  }

  return (data as CarReviewRecord[]).map(toAppReview);
}

export async function listReviewsForCar(carId: string, limit = 6): Promise<CarReview[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const normalizedId = carId.trim();
  if (!normalizedId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("car_reviews")
    .select("*")
    .eq("car_id", normalizedId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, limit));

  if (error || !data?.length) {
    return [];
  }

  return (data as CarReviewRecord[]).map(toAppReview);
}

export async function listReviewsForAdmin(): Promise<CarReviewRecord[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("car_reviews")
    .select("id, car_id, reviewer_name, country_of_origin, review_text, created_at, cars(name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data as CarReviewAdminRow[] | null) ?? []);
  return rows.map((row) => ({
    ...row,
    cars: Array.isArray(row.cars) ? row.cars[0] ?? null : (row.cars ?? null),
  }));
}

export async function createReview(input: {
  carId: string;
  reviewerName: string;
  countryOfOrigin: string;
  reviewText: string;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const payload = {
    car_id: input.carId.trim(),
    reviewer_name: input.reviewerName.trim(),
    country_of_origin: input.countryOfOrigin.trim(),
    review_text: input.reviewText.trim(),
  };

  const { data, error } = await supabase.from("car_reviews").insert(payload).select("id").single();
  if (error) {
    throw new Error(error.message);
  }

  return String((data as { id: string } | null)?.id ?? "");
}

export async function deleteReview(id: string) {
  await requireAdmin();
  const normalizedId = id.trim();
  if (!normalizedId) {
    throw new Error("Review id is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("car_reviews").delete().eq("id", normalizedId);
  if (error) {
    throw new Error(error.message);
  }
}
