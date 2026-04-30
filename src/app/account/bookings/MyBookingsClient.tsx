"use client";

import { useState, useTransition } from "react";
import type { BookingRecord } from "@/lib/bookings";
import { cancelPendingBookingAction, requestCancellationAction } from "@/app/account/bookings/actions";

type BookingWithCar = BookingRecord & { car: { id: string; name: string; category: string } | null };

function toDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
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
        await requestCancellationAction(fd);
        setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status: "cancel_requested" } : booking)));
        setMessage("Cancellation requested. Admin has been notified.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to request cancellation.");
      }
    });
  }

  return (
    <section className="admin-card">
      <h2>My Bookings</h2>
      {!bookings.length ? <p className="admin-empty">No bookings yet.</p> : null}
      <ul className="admin-list">
        {bookings.map((booking) => {
          const actionKind = getActionKind(booking);
          return (
            <li key={booking.id} className="booking-user-item">
              <strong>{booking.car?.name ?? booking.car_id}</strong>
              <span>
                {toDate(booking.start_date)} - {toDate(booking.end_date)}
              </span>
              <span>
                Status: {booking.status} | Payment: {booking.payment_status}
              </span>
              {actionKind === "cancel" ? (
                <button type="button" className="admin-danger-button" disabled={isPending} onClick={() => cancelPendingBooking(booking.id)}>
                  Cancel Booking
                </button>
              ) : null}
              {actionKind === "request" ? (
                <button type="button" className="admin-cancel-button" disabled={isPending} onClick={() => requestCancellation(booking.id)}>
                  Request Cancellation
                </button>
              ) : null}
              {actionKind === "requested" ? <p className="admin-empty">Cancellation request pending admin review.</p> : null}
            </li>
          );
        })}
      </ul>
      {message ? <p className="booking-feedback">{message}</p> : null}
    </section>
  );
}
