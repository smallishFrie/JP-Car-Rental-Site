"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Car } from "@/lib/cars";
import { categoryTokensWithoutTransmission, parseCategoryTokens } from "@/lib/carDisplay";
import CarSpecsRow from "@/app/components/CarSpecsRow";
import CustomSelect from "@/app/components/CustomSelect";
import RevealOnScroll from "@/app/components/RevealOnScroll";

type CarsBrowserProps = {
  cars: Car[];
};

const dayRateFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function formatDayRate(amount: number) {
  return dayRateFormatter.format(amount);
}

export default function CarsBrowser({ cars }: CarsBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    return Array.from(new Set(cars.flatMap((car) => parseCategoryTokens(car.category)))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [cars]);

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cars
      .filter((car) => {
        const carCategories = parseCategoryTokens(car.category);
        const categoryMatch = selectedCategory === "all" || carCategories.includes(selectedCategory);
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
  }, [cars, search, selectedCategory]);

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
            <CustomSelect
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((category) => ({ value: category, label: category })),
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              optionsAriaLabel="Car categories"
            />
          </label>
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="cars-grid-reveal">
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
      </RevealOnScroll>

      {!filteredCars.length ? <p className="admin-empty">No cars match your current search/filter.</p> : null}
    </div>
  );
}
