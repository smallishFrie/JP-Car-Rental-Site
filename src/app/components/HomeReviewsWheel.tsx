import type { CarReview } from "@/lib/reviews";

type HomeReviewsWheelProps = {
  reviews: CarReview[];
};

export default function HomeReviewsWheel({ reviews }: HomeReviewsWheelProps) {
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
    <section className="home-reviews-section" aria-labelledby="home-reviews-heading">
      <div className="home-reviews-shell">
        <p className="home-reviews-eyebrow">Real customer reviews</p>
        <h2 className="home-section-heading" id="home-reviews-heading">
          Trusted rides, reviewed by real travelers.
        </h2>
        <p className="home-reviews-subline">
          Honest feedback from recent bookings, curated for a quick quality check before you reserve.
        </p>
      </div>
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
