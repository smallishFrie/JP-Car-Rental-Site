"use server";

import { revalidatePath } from "next/cache";
import { deleteCarById, requireAdmin, uploadCarImage, upsertCar } from "@/lib/cars";
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

function asFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function saveCarAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dayRate = parseNumber(formData.get("dayRate"), "Day rate");
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
  await confirmCancellationForAdmin(id);
  revalidatePath("/admin");
}