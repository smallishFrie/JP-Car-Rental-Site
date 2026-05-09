"use client";

import { useState, useTransition } from "react";
import RevealOnScroll from "@/app/components/RevealOnScroll";
import type { BookingRecord } from "@/lib/booking-model";
import { formatBookingVehicleName } from "@/lib/booking-model";
import { cancelPendingBookingAction, requestCancellationAction } from "@/app/account/bookings/actions";

type BookingWithCar = BookingRecord & { car: { id: string; name: string; category: string } | null };

function toDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function toPhp(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}

function getActionKind(booking: BookingWithCar) {
  if (booking.status === "pending" && booking.payment_status === "unpaid") {
    return "cancel";
  }
  if (booking.status === "cancel_requested") {
    return "requested";
  }
  if (booking.status === "upcoming") {
    return "request";
  }
  return "none";
}

export default function MyBookingsClient({ initialBookings }: { initialBookings: BookingWithCar[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [cancelReasonById, setCancelReasonById] = useState<Record<string, string>>({});

  function cancelPendingBooking(id: string) {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("id", id);
        await cancelPendingBookingAction(fd);
        setBookings((current) =>
          current.map((booking) => (booking.id === id ? { ...booking, status: "canceled", canceled_at: new Date().toISOString() } : booking)),
        );
        setMessage("Booking canceled.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to cancel booking.");
      }
    });
  }

  function requestCancellation(id: string) {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("id", id);
        const reason = cancelReasonById[id]?.trim();
        if (reason) {
          fd.set("cancellationReason", reason);
        }
        await requestCancellationAction(fd);
        setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status: "cancel_requested" } : booking)));
        setMessage("Cancellation requested. Admin has been notified.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to request cancellation.");
      }
    });
  }

  return (
    <section className="admin-card admin-card-bookings">
      <RevealOnScroll className="auth-shell-reveal">
        <h2 className="page-intro-fade">My Bookings</h2>
        <p className="admin-empty" style={{ marginBottom: 16 }}>
          <strong>Cancellations and refunds:</strong> Cancellations at least 48 hours before pickup may be eligible for a
          full refund; within 48 hours a fee may apply. See our{" "}
          <a href="/terms-of-service#cancellation" className="auth-back-link">
            terms (section 6)
          </a>{" "}
          for details.
        </p>
        <p className="admin-empty" style={{ marginBottom: 16 }}>
          Minimum of 2 days for out of the city rental
          <br />
          An additional 400/hour of extension
          <br />
          If the extension exceeds 5 hours -- it is considered as a whole day
        </p>
        {!bookings.length ? <p className="admin-empty">No bookings yet.</p> : null}
      </RevealOnScroll>
      <RevealOnScroll className="auth-shell-reveal">
        <ul className="admin-list">
        {bookings.map((booking) => {
          const actionKind = getActionKind(booking);
          return (
            <li key={booking.id} className="booking-user-item">
              <strong>{formatBookingVehicleName(booking)}</strong>
              <span>
                {toDate(booking.start_date)} - {toDate(booking.end_date)}
              </span>
              <span>
                Status: {booking.status} | Payment: {booking.payment_status}
              </span>
              <span>Pickup: {booking.pickup_location}</span>
              <span>Drop-off: {booking.dropoff_location}</span>
              <span>Base rental: {toPhp(Number(booking.base_price ?? booking.total_price))}</span>
              <span>Location fees: {toPhp(Number(booking.dropoff_fee ?? 0))}</span>
              <span>Total: {toPhp(Number(booking.total_price))}</span>
              {actionKind === "cancel" ? (
                <button type="button" className="admin-danger-button" disabled={isPending} onClick={() => cancelPendingBooking(booking.id)}>
                  Cancel Booking
                </button>
              ) : null}
              {actionKind === "request" ? (
                <div className="booking-cancel-request">
                  <label className="booking-notes-field">
                    Reason (optional)
                    <textarea
                      rows={2}
                      value={cancelReasonById[booking.id] ?? ""}
                      onChange={(e) =>
                        setCancelReasonById((prev) => ({
                          ...prev,
                          [booking.id]: e.target.value,
                        }))
                      }
                      placeholder="Tell us why you need to cancel"
                      disabled={isPending}
                    />
                  </label>
                  <button type="button" className="admin-cancel-button" disabled={isPending} onClick={() => requestCancellation(booking.id)}>
                    Request Cancellation
                  </button>
                </div>
              ) : null}
              {actionKind === "requested" ? <p className="admin-empty">Cancellation request pending admin review.</p> : null}
            </li>
          );
        })}
        </ul>
        {message ? <p className="booking-feedback">{message}</p> : null}
      </RevealOnScroll>
    </section>
  );
}
