"use server";

import { createClient } from "@/lib/supabase/server";
import { getCarById } from "@/lib/cars";
import { attachPaymentReference, checkCarAvailability, createPendingBooking } from "@/lib/bookings";
import { createXenditInvoice } from "@/lib/xendit";

type CheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; message: string; redirectTo?: string };

function parseDate(value: FormDataEntryValue | null, label: string) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    throw new Error(`${label} is required.`);
  }
  return raw;
}

function parsePositiveNumber(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(String(value ?? ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a valid positive number.`);
  }
  return parsed;
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

    const car = await getCarById(carId);
    if (!car) {
      throw new Error("Car not found.");
    }

    const startDate = parseDate(formData.get("startDate"), "Start date");
    const endDate = parseDate(formData.get("endDate"), "End date");
    const rentalDays = parsePositiveNumber(formData.get("rentalDays"), "Rental days");
    const totalPrice = parsePositiveNumber(formData.get("totalPrice"), "Total price");
    const customerName = String(formData.get("customerName") ?? "").trim();
    const customerPhone = String(formData.get("customerPhone") ?? "").trim();
    const customerEmail = String(formData.get("customerEmail") ?? "").trim();
    const pickupLocation = String(formData.get("pickupLocation") ?? "").trim();
    const driverLicenseNumber = String(formData.get("driverLicenseNumber") ?? "").trim();
    const driverNotes = String(formData.get("driverNotes") ?? "").trim();

    if (!customerName || !customerPhone || !pickupLocation) {
      throw new Error("Customer name, phone, and pickup location are required.");
    }

    if (rentalDays < 1) {
      throw new Error("Rental days must be at least 1.");
    }

    const isAvailable = await checkCarAvailability(carId, startDate, endDate);
    if (!isAvailable) {
      return { ok: false, message: "Selected dates are no longer available. Please choose another range." };
    }

    const booking = await createPendingBooking({
      userId: user.id,
      carId,
      startDate,
      endDate,
      totalPrice,
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      driverLicenseNumber,
      driverNotes,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const checkout = await createXenditInvoice({
      bookingId: booking.id,
      carName: car.name,
      amountPhp: totalPrice,
      customerEmail,
      customerName,
      successUrl: `${siteUrl}/cars/${carId}?checkout=success`,
      cancelUrl: `${siteUrl}/cars/${carId}?checkout=canceled`,
    });

    await attachPaymentReference(booking.id, checkout.invoiceId);
    return { ok: true, checkoutUrl: checkout.checkoutUrl };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to proceed to checkout.",
    };
  }
}
