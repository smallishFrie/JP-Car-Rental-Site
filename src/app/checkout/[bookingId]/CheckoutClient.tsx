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
  basePrice: number;
  dropoffFee: number;
  pickupLocation: string;
  dropoffLocation: string;
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
  const formattedBase = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(props.basePrice);
  const formattedLocationFee = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(props.dropoffFee);

  const payButtonLabel = useMemo(() => {
    if (!componentsSdkKey) return message ? "Payment unavailable" : "Loading…";
    if (isPending) return "Processing…";
    return "Pay now";
  }, [componentsSdkKey, isPending, message]);

  useEffect(() => {
    const https = window.location.protocol === "https:";
    // #region agent log
    fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
      body: JSON.stringify({
        sessionId: "46aa6d",
        runId: "run1",
        hypothesisId: "H2",
        location: "src/app/checkout/[bookingId]/CheckoutClient.tsx:43",
        message: "CheckoutClient mount protocol check",
        data: { bookingId: props.bookingId, protocol: window.location.protocol, isHttps: https },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    queueMicrotask(() => {
      setIsHttps(https);
    });

    let cancelled = false;
    startTransition(() => {
      void (async () => {
        setMessage("");
        const result = await initCheckoutComponentsSessionAction({
          bookingId: props.bookingId,
          origin: window.location.origin,
        });
        // #region agent log
        fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
          body: JSON.stringify({
            sessionId: "46aa6d",
            runId: "run1",
            hypothesisId: "H2",
            location: "src/app/checkout/[bookingId]/CheckoutClient.tsx:59",
            message: "CheckoutClient received init session result",
            data: {
              ok: result.ok,
              hasComponentsSdkKey: Boolean(result.ok && result.componentsSdkKey),
              hasNextUrl: Boolean(result.ok && result.nextUrl),
              redirectTo: result.ok ? null : (result.redirectTo ?? null),
              errorMessage: result.ok ? null : result.message,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
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
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const isDarkTheme = currentTheme === "dark" || (currentTheme !== "light" && prefersDark);
        const components = new XenditComponents({
          componentsSdkKey,
          iframeFieldAppearance: {
            inputStyles: isDarkTheme
              ? {
                  color: "#f4f4f5",
                  backgroundColor: "#16161a",
                }
              : {
                  color: "#1d1d1f",
                  backgroundColor: "#ffffff",
                },
            placeholderStyles: isDarkTheme
              ? {
                  color: "#9b9ba3",
                }
              : {
                  color: "#6e6e73",
                },
          },
        });
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
        // #region agent log
        fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
          body: JSON.stringify({
            sessionId: "46aa6d",
            runId: "run1",
            hypothesisId: "H3",
            location: "src/app/checkout/[bookingId]/CheckoutClient.tsx:137",
            message: "CheckoutClient xendit component init failed",
            data: {
              errorMessage: error instanceof Error ? error.message : "unknown",
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        setMessage(error instanceof Error ? error.message : "Failed to initialize payment.");
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [componentsSdkKey, props.bookingId]);

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
            <strong>Pickup location:</strong> {props.pickupLocation}
          </p>
          <p>
            <strong>Drop-off location:</strong> {props.dropoffLocation}
          </p>
          <p>
            <strong>Base rental:</strong> {formattedBase}
          </p>
          <p>
            <strong>Location fees:</strong> {formattedLocationFee}
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

        {isHttps === false && !message ? (
          <p className="admin-empty">
            Local HTTP detected. Redirecting you to a secure hosted checkout page...
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
