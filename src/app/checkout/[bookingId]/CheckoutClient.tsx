"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { startPaymentAction } from "@/app/checkout/[bookingId]/actions";
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
  const [channelCode, setChannelCode] = useState<"GCASH" | "MAYA" | "CARDS">("GCASH");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [componentsSdkKey, setComponentsSdkKey] = useState<string | null>(null);
  const componentsRef = useRef<any>(null);
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
  const [isHttps, setIsHttps] = useState(true);

  const formattedTotal = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(props.totalPrice);

  const isCards = channelCode === "CARDS";

  useEffect(() => {
    setIsHttps(window.location.protocol === "https:");
  }, []);

  useEffect(() => {
    setMessage("");
    setComponentsSdkKey(null);
    setIsReadyToSubmit(false);
    componentsRef.current = null;
  }, [channelCode]);

  const payButtonLabel = useMemo(() => {
    if (isCards && componentsSdkKey) return isPending ? "Processing..." : "Pay with card";
    return isPending ? "Starting payment..." : "Pay now";
  }, [isCards, componentsSdkKey, isPending]);

  useEffect(() => {
    if (!isCards || !componentsSdkKey) {
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const components = new XenditComponents({ componentsSdkKey });
        componentsRef.current = components;

        components.addEventListener("fatal-error", (event: any) => {
          const message = event?.detail?.message || event?.message || "A payment error occurred. Please try again.";
          if (mounted) setMessage(String(message));
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
          window.location.href = "/account/bookings";
        });
        components.addEventListener("session-expired-or-canceled", () => {
          if (mounted) setMessage("Payment session expired or was canceled. Please try again.");
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to initialize card payment.");
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [isCards, componentsSdkKey]);

  return (
    <section className="auth-shell">
      <header className="auth-header">
        <h1>Checkout</h1>
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

      <form
        className="auth-form"
        action={(formData) => {
          setMessage("");
          formData.set("bookingId", props.bookingId);
          formData.set("channelCode", channelCode);
          formData.set("origin", window.location.origin);
          startTransition(async () => {
            const result = await startPaymentAction(formData);
            if (!result.ok) {
              setMessage(result.message);
              if (result.redirectTo) {
                window.location.href = result.redirectTo;
              }
              return;
            }
            if (result.componentsSdkKey) {
              setComponentsSdkKey(result.componentsSdkKey);
              return;
            }
            if (result.nextUrl) {
              window.location.href = result.nextUrl;
            }
          });
        }}
      >
        <h2>Payment method</h2>

        <label>
          Choose payment method
          <select value={channelCode} onChange={(e) => setChannelCode(e.target.value as "GCASH" | "MAYA" | "CARDS")} required>
            <option value="GCASH">GCash</option>
            <option value="MAYA">Maya</option>
            <option value="CARDS">Card</option>
          </select>
        </label>

        {!isHttps ? (
          <p className="admin-empty">
            Card payments require HTTPS. You’re currently on <strong>HTTP</strong> (localhost). Use an HTTPS domain/tunnel to test cards.
          </p>
        ) : null}

        {isCards && componentsSdkKey ? <div id="xendit-components-container" /> : null}

        <button
          type={isCards && componentsSdkKey ? "button" : "submit"}
          className="auth-primary"
          disabled={isPending || !isHttps || (isCards && componentsSdkKey ? !isReadyToSubmit : false)}
          onClick={
            isCards && componentsSdkKey
              ? () => {
                  setMessage("");
                  try {
                    componentsRef.current?.submit?.();
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Unable to submit card payment.");
                  }
                }
              : undefined
          }
        >
          {payButtonLabel}
        </button>

        {message ? <p className="auth-message">{message}</p> : null}
        <p className="admin-empty">
          Note: some wallets may open an approval step in-app. After payment, we’ll email your confirmation receipt.
        </p>
      </form>
    </section>
  );
}

