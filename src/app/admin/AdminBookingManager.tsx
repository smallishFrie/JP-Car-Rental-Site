"use client";

import { useMemo, useState, useTransition } from "react";
import type { BookingRecord } from "@/lib/bookings";
import {
  cleanupExpiredSessionsAction,
  confirmCancellationAction,
  syncBookingStatusAction,
} from "@/app/admin/actions";

type BookingWithCar = BookingRecord & { car: { id: string; name: string; category: string } | null };

const filterStatuses = ["pending", "upcoming", "active"] as const;

function deriveStatus(booking: BookingWithCar) {
  if (booking.status === "canceled") {
    return null;
  }
  if (booking.status === "cancel_requested") {
    return "cancel_requested";
  }
  if (booking.payment_status !== "paid") {
    return "pending";
  }
  const today = new Date().toISOString().slice(0, 10);
  if (today < booking.start_date) {
    return "upcoming";
  }
  if (today > booking.end_date) {
    return "completed";
  }
  return "active";
}

function toDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminBookingManager({ initialBookings }: { initialBookings: BookingWithCar[] }) {
  const[bookings, setBookings] = useState(initialBookings);
  const [selectedStatus, setSelectedStatus] = useState<(typeof filterStatuses)[number]>("pending");
  const [isPending, startTransition] = useTransition();
  const[message, setMessage] = useState("");

  const filteredBookings = useMemo(
    () =>
      bookings
        .filter((booking) => deriveStatus(booking) === selectedStatus)
        .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [bookings, selectedStatus],
  );

  function refreshStatus(id: string) {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("id", id);
        await syncBookingStatusAction(fd);
        setMessage("Status sync requested.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to sync status.");
      }
    });
  }

  function cleanupExpiredSessions() {
    startTransition(async () => {
      try {
        const result = await cleanupExpiredSessionsAction();
        setBookings((current) =>
          current.map((booking) =>
            booking.status === "pending" && booking.payment_status === "unpaid" ? { ...booking, status: "canceled" } : booking,
          ),
        );
        setMessage(`Expired session cleanup finished. ${result.cleaned} booking(s) released.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to clean up expired sessions.");
      }
    });
  }

  function confirmCancellation(id: string) {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("id", id);
        await confirmCancellationAction(fd);
        setBookings((current) =>
          current.map((booking) => (booking.id === id ? { ...booking, status: "canceled", canceled_at: new Date().toISOString() } : booking)),
        );
        setMessage("Cancellation confirmed.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to confirm cancellation.");
      }
    });
  }

  return (
    <section className="admin-booking-shell">
      <h2>Bookings</h2>
      <p className="admin-empty">Pipeline is auto-computed using payment + booking dates.</p>
      <div className="admin-actions">
        <button type="button" className="admin-secondary-button" onClick={cleanupExpiredSessions} disabled={isPending}>
          Clean up expired sessions
        </button>
      </div>

      <section className="admin-card">
        <h3>Booking management</h3>
        <div className="booking-status-filters">
          {filterStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className="admin-cancel-button"
              aria-current={selectedStatus === status ? "true" : undefined}
              onClick={() => setSelectedStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
        {filteredBookings.length ? (
          <div className="booking-detail-grid">
            {filteredBookings.map((booking) => (
              <article key={booking.id} className="booking-admin-item">
                <p>
                  <strong>Status:</strong> {deriveStatus(booking)}
                </p>
                <p>
                  <strong>Customer:</strong> {booking.customer_name}
                </p>
                <p>
                  <strong>Phone:</strong> {booking.customer_phone}
                </p>
                <p>
                  <strong>Email:</strong> {booking.customer_email || "N/A"}
                </p>
                <p>
                  <strong>Car:</strong> {booking.car?.name ?? booking.car_id}
                </p>
                <p>
                  <strong>Schedule:</strong> {toDate(booking.start_date)} - {toDate(booking.end_date)}
                </p>
                <p>
                  <strong>Payment:</strong> {booking.payment_status} ({booking.payment_reference || "No ref yet"})
                </p>
                <div className="admin-delete-confirm">
                  <p>Actions</p>
                  {booking.status === "cancel_requested" ? (
                    <p>Please process refund manually in Xendit Dashboard before confirming cancellation.</p>
                  ) : null}
                  <div>
                    <button
                      type="button"
                      className="admin-cancel-button"
                      onClick={() => refreshStatus(booking.id)}
                      disabled={isPending}
                    >
                      Refresh status
                    </button>
                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => confirmCancellation(booking.id)}
                      disabled={isPending || booking.status !== "cancel_requested"}
                    >
                      Confirm cancellation
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">No {selectedStatus} bookings right now.</p>
        )}
      </section>

      {message ? <p className="booking-feedback">{message}</p> : null}
    </section>
  );
}