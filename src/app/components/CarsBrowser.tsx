"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Car } from "@/lib/cars";
import { categoryTokensWithoutTransmission, parseCategoryTokens } from "@/lib/carDisplay";
import CarSpecsRow from "@/app/components/CarSpecsRow";
import { useCurrency } from "@/app/components/CurrencyProvider";
import RevealOnScroll from "@/app/components/RevealOnScroll";
import TiltSurface from "@/app/components/TiltSurface";
import { motionSprings } from "@/lib/motion";

const MotionLink = motion(Link);

const carGridContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

const carCardItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionSprings.reveal,
  },
};

type CarsBrowserProps = {
  cars: Car[];
};

export default function CarsBrowser({ cars }: CarsBrowserProps) {
  const { formatDayRate } = useCurrency();
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    return Array.from(
      new Set(cars.flatMap((car) => categoryTokensWithoutTransmission(parseCategoryTokens(car.category)))),
    ).sort((a, b) => a.localeCompare(b));
  }, [cars]);
  const selectedCategorySummary = useMemo(() => {
    if (selectedCategories.length === 0) {
      return "All categories";
    }
    if (selectedCategories.length === 1) {
      return selectedCategories[0];
    }
    if (selectedCategories.length <= 3) {
      return selectedCategories.join(", ");
    }
    return `${selectedCategories.length} categories selected`;
  }, [selectedCategories]);

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cars
      .filter((car) => {
        const carCategories = categoryTokensWithoutTransmission(parseCategoryTokens(car.category));
        const categoryMatch =
          selectedCategories.length === 0 || selectedCategories.some((selectedCategory) => carCategories.includes(selectedCategory));
        if (!categoryMatch) {
          return false;
        }
        if (!query) {
          return true;
        }
        return (
          car.name.toLowerCase().includes(query) ||
          car.tagline.toLowerCase().includes(query) ||
          car.category.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const firstCategoryA = categoryTokensWithoutTransmission(parseCategoryTokens(a.category))[0] ?? "";
        const firstCategoryB = categoryTokensWithoutTransmission(parseCategoryTokens(b.category))[0] ?? "";
        const categoryCompare = firstCategoryA.localeCompare(firstCategoryB);
        if (categoryCompare !== 0) {
          return categoryCompare;
        }
        return a.name.localeCompare(b.name);
      });
  }, [cars, search, selectedCategories]);

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  }

  useEffect(() => {
    if (!categoryDropdownOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const field = categoryDropdownRef.current;
      if (field && !field.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoryDropdownOpen]);

  return (
    <div className="cars-grid-shell">
      <RevealOnScroll className="cars-intro-reveal">
        <header className="cars-grid-header" id="available-cars-header">
          <h3>Available Cars</h3>
          <p>Choose your ride and continue to booking details.</p>
        </header>

        <div className="cars-browser-controls">
          <label>
            Search
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, category, or tagline"
              aria-label="Search cars"
            />
          </label>
          <label>
            Filter by category
            <div className="custom-select-field" ref={categoryDropdownRef}>
              <button
                type="button"
                className="booking-date-trigger"
                aria-expanded={categoryDropdownOpen}
                aria-haspopup="listbox"
                aria-controls={categoryDropdownOpen ? "cars-category-listbox" : undefined}
                onClick={() => setCategoryDropdownOpen((open) => !open)}
              >
                <span>{selectedCategorySummary}</span>
                <span
                  className={`booking-date-trigger-chevron${categoryDropdownOpen ? " booking-date-trigger-chevron-open" : ""}`}
                  aria-hidden
                >
                  ▾
                </span>
              </button>
              <div
                id="cars-category-listbox"
                role="group"
                aria-label="Car categories"
                className={`custom-select-dropdown${categoryDropdownOpen ? " custom-select-dropdown--open" : ""}`}
              >
                <label
                  className={`cars-category-checkbox cars-category-checkbox-all${
                    selectedCategories.length === 0 ? " cars-category-checkbox-selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === 0}
                    onChange={() => setSelectedCategories([])}
                  />
                  <span>All categories</span>
                </label>
                <div className="cars-category-grid">
                  {categories.map((category) => {
                    const selected = selectedCategories.includes(category);
                    return (
                      <label
                        key={category}
                        className={`cars-category-checkbox${selected ? " cars-category-checkbox-selected" : ""}`}
                      >
                        <input type="checkbox" checked={selected} onChange={() => toggleCategory(category)} />
                        <span>{category}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </label>
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="cars-grid-reveal">
        {reduceMotion === true ? (
          <div className="cars-grid">
            {filteredCars.map((car) => (
              <Link
                key={car.id}
                href={`/cars/${car.id}`}
                className="car-card"
                aria-labelledby={`car-card-title-${car.id}`}
              >
                <div className="car-card-image-wrap">
                  <Image
                    src={car.cardImage}
                    alt=""
                    width={1280}
                    height={720}
                    className="car-card-image"
                  />
                </div>
                <div className="car-card-body">
                  <div className="car-card-top">
                    <div className="car-card-categories" aria-label="Car categories">
                      {categoryTokensWithoutTransmission(parseCategoryTokens(car.category)).map((category) => (
                        <span key={`${car.id}-${category}`} className="car-card-category-pill">
                          {category}
                        </span>
                      ))}
                    </div>
                    <div className="car-card-price" aria-label={`From ${formatDayRate(car.dayRate)} per day`}>
                      <span className="car-card-price-amount">{formatDayRate(car.dayRate)}</span>
                      <span className="car-card-price-unit">per day</span>
                    </div>
                  </div>
                  <CarSpecsRow category={car.category} passengerCapacity={car.passengerCapacity} className="car-card-specs" />
                  <h4 id={`car-card-title-${car.id}`}>{car.name}</h4>
                  <p>{car.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <motion.div
            className="cars-grid"
            variants={carGridContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.08, margin: "0px 0px -10% 0px" }}
          >
            {filteredCars.map((car) => (
              <TiltSurface key={car.id} className="car-card-tilt-wrapper" maxTilt={5}>
                <MotionLink
                  href={`/cars/${car.id}`}
                  className="car-card"
                  aria-labelledby={`car-card-title-${car.id}`}
                  variants={carCardItemVariants}
                  whileHover={reduceMotion ? undefined : { y: -5 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  transition={motionSprings.snappy}
                >
                  <div className="car-card-image-wrap">
                    <Image
                      src={car.cardImage}
                      alt=""
                      width={1280}
                      height={720}
                      className="car-card-image"
                    />
                  </div>
                  <div className="car-card-body">
                    <div className="car-card-top">
                      <div className="car-card-categories" aria-label="Car categories">
                        {categoryTokensWithoutTransmission(parseCategoryTokens(car.category)).map((category) => (
                          <span key={`${car.id}-${category}`} className="car-card-category-pill">
                            {category}
                          </span>
                        ))}
                      </div>
                      <div className="car-card-price" aria-label={`From ${formatDayRate(car.dayRate)} per day`}>
                        <span className="car-card-price-amount">{formatDayRate(car.dayRate)}</span>
                        <span className="car-card-price-unit">per day</span>
                      </div>
                    </div>
                    <CarSpecsRow category={car.category} passengerCapacity={car.passengerCapacity} className="car-card-specs" />
                    <h4 id={`car-card-title-${car.id}`}>{car.name}</h4>
                    <p>{car.tagline}</p>
                  </div>
                </MotionLink>
              </TiltSurface>
            ))}
          </motion.div>
        )}
      </RevealOnScroll>

      {!filteredCars.length ? <p className="admin-empty">No cars match your current search/filter.</p> : null}
    </div>
  );
}
