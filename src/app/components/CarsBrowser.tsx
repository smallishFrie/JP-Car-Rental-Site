"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Car } from "@/lib/cars";

type CarsBrowserProps = {
  cars: Car[];
};

export default function CarsBrowser({ cars }: CarsBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    return Array.from(new Set(cars.map((car) => car.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [cars]);

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cars.filter((car) => {
      const categoryMatch = selectedCategory === "all" || car.category === selectedCategory;
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
    });
  }, [cars, search, selectedCategory]);

  return (
    <div className="cars-grid-shell">
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
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="cars-grid">
        {filteredCars.map((car) => (
          <article key={car.id} className="car-card">
            <div className="car-card-image-wrap">
              <Image
                src={car.cardImage}
                alt={`${car.name} placeholder image`}
                width={1280}
                height={720}
                className="car-card-image"
              />
            </div>
            <div className="car-card-body">
              <p className="car-card-category">{car.category}</p>
              <h4>{car.name}</h4>
              <p>{car.tagline}</p>
              <Link href={`/cars/${car.id}`} className="car-card-link">
                Learn more
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!filteredCars.length ? <p className="admin-empty">No cars match your current search/filter.</p> : null}
    </div>
  );
}
