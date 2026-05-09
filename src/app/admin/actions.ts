"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteCarById, requireAdmin, uploadCarImage, upsertCar } from "@/lib/cars";
import { deleteContactOption, saveContactOption } from "@/lib/contact-options";
import { CONTACT_TYPES, type ContactType } from "@/lib/contact-options-types";
import { deleteDropoffLocation, saveDropoffLocation } from "@/lib/dropoff-locations";
import { createReview, deleteReview, updateReview } from "@/lib/reviews";
import {
  cleanupExpiredPendingBookings,
  confirmCancellationForAdmin,
  syncDerivedStatusForBooking,
} from "@/lib/bookings";

function parseNumber(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return parsed;
}

function parseCurrency(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative amount.`);
  }
  return Number(parsed.toFixed(2));
}

function parseOptionalPassengerCapacity(value: FormDataEntryValue | null, fieldName: string) {
  const raw = String(value ?? "").trim();
  if (raw === "") {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 55) {
    throw new Error(`${fieldName} must be a whole number from 1 to 55, or left blank.`);
  }

  return parsed;
}

function asFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

function parseRequiredText(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = String(value ?? "").trim();
  if (!parsed) {
    throw new Error(`${fieldName} is required.`);
  }
  return parsed;
}

export async function saveCarAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dayRate = parseNumber(formData.get("dayRate"), "Day rate");
  const passengerCapacity = parseOptionalPassengerCapacity(formData.get("passengerCapacity"), "Passenger capacity");
  const isActiveValues = formData.getAll("isActive").map((value) => String(value).trim().toLowerCase());
  const isActive = isActiveValues.includes("true") || isActiveValues.includes("on");
  const existingCardImage = String(formData.get("existingCardImage") ?? "").trim();
  const existingGalleryImages = formData
    .getAll("existingGalleryImages")
    .map((item) => String(item).trim())
    .filter(Boolean);

  if (!name || !category || !tagline || !description) {
    throw new Error("Name, category, tagline, and description are required.");
  }

  const cardImageFile = asFile(formData.get("cardImage"));
  const galleryFiles = formData.getAll("galleryImages").filter((item): item is File => item instanceof File && item.size > 0);

  let pendingTurnover = false;
  if (id) {
    const supabase = await createClient();
    const { data: existingCar } = await supabase.from("cars").select("pending_turnover").eq("id", id).maybeSingle();
    pendingTurnover = Boolean((existingCar as { pending_turnover?: boolean } | null)?.pending_turnover);
  }

  const cardImageUrl = cardImageFile
    ? await uploadCarImage(cardImageFile, "cards")
    : existingCardImage;

  if (!cardImageUrl) {
    throw new Error("Card image is required.");
  }

  const uploadedGalleryUrls = await Promise.all(galleryFiles.map((file) => uploadCarImage(file, "gallery")));
  const galleryImageUrls = [...existingGalleryImages, ...uploadedGalleryUrls];

  if (!galleryImageUrls.length) {
    throw new Error("Please provide at least one gallery image.");
  }

  const savedId = await upsertCar({
    id,
    name,
    category,
    tagline,
    description,
    dayRate,
    cardImageUrl,
    galleryImageUrls,
    isActive,
    pendingTurnover: id ? pendingTurnover : false,
    passengerCapacity,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/cars/${savedId}`);

  return savedId;
}

export async function deleteCarAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Car id is required.");
  }

  await deleteCarById(id);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/cars/${id}`);
}

export async function syncBookingStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Booking id is required.");
  }
  await syncDerivedStatusForBooking(id);
  revalidatePath("/admin");
}

export async function cleanupExpiredSessionsAction() {
  await requireAdmin();
  const result = await cleanupExpiredPendingBookings();
  revalidatePath("/admin");
  return result;
}

export async function confirmCancellationAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Booking id is required.");
  }
  const rawAmount = formData.get("refundAmountPhp");
  const refundAmountPhp =
    rawAmount === null || String(rawAmount).trim() === "" ? 0 : parseNumber(rawAmount, "Refund amount");
  await confirmCancellationForAdmin(id, refundAmountPhp);
  revalidatePath("/admin");
}

export async function confirmCarTurnoverAction(formData: FormData) {
  await requireAdmin();
  const carId = String(formData.get("carId") ?? "").trim();
  if (!carId) {
    throw new Error("Car id is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cars").update({ pending_turnover: false }).eq("id", carId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/cars/${carId}`);
}

export async function saveDropoffLocationAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const extraFee = parseCurrency(formData.get("extraFee"), "Extra fee");

  const saved = await saveDropoffLocation({ id: id || undefined, name, extraFee });

  revalidatePath("/admin");
  revalidatePath("/");
  return saved;
}

export async function deleteDropoffLocationAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Location id is required.");
  }
  await deleteDropoffLocation(id);
  revalidatePath("/admin");
  revalidatePath("/");
}

function parseContactType(value: FormDataEntryValue | null): ContactType {
  const raw = String(value ?? "").trim();
  if ((CONTACT_TYPES as readonly string[]).includes(raw)) {
    return raw as ContactType;
  }
  throw new Error("Select a valid contact type.");
}

function parseSortOrder(value: FormDataEntryValue | null): number {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.trunc(parsed);
}

export async function saveContactOptionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const contactType = parseContactType(formData.get("contactType"));
  const labelRaw = String(formData.get("label") ?? "").trim();
  const label = labelRaw === "" ? null : labelRaw;
  const value = String(formData.get("value") ?? "").trim();
  const sortOrder = parseSortOrder(formData.get("sortOrder"));
  const isActiveValues = formData.getAll("isActive").map((item) => String(item).trim().toLowerCase());
  const isActive = isActiveValues.includes("true") || isActiveValues.includes("on");

  const saved = await saveContactOption({
    id: id || undefined,
    contactType,
    label,
    value,
    sortOrder,
    isActive,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return saved;
}

export async function deleteContactOptionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Contact option id is required.");
  }
  await deleteContactOption(id);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveReviewAction(formData: FormData) {
  await requireAdmin();
  const carId = parseRequiredText(formData.get("carId"), "Car");
  const reviewerName = parseRequiredText(formData.get("reviewerName"), "Name");
  const countryOfOrigin = parseRequiredText(formData.get("countryOfOrigin"), "Country of origin");
  const reviewText = parseRequiredText(formData.get("reviewText"), "Review");

  const savedId = await createReview({
    carId,
    reviewerName,
    countryOfOrigin,
    reviewText,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/cars/${carId}`);
  return savedId;
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = parseRequiredText(formData.get("id"), "Review id");
  const carId = parseRequiredText(formData.get("carId"), "Car");
  await deleteReview(id);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/cars/${carId}`);
}

export async function updateReviewAction(formData: FormData) {
  await requireAdmin();
  const id = parseRequiredText(formData.get("id"), "Review id");
  const carId = parseRequiredText(formData.get("carId"), "Car");
  const reviewerName = parseRequiredText(formData.get("reviewerName"), "Name");
  const countryOfOrigin = parseRequiredText(formData.get("countryOfOrigin"), "Country of origin");
  const reviewText = parseRequiredText(formData.get("reviewText"), "Review");

  await updateReview({
    id,
    reviewerName,
    countryOfOrigin,
    reviewText,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/cars/${carId}`);
}