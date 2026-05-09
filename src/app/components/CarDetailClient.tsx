"use client";

import Image from "next/image";
import Link from "next/link";
import { enUS } from "date-fns/locale";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DayPicker, type DateRange } from "react-day-picker";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import * as FlagIcons from "country-flag-icons/react/3x2";
import type { Car } from "@/lib/cars";
import type { CarReview } from "@/lib/reviews";
import { categoryTokensWithoutTransmission, parseCategoryTokens } from "@/lib/carDisplay";
import CarSpecsRow from "@/app/components/CarSpecsRow";
import { beginCheckoutAction } from "@/app/cars/[id]/actions";
import CustomSelect from "@/app/components/CustomSelect";
import { MotionPressableButton } from "@/app/components/MotionPressable";
import RevealOnScroll from "@/app/components/RevealOnScroll";
import { motionSprings } from "@/lib/motion";
import "react-day-picker/style.css";

type CarDetailClientProps = {
  car: Car;
  dropoffLocations: Array<{ id: string; name: string; extraFee: number }>;
  reviews: CarReview[];
};

const AUTOPLAY_MS = 4200;

type BookedRange = { startDate: string; endDate: string };

/** Calendar date as YYYY-MM-DD in the user's local timezone (avoid UTC shift from toISOString). */
function formatLocalIsoDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalIsoDate(iso: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return undefined;
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(y, mo - 1, day);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDaysLocal(date: Date, days: number) {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

function localTodayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateInRange(date: Date, range: DateRange | undefined): boolean {
  if (!range?.from || !range?.to) {
    return false;
  }
  const t = startOfLocalDay(date).getTime();
  const from = startOfLocalDay(range.from).getTime();
  const to = startOfLocalDay(range.to).getTime();
  return t >= from && t <= to;
}

/** True when both dates fall in the same month/year, i.e. rendered in the same calendar grid. */
function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function CarDetailClient({ car, dropoffLocations, reviews }: CarDetailClientProps) {
  const reduceMotion = useReducedMotion();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [autoplayTick, setAutoplayTick] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [rentalDays, setRentalDays] = useState(2);
  const [location, setLocation] = useState(dropoffLocations[0]?.name ?? "");
  const [dropoffLocation, setDropoffLocation] = useState(dropoffLocations[0]?.name ?? "");
  const [fullName, setFullName] = useState("");
  const [phoneCountryIso, setPhoneCountryIso] = useState<CountryCode>("PH");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [driverNotes, setDriverNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [hoverDay, setHoverDay] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const totalImages = car.images.length;

  const activeSlideLabel = useMemo(
    () => `Image ${activeImageIndex + 1} of ${totalImages}`,
    [activeImageIndex, totalImages],
  );
  const todayDate = useMemo(() => localTodayStart(), []);
  const basePrice = useMemo(() => rentalDays * car.dayRate, [rentalDays, car.dayRate]);
  const selectedPickup = useMemo(
    () => dropoffLocations.find((option) => option.name === location) ?? null,
    [dropoffLocations, location],
  );
  const selectedDropoff = useMemo(
    () => dropoffLocations.find((option) => option.name === dropoffLocation) ?? null,
    [dropoffLocations, dropoffLocation],
  );
  const locationFee = useMemo(
    () => (selectedPickup?.extraFee ?? 0) + (selectedDropoff?.extraFee ?? 0),
    [selectedPickup, selectedDropoff],
  );
  const totalPrice = useMemo(() => basePrice + locationFee, [basePrice, locationFee]);
  const formattedDayRate = useMemo(
    () => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(car.dayRate),
    [car.dayRate],
  );
  const formattedTotalPrice = useMemo(
    () => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(totalPrice),
    [totalPrice],
  );
  const formattedBasePrice = useMemo(
    () => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(basePrice),
    [basePrice],
  );
  const formattedLocationFee = useMemo(
    () => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(locationFee),
    [locationFee],
  );
  const reviewCount = reviews.length;
  const countryCount = new Set(
    reviews.map((review) => review.countryOfOrigin.trim().toLowerCase()).filter(Boolean),
  ).size;
  const reviewDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        // Keep server/client render deterministic across timezones.
        timeZone: "UTC",
      }),
    [],
  );
  const reviewMonthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        // Keep server/client render deterministic across timezones.
        timeZone: "UTC",
      }),
    [],
  );
  const latestReviewLabel = useMemo(() => {
    const latest = reviews[0]?.createdAt;
    if (!latest) {
      return "No recent entries";
    }
    const parsed = new Date(latest);
    if (Number.isNaN(parsed.getTime())) {
      return "Recently updated";
    }
    return reviewMonthFormatter.format(parsed);
  }, [reviews, reviewMonthFormatter]);
  const formatReviewDate = useCallback(
    (value: string) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return "Recent trip";
      }
      return reviewDateFormatter.format(parsed);
    },
    [reviewDateFormatter],
  );
  const formatPhp = useCallback(
    (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount),
    [],
  );
  const renderLocationOption = useCallback(
    (name: string, fee: number) => (
      <span className="location-option-row">
        <span className="location-option-name">{name}</span>
        {fee > 0 ? <span className="location-option-fee">{formatPhp(fee)}</span> : null}
      </span>
    ),
    [formatPhp],
  );

  const phoneCountries = useMemo(() => getCountries(), []);

  const phoneCountryOptions = useMemo(() => {
    const options = phoneCountries.map((iso) => {
      const dialCode = `+${getCountryCallingCode(iso)}`;
      const Flag = (FlagIcons as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[iso];
      return {
        value: iso,
        label: (
          <span className="phone-country-option">
            {Flag ? <Flag title={iso} className="phone-country-flag" /> : null}
            <span className="phone-country-dial">{dialCode}</span>
          </span>
        ),
        sortKey: dialCode,
      };
    });

    options.sort((a, b) => a.sortKey.localeCompare(b.sortKey, "en", { sensitivity: "base" }));

    // Pin PH to the top since it's the primary market.
    const phIndex = options.findIndex((o) => o.value === "PH");
    if (phIndex > 0) {
      const [ph] = options.splice(phIndex, 1);
      options.unshift(ph);
    }

    return options.map((option) => ({ value: option.value, label: option.label }));
  }, [phoneCountries]);

  const phoneDialCode = useMemo(() => {
    try {
      return `+${getCountryCallingCode(phoneCountryIso)}`;
    } catch {
      return "+";
    }
  }, [phoneCountryIso]);
  const endDate = useMemo(() => {
    if (!startDate) {
      return "";
    }
    const start = parseLocalIsoDate(startDate);
    if (!start) {
      return "";
    }
    const end = addDaysLocal(start, Math.max(0, rentalDays - 1));
    return formatLocalIsoDate(end);
  }, [startDate, rentalDays]);

  const disabledMatchers = useMemo(() => {
    const ranges: { from: Date; to: Date }[] = bookedRanges
      .map((range) => {
        const from = parseLocalIsoDate(range.startDate);
        const to = parseLocalIsoDate(range.endDate);
        if (!from || !to) {
          return null;
        }
        return { from, to };
      })
      .filter((value): value is { from: Date; to: Date } => value !== null);
    return [{ before: todayDate }, ...ranges];
  }, [bookedRanges, todayDate]);

  const isDayDisabled = useCallback(
    (day: Date) => {
      const dayStart = startOfLocalDay(day);
      if (dayStart < todayDate) {
        return true;
      }
      for (const range of bookedRanges) {
        const from = parseLocalIsoDate(range.startDate);
        const to = parseLocalIsoDate(range.endDate);
        if (!from || !to) continue;
        if (dayStart >= startOfLocalDay(from) && dayStart <= startOfLocalDay(to)) {
          return true;
        }
      }
      return false;
    },
    [bookedRanges, todayDate],
  );

  const selectedStartDay = useMemo(() => {
    if (!startDate) return undefined;
    return parseLocalIsoDate(startDate);
  }, [startDate]);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    if (!selectedStartDay) return undefined;
    const from = startOfLocalDay(selectedStartDay);
    const to = addDaysLocal(from, Math.max(0, rentalDays - 1));
    return { from, to };
  }, [selectedStartDay, rentalDays]);

  const hoverPreviewRange = useMemo<DateRange | undefined>(() => {
    if (!hoverDay) return undefined;
    if (isDayDisabled(hoverDay)) return undefined;
    const from = startOfLocalDay(hoverDay);
    const to = addDaysLocal(from, Math.max(0, rentalDays - 1));
    for (let offset = 0; offset < rentalDays; offset += 1) {
      const candidate = addDaysLocal(from, offset);
      if (isDayDisabled(candidate)) {
        return undefined;
      }
    }
    return { from, to };
  }, [hoverDay, rentalDays, isDayDisabled]);

  const inSelectedRange = useCallback(
    (date: Date) => dateInRange(date, selectedRange),
    [selectedRange],
  );

  /** Effective preview = hover range minus any day already in the committed selection.
   * Each calendar cell ends up with at most one of `preview` / `selectedrange`,
   * which keeps the strip-cap CSS unambiguous when the two ranges overlap. */
  const isPreviewDay = useCallback(
    (date: Date) => {
      if (!hoverPreviewRange) return false;
      if (!dateInRange(date, hoverPreviewRange)) return false;
      return !inSelectedRange(date);
    },
    [hoverPreviewRange, inSelectedRange],
  );

  /** Single object so strip-join matchers always close over the latest hover/selection (same rules for both strips). */
  const bookingCalendarModifiers = useMemo(
    () => ({
      preview: hoverPreviewRange ? isPreviewDay : undefined,
      selectedrange: selectedRange ? selectedRange : undefined,
      /** Cell directly below (same column, next row) is in the same strip. */
      stripjoindown: (date: Date) => {
        const d = startOfLocalDay(date);
        const below = addDaysLocal(d, 7);
        if (!sameMonth(d, below)) {
          return false;
        }
        return (
          (isPreviewDay(d) && isPreviewDay(below)) ||
          (inSelectedRange(d) && inSelectedRange(below))
        );
      },
      /** Cell directly above (same column, previous row) is in the same strip. */
      stripjoinup: (date: Date) => {
        const d = startOfLocalDay(date);
        const above = addDaysLocal(d, -7);
        if (!sameMonth(d, above)) {
          return false;
        }
        return (
          (isPreviewDay(d) && isPreviewDay(above)) ||
          (inSelectedRange(d) && inSelectedRange(above))
        );
      },
    }),
    [hoverPreviewRange, selectedRange, isPreviewDay, inSelectedRange],
  );

  const goToNext = () => {
    setActiveImageIndex((current) => (current + 1) % totalImages);
    setAutoplayTick((current) => current + 1);
    setIsZooming(false);
  };

  const goToPrevious = () => {
    setActiveImageIndex((current) => (current - 1 + totalImages) % totalImages);
    setAutoplayTick((current) => current + 1);
    setIsZooming(false);
  };

  useEffect(() => {
    if (totalImages <= 1 || isZooming) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % totalImages);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(intervalId);
  }, [autoplayTick, totalImages, isZooming]);

  useEffect(() => {
    let isActive = true;
    const run = async () => {
      try {
        const response = await fetch(`/api/cars/${car.id}/booked-dates`, { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { ranges?: BookedRange[] };
        if (!isActive) {
          return;
        }
        setBookedRanges(payload.ranges ?? []);
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      isActive = false;
    };
  }, [car.id]);

  useEffect(() => {
    if (!isZooming) {
      return;
    }

    const handleWindowMouseUp = () => {
      setIsZooming(false);
    };

    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isZooming]);

  const bookingDateFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const field = bookingDateFieldRef.current;
      if (field && !field.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [calendarOpen]);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
      body: JSON.stringify({
        sessionId: "46aa6d",
        runId: "run1",
        hypothesisId: "H4",
        location: "src/app/components/CarDetailClient.tsx:433",
        message: "Car detail client mounted with review render inputs",
        data: {
          carId: car.id,
          reviewsLength: reviews.length,
          firstReviewId: reviews[0]?.id ?? null,
          firstReviewCreatedAt: reviews[0]?.createdAt ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [car.id, reviews]);

  useEffect(() => {
    if (!reviews.length) {
      return;
    }
    const showcase = document.querySelector("section.car-reviews-showcase");
    const hasShell = Boolean(showcase?.querySelector(":scope > .car-reviews-shell"));
    const directHeader = Boolean(showcase?.querySelector(":scope > header.car-reviews-header"));
    // #region agent log
    fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
      body: JSON.stringify({
        sessionId: "46aa6d",
        runId: "run1",
        hypothesisId: "H5",
        location: "src/app/components/CarDetailClient.tsx:456",
        message: "Car reviews DOM shape after hydrate",
        data: {
          hasShowcase: Boolean(showcase),
          hasShell,
          directHeader,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [reviews.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setIsSubmitting(true);
    // #region agent log
    fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
      body: JSON.stringify({
        sessionId: "46aa6d",
        runId: "run1",
        hypothesisId: "H1",
        location: "src/app/components/CarDetailClient.tsx:460",
        message: "Checkout submit started from car detail page",
        data: {
          carId: car.id,
          startDate,
          rentalDays,
          pickupLocation: location,
          dropoffLocation,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      if (!startDate) {
        setFeedback("Please select a start date.");
        return;
      }

      if (!selectedStartDay || !selectedRange?.to) {
        setFeedback("Please select a valid start date.");
        return;
      }

      for (let offset = 0; offset < rentalDays; offset += 1) {
        const candidate = addDaysLocal(startOfLocalDay(selectedStartDay), offset);
        if (isDayDisabled(candidate)) {
          setFeedback("That range includes unavailable dates. Please choose another start date.");
          return;
        }
      }

      const formData = new FormData();
      formData.set("carId", car.id);
      formData.set("rentalDays", String(rentalDays));
      formData.set("pickupLocation", location);
      formData.set("dropoffLocation", dropoffLocation);
      formData.set("startDate", startDate);
      formData.set("customerName", fullName);
      formData.set("customerPhone", `${phoneDialCode} ${phoneNumber}`.trim());
      formData.set("driverLicenseNumber", driverLicenseNumber);
      formData.set("driverNotes", driverNotes);

      const result = await beginCheckoutAction(formData);
      // #region agent log
      fetch("http://127.0.0.1:7918/ingest/032d1357-fea6-4540-a457-bae66492ee09", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46aa6d" },
        body: JSON.stringify({
          sessionId: "46aa6d",
          runId: "run1",
          hypothesisId: "H1",
          location: "src/app/components/CarDetailClient.tsx:493",
          message: "Checkout submit received action result",
          data: {
            ok: result.ok,
            redirectTo: result.redirectTo ?? null,
            message: result.ok ? null : result.message,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!result.ok) {
        setFeedback(result.message);
        if (result.redirectTo) {
          window.location.href = result.redirectTo;
        }
        return;
      }

      window.location.href = result.redirectTo;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleZoomMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!isZooming) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const relativeY = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, relativeX)),
      y: Math.max(0, Math.min(100, relativeY)),
    });
  }

  function handleZoomStart(event: React.MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const relativeY = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomPosition({
      x: Math.max(0, Math.min(100, relativeX)),
      y: Math.max(0, Math.min(100, relativeY)),
    });
    setIsZooming(true);
  }

  function handleZoomEnd() {
    setIsZooming(false);
  }

  return (
    <div className="car-detail-shell">
      <RevealOnScroll>
      <section className="car-gallery" aria-label={`${car.name} image gallery`}>
        <div className="car-gallery-track">
          {car.images.map((image, index) => (
            <div
              key={image}
              className={`car-gallery-slide ${index === activeImageIndex ? "car-gallery-slide-active" : "car-gallery-slide-inactive"}`}
              style={{ transform: `translateX(${(index - activeImageIndex) * 100}%)` }}
              onMouseMove={index === activeImageIndex ? handleZoomMove : undefined}
              onMouseDown={index === activeImageIndex ? handleZoomStart : undefined}
              onMouseUp={index === activeImageIndex ? handleZoomEnd : undefined}
              onMouseLeave={index === activeImageIndex ? handleZoomEnd : undefined}
            >
              <Image
                src={image}
                alt={`${car.name} placeholder ${index + 1}`}
                width={1280}
                height={720}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
                className={`car-gallery-image ${index === activeImageIndex && isZooming ? "car-gallery-image-zoomed" : ""}`}
                style={
                  index === activeImageIndex
                    ? ({
                        "--zoom-x": `${zoomPosition.x}%`,
                        "--zoom-y": `${zoomPosition.y}%`,
                      } as React.CSSProperties)
                    : undefined
                }
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {totalImages > 1 ? (
          <>
            <button
              type="button"
              className="gallery-nav gallery-nav-left"
              onClick={goToPrevious}
              aria-label="Show previous image"
            >
              ←
            </button>
            <button
              type="button"
              className="gallery-nav gallery-nav-right"
              onClick={goToNext}
              aria-label="Show next image"
            >
              →
            </button>
          </>
        ) : null}
        <p className="gallery-caption">{activeSlideLabel}</p>
      </section>
      </RevealOnScroll>

      <RevealOnScroll>
      <section className="car-detail-copy">
        <h1 className="page-intro-fade">{car.name}</h1>
        <p className="car-detail-tagline">{car.tagline}</p>
        {categoryTokensWithoutTransmission(parseCategoryTokens(car.category)).length ? (
          <div className="car-detail-categories" aria-label="Car categories">
            {categoryTokensWithoutTransmission(parseCategoryTokens(car.category)).map((pill) => (
              <span key={pill} className="car-card-category-pill">
                {pill}
              </span>
            ))}
          </div>
        ) : null}
        <CarSpecsRow category={car.category} passengerCapacity={car.passengerCapacity} className="car-detail-specs" />
        <p>{car.description}</p>
      </section>
      </RevealOnScroll>

      <RevealOnScroll>
      <section className="booking-panel" aria-label="Booking details">
        <h2>Booking Details</h2>
        <div className="booking-policy-callout">
          <strong>Cancellation and refunds:</strong> Cancellations at least 48 hours before pickup may qualify for a full
          refund; within 48 hours fees may apply. No-shows are non-refundable. Read section 6 in our{" "}
          <Link href="/terms-of-service#cancellation">Terms of Service</Link>.
          <p className="booking-policy-subtitle">
            <strong>Additional policy:</strong>
          </p>
          <ul className="booking-policy-list">
            <li>Minimum of 2 days for out of the city rental</li>
            <li>An additional 400/hour of extension</li>
            <li>If the extension exceeds 5 hours, it is considered as a whole day</li>
          </ul>
        </div>
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="booking-inline-fields">
            <label>
              Rental days
              <input
                type="number"
                min={2}
                value={rentalDays}
                onChange={(event) => {
                  const parsedDays = Number(event.target.value);
                  if (Number.isNaN(parsedDays)) {
                    setRentalDays(2);
                    return;
                  }
                  setRentalDays(Math.max(2, parsedDays));
                }}
                required
              />
            </label>

            <div className="booking-date-field" ref={bookingDateFieldRef}>
              <p className="booking-calendar-label" id="booking-date-label">
                Pickup dates
              </p>
              <button
                type="button"
                className="booking-date-trigger"
                aria-expanded={calendarOpen}
                aria-haspopup="dialog"
                aria-controls={calendarOpen ? "booking-date-dialog" : undefined}
                aria-labelledby="booking-date-label"
                onClick={() => setCalendarOpen((open) => !open)}
              >
                <span>{startDate ? `${startDate} → ${endDate}` : "Select start date & range"}</span>
                <span className={`booking-date-trigger-chevron${calendarOpen ? " booking-date-trigger-chevron-open" : ""}`} aria-hidden>
                  ▾
                </span>
              </button>
              <AnimatePresence>
                {calendarOpen ? (
                  <motion.div
                    layout
                    key="booking-calendar-panel"
                    className="booking-calendar-dropdown popover-motion-layer"
                    id="booking-date-dialog"
                    role="dialog"
                    aria-label="Rental calendar"
                    aria-hidden={false}
                    initial={{ opacity: 0, y: -8, scale: 0.98, visibility: "hidden" }}
                    animate={{ opacity: 1, y: 0, scale: 1, visibility: "visible" }}
                    exit={{ opacity: 0, y: -6, scale: 0.98, visibility: "hidden" }}
                    transition={reduceMotion ? { duration: 0 } : motionSprings.snappy}
                    onMouseLeave={() => setHoverDay(undefined)}
                  >
                    <DayPicker
                      mode="single"
                      locale={enUS}
                      className="booking-daypicker-root"
                      selected={selectedStartDay}
                      defaultMonth={selectedStartDay ?? todayDate}
                      onSelect={(day) => {
                        setFeedback("");
                        if (!day) {
                          setStartDate("");
                          return;
                        }
                        if (isDayDisabled(day)) {
                          setFeedback("That date is unavailable.");
                          return;
                        }
                        for (let offset = 0; offset < rentalDays; offset += 1) {
                          const candidate = addDaysLocal(startOfLocalDay(day), offset);
                          if (isDayDisabled(candidate)) {
                            setFeedback("That range includes unavailable dates. Please choose another start date.");
                            return;
                          }
                        }
                        setStartDate(formatLocalIsoDate(day));
                        setCalendarOpen(false);
                      }}
                      disabled={disabledMatchers}
                      onDayMouseEnter={(d) => setHoverDay(d)}
                      modifiers={bookingCalendarModifiers}
                      modifiersClassNames={{
                        preview: "booking-day-preview",
                        selectedrange: "booking-day-selectedrange",
                        stripjoindown: "booking-day-strip-join-down",
                        stripjoinup: "booking-day-strip-join-up",
                      }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="booking-inline-fields">
            <label>
              Pickup location
              <CustomSelect
                options={dropoffLocations.map((option) => ({
                  value: option.name,
                  label: renderLocationOption(option.name, option.extraFee),
                }))}
                value={location}
                onChange={setLocation}
                optionsAriaLabel="Pickup locations"
              />
            </label>

            <label>
              Drop-off location
              <CustomSelect
                options={dropoffLocations.map((option) => ({
                  value: option.name,
                  label: renderLocationOption(option.name, option.extraFee),
                }))}
                value={dropoffLocation}
                onChange={setDropoffLocation}
                optionsAriaLabel="Drop-off locations"
              />
            </label>
          </div>

          <div className="booking-inline-fields">
            <label className="booking-full-name-field">
              Full name
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
          </div>

          <div className="booking-inline-fields">
            <label>
              Phone number
              <div className="booking-phone-input-row">
                <CustomSelect
                  options={phoneCountryOptions}
                  value={phoneCountryIso}
                  onChange={(value) => {
                    if ((phoneCountries as readonly string[]).includes(value)) {
                      setPhoneCountryIso(value as CountryCode);
                    }
                  }}
                  optionsAriaLabel="Phone country code"
                  className="custom-select--phone-country"
                />
                <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} required />
              </div>
            </label>
            <label>
              Driver license number
              <input
                type="text"
                value={driverLicenseNumber}
                onChange={(event) => setDriverLicenseNumber(event.target.value)}
              />
            </label>
          </div>

          <label className="booking-notes-field">
            Driver notes (optional)
            <input type="text" value={driverNotes} onChange={(event) => setDriverNotes(event.target.value)} />
          </label>

          <div className="booking-total booking-total-breakdown">
            <p className="booking-total-line">
              <span>{formattedDayRate} per day x {rentalDays} days</span>
              <strong>{formattedBasePrice}</strong>
            </p>
            <p className="booking-total-line">
              <span>Location fees</span>
              <strong>{formattedLocationFee}</strong>
            </p>
            <p className="booking-total-line booking-total-grand">
              <span>Total</span>
              <strong>{formattedTotalPrice}</strong>
            </p>
          </div>

          <MotionPressableButton type="submit" className="booking-submit" disabled={isSubmitting}>
            {isSubmitting ? "Preparing checkout..." : "Proceed to checkout"}
          </MotionPressableButton>
        </form>

        {feedback ? (
          <p className="booking-feedback" role="status">
            {feedback}
          </p>
        ) : null}
      </section>
      </RevealOnScroll>

      <RevealOnScroll>
      {reviews.length ? (
      <section className="car-reviews-showcase" aria-label={`${car.name} customer reviews`}>
        <div className="car-reviews-shell">
          <header className="car-reviews-header">
            <p className="car-reviews-eyebrow">Renter spotlight</p>
            <h2 className="car-reviews-heading">Real trips. Real impressions. Trusted comfort.</h2>
            <p className="car-reviews-lead">
              Guests consistently praise the drive quality, cleanliness, and smooth pickup flow for this vehicle.
            </p>
          </header>

          <ul className="car-reviews-highlights" aria-label="Review highlights">
            <li className="car-reviews-highlight-card">
              <strong>{reviewCount}</strong>
              <span>{reviewCount === 1 ? "Guest story" : "Guest stories"}</span>
            </li>
            <li className="car-reviews-highlight-card">
              <strong>{countryCount}</strong>
              <span>{countryCount === 1 ? "Country represented" : "Countries represented"}</span>
            </li>
            <li className="car-reviews-highlight-card">
              <strong>{latestReviewLabel}</strong>
              <span>Most recent review</span>
            </li>
          </ul>

          <ul className="car-reviews-grid">
            {reviews.map((review) => (
              <li key={review.id} className="car-review-card">
                <p className="car-review-card-text">{review.reviewText}</p>
                <div className="car-review-card-footer">
                  <p className="car-review-card-attribution">
                    <span className="car-review-card-reviewer">{review.reviewerName}</span>
                    <span className="car-review-card-origin">{review.countryOfOrigin}</span>
                  </p>
                  <div className="car-review-card-meta">
                    <span className="car-review-card-chip">Guest review</span>
                    <time dateTime={review.createdAt} className="car-review-card-chip">
                      {formatReviewDate(review.createdAt)}
                    </time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      ) : null}
      </RevealOnScroll>
    </div>
  );
}
