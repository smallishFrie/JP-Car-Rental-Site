"use client";

import Image from "next/image";
import { DayPicker, type DateRange } from "react-day-picker";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Car } from "@/lib/cars";
import { beginCheckoutAction } from "@/app/cars/[id]/actions";
import "react-day-picker/style.css";

type CarDetailClientProps = {
  car: Car;
};

const AUTOPLAY_MS = 4200;

type BookedRange = { startDate: string; endDate: string };

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export default function CarDetailClient({ car }: CarDetailClientProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [autoplayTick, setAutoplayTick] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [rentalDays, setRentalDays] = useState(2);
  const [location, setLocation] = useState(car.locations[0]?.value ?? "");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [driverNotes, setDriverNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [hoverDay, setHoverDay] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const totalImages = car.images.length;

  const activeSlideLabel = useMemo(
    () => `Image ${activeImageIndex + 1} of ${totalImages}`,
    [activeImageIndex, totalImages],
  );
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayDate = useMemo(() => new Date(`${todayIso}T00:00:00.000Z`), [todayIso]);
  const totalPrice = useMemo(() => rentalDays * car.dayRate, [rentalDays, car.dayRate]);
  const formattedDayRate = useMemo(
    () => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(car.dayRate),
    [car.dayRate],
  );
  const formattedTotalPrice = useMemo(
    () => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(totalPrice),
    [totalPrice],
  );
  const endDate = useMemo(() => {
    if (!startDate) {
      return "";
    }
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = addDays(start, Math.max(0, rentalDays - 1));
    return toIsoDate(end);
  }, [startDate, rentalDays]);

  const disabledMatchers = useMemo(() => {
    const ranges: { from: Date; to: Date }[] = bookedRanges
      .map((range) => {
        const from = new Date(`${range.startDate}T00:00:00.000Z`);
        const to = new Date(`${range.endDate}T00:00:00.000Z`);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
          return null;
        }
        return { from, to };
      })
      .filter((value): value is { from: Date; to: Date } => value !== null);
    return [{ before: todayDate }, ...ranges];
  }, [bookedRanges, todayDate]);

  const isDayDisabled = (day: Date) => {
    if (day < todayDate) {
      return true;
    }
    for (const range of bookedRanges) {
      const from = new Date(`${range.startDate}T00:00:00.000Z`);
      const to = new Date(`${range.endDate}T00:00:00.000Z`);
      if (day >= from && day <= to) {
        return true;
      }
    }
    return false;
  };

  const selectedStartDay = useMemo(() => {
    if (!startDate) return undefined;
    const parsed = new Date(`${startDate}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [startDate]);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    if (!selectedStartDay) return undefined;
    const to = addDays(selectedStartDay, Math.max(0, rentalDays - 1));
    return { from: selectedStartDay, to };
  }, [selectedStartDay, rentalDays]);

  const hoverPreviewRange = useMemo<DateRange | undefined>(() => {
    if (!hoverDay) return undefined;
    if (isDayDisabled(hoverDay)) return undefined;
    const to = addDays(hoverDay, Math.max(0, rentalDays - 1));
    for (let offset = 0; offset < rentalDays; offset += 1) {
      const candidate = addDays(hoverDay, offset);
      if (isDayDisabled(candidate)) {
        return undefined;
      }
    }
    return { from: hoverDay, to };
  }, [hoverDay, rentalDays, bookedRanges, todayDate]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setIsSubmitting(true);
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
        const candidate = addDays(selectedStartDay, offset);
        if (isDayDisabled(candidate)) {
          setFeedback("That range includes unavailable dates. Please choose another start date.");
          return;
        }
      }

      const formData = new FormData();
      formData.set("carId", car.id);
      formData.set("rentalDays", String(rentalDays));
      formData.set("pickupLocation", location);
      formData.set("startDate", startDate);
      formData.set("customerName", fullName);
      formData.set("customerPhone", phoneNumber);
      formData.set("customerEmail", email);
      formData.set("driverLicenseNumber", driverLicenseNumber);
      formData.set("driverNotes", driverNotes);

      const result = await beginCheckoutAction(formData);
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

      <section className="car-detail-copy">
        <h1>{car.name}</h1>
        <p>{car.description}</p>
      </section>

      <section className="booking-panel" aria-label="Booking details">
        <h2>Booking Details</h2>
        <form className="booking-form" onSubmit={handleSubmit}>
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

          <label>
            Pickup location
            <select value={location} onChange={(event) => setLocation(event.target.value)} required>
              {car.locations.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="booking-calendar">
            <p className="booking-calendar-label">Select start date</p>
            <DayPicker
              mode="single"
              selected={selectedStartDay}
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
                  const candidate = addDays(day, offset);
                  if (isDayDisabled(candidate)) {
                    setFeedback("That range includes unavailable dates. Please choose another start date.");
                    return;
                  }
                }
                setStartDate(toIsoDate(day));
              }}
              disabled={disabledMatchers}
              onDayMouseEnter={(day) => setHoverDay(day)}
              onDayMouseLeave={() => setHoverDay(undefined)}
              modifiers={{
                preview: hoverPreviewRange ? hoverPreviewRange : undefined,
                selectedrange: selectedRange ? selectedRange : undefined,
              }}
              modifiersClassNames={{
                preview: "booking-day-preview",
                selectedrange: "booking-day-selectedrange",
              }}
            />
            <p className="booking-calendar-summary">
              <strong>Dates:</strong> {startDate ? `${startDate} → ${endDate}` : "Select a start date"}
            </p>
          </div>

          <div className="booking-inline-fields">
            <label>
              Full name
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>

            <label>
              Phone number
              <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} required />
            </label>
          </div>

          <div className="booking-inline-fields">
            <label>
              Email (for receipt)
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
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

          <p className="booking-total">
            {formattedDayRate} per day x {rentalDays} days = <strong>{formattedTotalPrice}</strong>
          </p>

          <button type="submit" className="booking-submit" disabled={isSubmitting}>
            {isSubmitting ? "Preparing checkout..." : "Proceed to checkout"}
          </button>
        </form>

        {feedback ? (
          <p className="booking-feedback" role="status">
            {feedback}
          </p>
        ) : null}
      </section>
    </div>
  );
}
