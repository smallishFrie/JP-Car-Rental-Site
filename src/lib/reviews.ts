import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/cars";

export type CarReviewRecord = {
  id: string;
  reviewer_name: string;
  country_of_origin: string;
  review_text: string;
  created_at: string;
};

type CarReviewAdminRow = CarReviewRecord;

export type CarReview = {
  id: string;
  reviewerName: string;
  countryOfOrigin: string;
  reviewText: string;
  createdAt: string;
};

function toAppReview(record: CarReviewRecord): CarReview {
  return {
    id: record.id,
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

export async function listReviewsForAdmin(): Promise<CarReviewRecord[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("car_reviews")
    .select("id, reviewer_name, country_of_origin, review_text, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data as CarReviewAdminRow[] | null) ?? []);
  return rows;
}

export async function createReview(input: {
  reviewerName: string;
  countryOfOrigin: string;
  reviewText: string;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const payload = {
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

export async function updateReview(input: {
  id: string;
  reviewerName: string;
  countryOfOrigin: string;
  reviewText: string;
}) {
  await requireAdmin();
  const id = input.id.trim();
  if (!id) {
    throw new Error("Review id is required.");
  }

  const supabase = await createClient();
  const payload = {
    reviewer_name: input.reviewerName.trim(),
    country_of_origin: input.countryOfOrigin.trim(),
    review_text: input.reviewText.trim(),
  };

  const { error } = await supabase.from("car_reviews").update(payload).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
