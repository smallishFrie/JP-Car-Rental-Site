"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MotionPressableButton } from "@/app/components/MotionPressable";
import RevealOnScroll from "@/app/components/RevealOnScroll";
import { initCheckoutComponentsSessionAction } from "@/app/checkout/[bookingId]/actions";
import { XenditComponents } from "xendit-components-web";

export default function CheckoutClient(props: {
  bookingId: string;
  carName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  customerName: string;
  customerEmail?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [componentsSdkKey, setComponentsSdkKey] = useState<string | null>(null);
  const componentsRef = useRef<{ submit?: () => void } | null>(null);
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
  /** null until we read window (avoids wrong loading/HTTPS message on first paint). */
  const [isHttps, setIsHttps] = useState<boolean | null>(null);

  const formattedTotal = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(props.totalPrice);

  const payButtonLabel = useMemo(() => {
    if (!componentsSdkKey) return message ? "Payment unavailable" : "Loading…";
    if (isPending) return "Processing…";
    return "Pay now";
  }, [componentsSdkKey, isPending, message]);

  useEffect(() => {
    const https = window.location.protocol === "https:";
    queueMicrotask(() => {
      setIsHttps(https);
    });
    if (!https) {
      return;
    }

    let cancelled = false;
    startTransition(() => {
      void (async () => {
        setMessage("");
        const result = await initCheckoutComponentsSessionAction({
          bookingId: props.bookingId,
          origin: window.location.origin,
        });
        if (cancelled) return;
        if (!result.ok) {
          setMessage(result.message);
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
          }
          return;
        }
        if (result.nextUrl) {
          window.location.href = result.nextUrl;
          return;
        }
        if (result.componentsSdkKey) {
          setComponentsSdkKey(result.componentsSdkKey);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [props.bookingId]);

  useEffect(() => {
    if (!componentsSdkKey) {
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const components = new XenditComponents({ componentsSdkKey });
        componentsRef.current = components;

        components.addEventListener("fatal-error", (event: Event) => {
          const custom = event as CustomEvent<{ message?: string }>;
          const fromDetail = custom.detail?.message;
          const msg =
            typeof fromDetail === "string" && fromDetail.trim()
              ? fromDetail
              : "A payment error occurred. Please try again.";
          const q = encodeURIComponent(msg.slice(0, 400));
          window.location.href = `/checkout/${props.bookingId}/result?outcome=failed&reason=${q}`;
        });

        components.addEventListener("init", () => {
          // Session data is loaded; components are ready.
        });

        const picker = components.createChannelPickerComponent();
        const container = document.getElementById("xendit-components-container");
        if (!container) {
          return;
        }
        container.replaceChildren(picker);

        components.addEventListener("submission-ready", () => {
          if (mounted) setIsReadyToSubmit(true);
        });
        components.addEventListener("submission-not-ready", () => {
          if (mounted) setIsReadyToSubmit(false);
        });
        components.addEventListener("session-complete", () => {
          window.location.href = `/checkout/${props.bookingId}/result?outcome=success`;
        });
        components.addEventListener("session-expired-or-canceled", () => {
          window.location.href = `/checkout/${props.bookingId}/result?outcome=canceled`;
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to initialize payment.");
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [componentsSdkKey]);

  return (
    <section className="auth-shell">
      <RevealOnScroll className="auth-shell-reveal">
        <header className="auth-header">
          <h1 className="page-intro-fade">Checkout</h1>
          <p>Complete your payment without leaving JP Car Rental.</p>
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
          <p>
            <strong>Customer:</strong> {props.customerName}
            {props.customerEmail ? ` (${props.customerEmail})` : ""}
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll className="auth-shell-reveal">
        <div className="auth-form">
        <h2>Payment</h2>

        {isHttps === false ? (
          <p className="admin-empty">
            Embedded checkout requires HTTPS. You’re currently on <strong>HTTP</strong> (localhost). Use an HTTPS domain or tunnel to pay.
          </p>
        ) : null}

        {isHttps === true && !componentsSdkKey && !message ? (
          <p className="admin-empty" aria-live="polite">
            Loading secure payment…
          </p>
        ) : null}

        {componentsSdkKey ? <div id="xendit-components-container" /> : null}

        <MotionPressableButton
          type="button"
          className="auth-primary"
          disabled={
            isPending || isHttps !== true || !componentsSdkKey || !isReadyToSubmit
          }
          onClick={() => {
            setMessage("");
            try {
              componentsRef.current?.submit?.();
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Unable to submit payment.");
            }
          }}
        >
          {payButtonLabel}
        </MotionPressableButton>

        {message ? <p className="auth-message">{message}</p> : null}
        <p className="admin-empty">
          Note: some wallets may open an approval step in-app. After payment, we’ll email your confirmation receipt.
        </p>
        </div>
      </RevealOnScroll>
    </section>
  );
}
