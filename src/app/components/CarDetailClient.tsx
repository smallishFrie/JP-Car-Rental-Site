"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Car } from "@/lib/cars";

type CarDetailClientProps = {
  car: Car;
};

const AUTOPLAY_MS = 4200;

export default function CarDetailClient({ car }: CarDetailClientProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [autoplayTick, setAutoplayTick] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [rentalDays, setRentalDays] = useState(2);
  const [location, setLocation] = useState(car.locations[0]?.value ?? "");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const totalImages = car.images.length;

  const activeSlideLabel = useMemo(
    () => `Image ${activeImageIndex + 1} of ${totalImages}`,
    [activeImageIndex, totalImages],
  );
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const totalPrice = useMemo(() => rentalDays * car.dayRate, [rentalDays, car.dayRate]);
  const formattedDayRate = useMemo(
    () => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(car.dayRate),
    [car.dayRate],
  );
  const formattedTotalPrice = useMemo(
    () => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(totalPrice),
    [totalPrice],
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
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
            Full name
            <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>

          <label>
            Phone number
            <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} required />
          </label>

          <label>
            Start date
            <input
              type="date"
              min={todayIso}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>

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
          </div>

          <p className="booking-total">
            {formattedDayRate} per day x {rentalDays} days = <strong>{formattedTotalPrice}</strong>
          </p>

          <button type="submit" className="booking-submit">
            Proceed to checkout
          </button>
        </form>

        {submitted ? (
          <p className="booking-feedback" role="status">
            Booking request received for {fullName} on {car.name} ({rentalDays} day{rentalDays > 1 ? "s" : ""}).
            Estimated total is {formattedTotalPrice}. We will contact you at {phoneNumber} shortly.
          </p>
        ) : null}
      </section>
    </div>
  );
}
