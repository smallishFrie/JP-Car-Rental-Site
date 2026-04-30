"use client";

import Link from "next/link";

function scrollToCars(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  const carsHeader = document.getElementById("available-cars-header");
  if (!carsHeader) {
    return;
  }

  const yOffset = 20;
  const targetTop = carsHeader.getBoundingClientRect().top + window.scrollY - yOffset;
  window.scrollTo({ top: targetTop, behavior: "smooth" });
}

export default function HeroCopy() {
  return (
    <div className="hero-copy">
      <div className="hero-copy-text">
        <h2 className="hero-title">JP Car Rental</h2>
        <p>Fast booking. Clean vehicles. Easy travel.</p>
      </div>
      <Link href="#cars" className="learn-more-box" onClick={scrollToCars}>
        Book Now
      </Link>
    </div>
  );
}
