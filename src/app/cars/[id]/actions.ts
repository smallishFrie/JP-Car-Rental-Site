"use server";

import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getCarById } from "@/lib/cars";
import { checkCarAvailability, createPendingBooking } from "@/lib/bookings";
import { getDropoffLocationByName } from "@/lib/dropoff-locations";
import { notifyAdminsPendingBookingCreated } from "@/lib/notifications/booking-admin-events";
import { ensureAuthenticatedUser } from "@/lib/guest-session";
import { rateLimit } from "@/lib/rate-limit";
import { logServerWarning } from "@/lib/server-error-logger";
import { z } from "zod";

function hashEmailForRateLimit(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

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
    // #region agent log
    fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
      body: JSON.stringify({
        sessionId: "46aa6d",
        runId: "run1",
        hypothesisId: "H1",
        location: "src/app/cars/[id]/actions.ts:27",
        message: "beginCheckoutAction called",
        data: {
          carId,
          startDate: String(formData.get("startDate") ?? ""),
          rentalDays: String(formData.get("rentalDays") ?? ""),
          pickupLocation: String(formData.get("pickupLocation") ?? ""),
          dropoffLocation: String(formData.get("dropoffLocation") ?? ""),
        },
        timestamp: Date.now(),
      }),
    }).catch((error) => {
      logServerWarning(error, {
        source: "cars/[id]/beginCheckoutAction",
        category: "debug_ingest_failed",
      });
    });
    // #endregion
    if (!carId) {
      throw new Error("Car id is required.");
    }

    const supabase = await createClient();
    const authResult = await ensureAuthenticatedUser(supabase);
    if ("error" in authResult) {
      return { ok: false, message: authResult.error };
    }
    const user = authResult.user;

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
      customerEmail: formData.get("customerEmail"),
      pickupLocation: formData.get("pickupLocation"),
      dropoffLocation: formData.get("dropoffLocation"),
      driverLicenseNumber: formData.get("driverLicenseNumber"),
      driverNotes: formData.get("driverNotes"),
    });

    if (!parsed.success) {
      // #region agent log
      fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
        body: JSON.stringify({
          sessionId: "46aa6d",
          runId: "run1",
          hypothesisId: "H1",
          location: "src/app/cars/[id]/actions.ts:109",
          message: "beginCheckoutAction zod parse failed",
          data: {
            issue: parsed.error.issues[0]?.message ?? "unknown",
            issuePath: parsed.error.issues[0]?.path ?? [],
          },
          timestamp: Date.now(),
        }),
      }).catch((error) => {
        logServerWarning(error, {
          source: "cars/[id]/beginCheckoutAction",
          category: "debug_ingest_failed",
        });
      });
      // #endregion
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid checkout details." };
    }

    const {
      startDate,
      rentalDays,
      customerName,
      customerPhone,
      customerEmail: customerEmailFromForm,
      pickupLocation,
      dropoffLocation,
      driverLicenseNumber,
      driverNotes,
    } = parsed.data;

    const accountEmail = user.email?.trim() ?? "";
    const formEmail = customerEmailFromForm?.trim() ?? "";
    const customerEmail = accountEmail || formEmail;
    if (!customerEmail || !z.string().email().safeParse(customerEmail).success) {
      return { ok: false, message: "Please enter a valid email address." };
    }

    if (!accountEmail) {
      const emailLimit = rateLimit(`beginCheckout:email:${hashEmailForRateLimit(customerEmail)}`, 5, 60_000);
      if (!emailLimit.ok) {
        return {
          ok: false,
          message: "Too many checkout attempts. Please wait a minute and try again.",
        };
      }
    }

    const endDate = addDaysToIsoDate(startDate, Math.max(0, rentalDays - 1));
    const pickup = await getDropoffLocationByName(pickupLocation);
    if (!pickup) {
      return { ok: false, message: "Selected pickup location is not available." };
    }
    const dropoff = await getDropoffLocationByName(dropoffLocation);
    if (!dropoff) {
      return { ok: false, message: "Selected drop-off location is not available." };
    }
    const basePrice = Number((rentalDays * car.dayRate).toFixed(2));
    const locationFee = Number((pickup.extraFee + dropoff.extraFee).toFixed(2));
    const totalPrice = Number((basePrice + locationFee).toFixed(2));

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
      dropoffFee: locationFee,
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropoffLocation: dropoff.name,
      driverLicenseNumber,
      driverNotes,
    });
    // #region agent log
    fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
      body: JSON.stringify({
        sessionId: "46aa6d",
        runId: "run1",
        hypothesisId: "H1",
        location: "src/app/cars/[id]/actions.ts:171",
        message: "beginCheckoutAction booking created",
        data: {
          bookingId: booking.id,
          totalPrice,
          basePrice,
          pickupFee: pickup.extraFee,
          dropoffFee: dropoff.extraFee,
          locationFee,
        },
        timestamp: Date.now(),
      }),
    }).catch((error) => {
      logServerWarning(error, {
        source: "cars/[id]/beginCheckoutAction",
        category: "debug_ingest_failed",
      });
    });
    // #endregion
    void notifyAdminsPendingBookingCreated(booking, car.name).catch((error) => {
      logServerWarning(error, {
        source: "cars/[id]/beginCheckoutAction",
        category: "notify_admins_pending_booking_failed",
      });
    });
    return { ok: true, redirectTo: `/checkout/${booking.id}` };
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
      body: JSON.stringify({
        sessionId: "46aa6d",
        runId: "run1",
        hypothesisId: "H1",
        location: "src/app/cars/[id]/actions.ts:184",
        message: "beginCheckoutAction threw",
        data: {
          errorMessage: error instanceof Error ? error.message : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch((fetchError) => {
      logServerWarning(fetchError, {
        source: "cars/[id]/beginCheckoutAction",
        category: "debug_ingest_failed",
      });
    });
    // #endregion
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to proceed to checkout.",
    };
  }
}
