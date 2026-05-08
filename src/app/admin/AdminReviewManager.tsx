"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MotionPressableButton } from "@/app/components/MotionPressable";
import { deleteReviewAction, saveReviewAction } from "@/app/admin/actions";
import type { CarRecord } from "@/lib/cars";
import type { CarReviewRecord } from "@/lib/reviews";

type AdminReviewManagerProps = {
  initialReviews: CarReviewRecord[];
  initialCars: CarRecord[];
};

type ReviewFormState = {
  carId: string;
  reviewerName: string;
  countryOfOrigin: string;
  reviewText: string;
};

export default function AdminReviewManager({ initialReviews, initialCars }: AdminReviewManagerProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ReviewFormState>({
    carId: initialCars[0]?.id ?? "",
    reviewerName: "",
    countryOfOrigin: "",
    reviewText: "",
  });

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedReviewId) ?? null,
    [reviews, selectedReviewId],
  );

  function getCarName(carId: string) {
    return initialCars.find((car) => car.id === carId)?.name ?? carId;
  }

  async function handleSave(formData: FormData) {
    const snapshot = { ...form };
    startTransition(async () => {
      try {
        const savedId = await saveReviewAction(formData);
        setReviews((current) => [
          {
            id: savedId,
            car_id: snapshot.carId,
            reviewer_name: snapshot.reviewerName.trim(),
            country_of_origin: snapshot.countryOfOrigin.trim(),
            review_text: snapshot.reviewText.trim(),
            created_at: new Date().toISOString(),
            cars: { name: getCarName(snapshot.carId) },
          },
          ...current,
        ]);
        setForm((current) => ({
          ...current,
          reviewerName: "",
          countryOfOrigin: "",
          reviewText: "",
        }));
        setMessage("Review saved and published.");
        router.refresh();
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Something went wrong.";
        setMessage(errMessage);
      }
    });
  }

  function handleDelete() {
    if (!selectedReview) {
      setMessage("Select a review to delete.");
      return;
    }

    const formData = new FormData();
    formData.set("id", selectedReview.id);
    formData.set("carId", selectedReview.car_id);

    startTransition(async () => {
      try {
        await deleteReviewAction(formData);
        setReviews((current) => current.filter((review) => review.id !== selectedReview.id));
        setSelectedReviewId("");
        setMessage("Review deleted.");
        router.refresh();
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Something went wrong.";
        setMessage(errMessage);
      }
    });
  }

  return (
    <section className="admin-manager">
      <aside className="admin-card">
        <h2>Reviews</h2>
        <p className="admin-empty">Select a review to remove it.</p>
        <ul className="admin-list admin-review-list">
          {reviews.map((review) => (
            <li key={review.id}>
              <button
                type="button"
                className="admin-select-button"
                onClick={() => setSelectedReviewId(review.id)}
                aria-current={selectedReview?.id === review.id}
              >
                <strong>{review.reviewer_name}</strong>
                <span>{review.country_of_origin}</span>
                <span className="admin-review-list-meta">{review.cars?.name ?? getCarName(review.car_id)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <article className="admin-card">
        <h2>Add review</h2>
        <form className="admin-form" action={handleSave}>
          <label>
            Car
            <select
              name="carId"
              value={form.carId}
              onChange={(event) => setForm((current) => ({ ...current, carId: event.target.value }))}
              required
            >
              {initialCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Name
            <input
              name="reviewerName"
              value={form.reviewerName}
              onChange={(event) => setForm((current) => ({ ...current, reviewerName: event.target.value }))}
              required
            />
          </label>

          <label>
            Country of origin
            <input
              name="countryOfOrigin"
              value={form.countryOfOrigin}
              onChange={(event) => setForm((current) => ({ ...current, countryOfOrigin: event.target.value }))}
              required
            />
          </label>

          <label>
            Review
            <textarea
              name="reviewText"
              value={form.reviewText}
              rows={4}
              onChange={(event) => setForm((current) => ({ ...current, reviewText: event.target.value }))}
              required
            />
          </label>

          <MotionPressableButton type="submit" className="auth-primary" disabled={isPending}>
            {isPending ? "Saving..." : "Save review"}
          </MotionPressableButton>
        </form>

        {selectedReview ? (
          <div className="admin-review-selected">
            <p className="admin-review-selected-text">
              Selected review by <strong>{selectedReview.reviewer_name}</strong> for{" "}
              <strong>{selectedReview.cars?.name ?? getCarName(selectedReview.car_id)}</strong>.
            </p>
            <button type="button" className="admin-danger-button" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Working..." : "Delete selected review"}
            </button>
          </div>
        ) : null}

        {message ? (
          <p className="booking-feedback" role="status">
            {message}
          </p>
        ) : null}
      </article>
    </section>
  );
}
