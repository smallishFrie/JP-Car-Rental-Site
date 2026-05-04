"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MotionPressableButton } from "@/app/components/MotionPressable";
import RevealOnScroll from "@/app/components/RevealOnScroll";

type Outcome = "success" | "canceled" | "failed" | "unknown";

export default function CheckoutResultClient(props: {
  outcome: Outcome;
  bookingId: string;
  carName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  reason?: string | null;
}) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(6);

  const formattedTotal = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(props.totalPrice);

  useEffect(() => {
    if (seconds <= 0) {
      router.replace("/account/bookings");
      return;
    }
    const t = window.setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [seconds, router]);

  const title =
    props.outcome === "success"
      ? "Payment successful"
      : props.outcome === "canceled"
        ? "Payment not completed"
        : props.outcome === "failed"
          ? "Something went wrong"
          : "Checkout update";

  const lead =
    props.outcome === "success"
      ? "Your booking is confirmed. We’ve sent a receipt to your email when you provided one."
      : props.outcome === "canceled"
        ? "The payment session ended or was canceled. You can return to your booking and try again when you’re ready."
        : props.outcome === "failed"
          ? (props.reason?.trim() || "We couldn’t confirm this payment. You can try again from your bookings.")
          : "Here’s the latest we have for this checkout.";

  return (
    <section className="auth-shell">
      <RevealOnScroll className="auth-shell-reveal">
        <header className="auth-header">
          <h1 className="page-intro-fade">{title}</h1>
          <p>{lead}</p>
        </header>

        <section className="auth-message" aria-label="Booking summary">
          <p>
            <strong>Car:</strong> {props.carName}
          </p>
          <p>
            <strong>Rental dates:</strong> {props.startDate} → {props.endDate}
          </p>
          <p>
            <strong>Total:</strong> {formattedTotal}
          </p>
          <p className="admin-empty" style={{ marginTop: "1rem" }}>
            Redirecting to your bookings in <strong>{Math.max(0, seconds)}</strong>s…
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll className="auth-shell-reveal">
        <div className="auth-form" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <MotionPressableButton type="button" className="auth-primary" onClick={() => router.replace("/account/bookings")}>
            Go to my bookings now
          </MotionPressableButton>
          <p className="auth-back-link">
            <Link href="/#cars">Browse available cars</Link>
          </p>
        </div>
      </RevealOnScroll>
    </section>
  );
}
