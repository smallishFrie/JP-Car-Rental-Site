"use server";

import { createClient } from "@/lib/supabase/server";
import { getCarById } from "@/lib/cars";
import { checkCarAvailability, createPendingBooking } from "@/lib/bookings";
import { getDropoffLocationByName } from "@/lib/dropoff-locations";
import { notifyAdminsPendingBookingCreated } from "@/lib/notifications/booking-admin-events";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

type CheckoutResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; redirectTo?: string };

function addDaysToIsoDate(dateIso: string, days: number) {
  const parsed = new Date(dateIso);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid start date.");
  }
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export async function beginCheckoutAction(formData: FormData): Promise<CheckoutResult> {
  try {
    const carId = String(formData.get("carId") ?? "").trim();
    if (!carId) {
      throw new Error("Car id is required.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        message: "Please sign in to continue checkout.",
        redirectTo: `/auth/sign-in?returnTo=${encodeURIComponent(`/cars/${carId}`)}`,
      };
    }

    const limitResult = rateLimit(`beginCheckout:${user.id}`, 5, 60_000);
    if (!limitResult.ok) {
      return {
        ok: false,
        message: "Too many checkout attempts. Please wait a minute and try again.",
      };
    }

    const car = await getCarById(carId);
    if (!car) {
      throw new Error("Car not found.");
    }

    const schema = z.object({
      startDate: z.string().trim().min(1, "Start date is required."),
      rentalDays: z.coerce.number().int().min(1, "Rental days must be at least 1."),
      customerName: z.string().trim().min(1, "Customer name is required."),
      customerPhone: z.string().trim().min(1, "Customer phone is required."),
      customerEmail: z
        .string()
        .trim()
        .optional()
        .transform((value) => (value ? value : undefined))
        .refine((value) => !value || z.string().email().safeParse(value).success, "Customer email must be valid."),
      pickupLocation: z.string().trim().min(1, "Pickup location is required."),
      dropoffLocation: z.string().trim().min(1, "Drop-off location is required."),
      driverLicenseNumber: z
        .string()
        .trim()
        .optional()
        .transform((value) => (value ? value : undefined)),
      driverNotes: z
        .string()
        .trim()
        .optional()
        .transform((value) => (value ? value : undefined)),
    });

    const parsed = schema.safeParse({
      startDate: formData.get("startDate"),
      rentalDays: formData.get("rentalDays"),
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      customerEmail: user.email ?? formData.get("customerEmail"),
      pickupLocation: formData.get("pickupLocation"),
      dropoffLocation: formData.get("dropoffLocation"),
      driverLicenseNumber: formData.get("driverLicenseNumber"),
      driverNotes: formData.get("driverNotes"),
    });

    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid checkout details." };
    }

    const {
      startDate,
      rentalDays,
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropoffLocation,
      driverLicenseNumber,
      driverNotes,
    } = parsed.data;

    const endDate = addDaysToIsoDate(startDate, Math.max(0, rentalDays - 1));
    const dropoff = await getDropoffLocationByName(dropoffLocation);
    if (!dropoff) {
      return { ok: false, message: "Selected drop-off location is not available." };
    }
    const basePrice = Number((rentalDays * car.dayRate).toFixed(2));
    const dropoffFee = Number(dropoff.extraFee.toFixed(2));
    const totalPrice = Number((basePrice + dropoffFee).toFixed(2));

    const isAvailable = await checkCarAvailability(carId, startDate, endDate);
    if (!isAvailable) {
      return { ok: false, message: "Selected dates are no longer available. Please choose another range." };
    }

    const booking = await createPendingBooking({
      userId: user.id,
      carId,
      carDisplayName: car.name,
      startDate,
      endDate,
      totalPrice,
      basePrice,
      dropoffFee,
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropoffLocation: dropoff.name,
      driverLicenseNumber,
      driverNotes,
    });
    void notifyAdminsPendingBookingCreated(booking, car.name).catch(() => undefined);
    return { ok: true, redirectTo: `/checkout/${booking.id}` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to proceed to checkout.",
    };
  }
}
