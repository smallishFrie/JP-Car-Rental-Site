"use client";

import { useState, useTransition } from "react";
import { MotionPressableButton } from "@/app/components/MotionPressable";
import RevealOnScroll from "@/app/components/RevealOnScroll";
import { submitBookingNotMeAction } from "@/app/booking-not-me/actions";

export default function BookingNotMeClient(props: { token: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="auth-shell">
      <RevealOnScroll className="auth-shell-reveal">
        <header className="auth-header">
          <h1 className="page-intro-fade">Don’t recognize this booking?</h1>
          <p>
            If you didn’t make a reservation with JP Car Rental, use the button below. We’ll automatically secure the
            booking where possible and notify our team.
          </p>
        </header>
      </RevealOnScroll>

      <RevealOnScroll className="auth-shell-reveal">
        <div className="auth-form">
          {done ? (
            <p className="booking-feedback" role="status">
              {message}
            </p>
          ) : (
            <>
              <p className="admin-empty">
                Only continue if this reservation was not made by you or anyone you trust on your device.
              </p>
              <MotionPressableButton
                type="button"
                className="auth-primary"
                disabled={isPending}
                onClick={() => {
                  setMessage(null);
                  startTransition(() => {
                    void (async () => {
                      const res = await submitBookingNotMeAction(props.token);
                      setMessage(res.message);
                      setDone(res.ok);
                    })();
                  });
                }}
              >
                {isPending ? "Working…" : "This wasn’t me — secure this booking"}
              </MotionPressableButton>
              {message && !done ? (
                <p className="auth-message" role="alert">
                  {message}
                </p>
              ) : null}
            </>
          )}
        </div>
      </RevealOnScroll>
    </section>
  );
}
