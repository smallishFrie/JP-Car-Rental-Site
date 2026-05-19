"use client";

import type { CarReview } from "@/lib/reviews";
import { KineticItem, KineticReveal, KineticStagger } from "@/app/components/kinetic";
import { useKineticSectionLive } from "@/app/components/kinetic/useKineticSectionLive";
import {
  HOME_REVIEWS_HEADER_PRESETS,
  HOME_SECTION_PRESETS,
  homePresetAt,
} from "@/lib/kinetic-presets";

type HomeReviewsWheelProps = {
  reviews: CarReview[];
};

export default function HomeReviewsWheel({ reviews }: HomeReviewsWheelProps) {
  const { ref, liveClass } = useKineticSectionLive<HTMLElement>();

  if (!reviews.length) {
    return null;
  }

  const visibleReviews = reviews.slice(0, 12);
  const hasTickerLoop = visibleReviews.length > 1;
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  });
  const cards = visibleReviews.map((review) => {
    const parsedDate = new Date(review.createdAt);
    const reviewDate = Number.isNaN(parsedDate.getTime()) ? "Recent trip" : dateFormatter.format(parsedDate);
    return {
      id: review.id,
      reviewText: review.reviewText,
      reviewerName: review.reviewerName,
      countryOfOrigin: review.countryOfOrigin,
      createdAt: review.createdAt,
      reviewDate,
    };
  });

  const renderRun = (keyPrefix: string, ariaHidden = false) => (
    <ul className="home-reviews-run" aria-hidden={ariaHidden ? "true" : undefined}>
      {cards.map((card) => (
        <li key={`${keyPrefix}-${card.id}`} className="home-reviews-run-item">
          <article className="home-review-card">
            <p className="home-review-text">{card.reviewText}</p>
            <div className="home-review-footer">
              <p className="home-review-meta">
                <strong>{card.reviewerName}</strong>
                <span>{card.countryOfOrigin}</span>
              </p>
              <p className="home-review-chips">
                <time className="home-review-chip" dateTime={card.createdAt}>
                  {card.reviewDate}
                </time>
              </p>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );

  return (
    <section ref={ref} className={`home-reviews-section kinetic-section${liveClass}`} aria-labelledby="home-reviews-heading">
      <KineticStagger className="home-reviews-shell">
        <KineticItem as="motion.p" className="home-reviews-eyebrow" preset={homePresetAt(HOME_REVIEWS_HEADER_PRESETS, 0)}>
          Real customer reviews
        </KineticItem>
        <KineticReveal as="motion.h2" className="home-section-heading" id="home-reviews-heading" preset={HOME_SECTION_PRESETS.reviewsHeading} inView={false}>
          Trusted rides, reviewed by real travelers.
        </KineticReveal>
        <KineticItem as="motion.p" className="home-reviews-subline" preset={homePresetAt(HOME_REVIEWS_HEADER_PRESETS, 2)}>
          Honest feedback from recent bookings, curated for a quick quality check before you reserve.
        </KineticItem>
      </KineticStagger>
      <div className="home-reviews-wheel-outer">
        <div className="home-reviews-wheel" aria-label="Scrolling car rental reviews">
          <div className={`home-reviews-track${hasTickerLoop ? "" : " home-reviews-track-single"}`}>
            {renderRun("primary")}
            {hasTickerLoop ? renderRun("clone", true) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
