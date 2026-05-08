"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MotionPressableButton } from "@/app/components/MotionPressable";
import CustomSelect from "@/app/components/CustomSelect";
import { deleteReviewAction, saveReviewAction, updateReviewAction } from "@/app/admin/actions";
import type { CarRecord } from "@/lib/cars";
import type { CarReviewRecord } from "@/lib/reviews";

type AdminReviewManagerProps = {
  initialReviews: CarReviewRecord[];
  initialCars: CarRecord[];
};

type ReviewFormState = {
  id: string;
  carId: string;
  reviewerName: string;
  countryOfOrigin: string;
  reviewText: string;
};

const buildEmptyForm = (cars: CarRecord[]): ReviewFormState => ({
  id: "",
  carId: cars[0]?.id ?? "",
  reviewerName: "",
  countryOfOrigin: "",
  reviewText: "",
});

function mapReviewToForm(review: CarReviewRecord): ReviewFormState {
  return {
    id: review.id,
    carId: review.car_id,
    reviewerName: review.reviewer_name,
    countryOfOrigin: review.country_of_origin,
    reviewText: review.review_text,
  };
}

export default function AdminReviewManager({ initialReviews, initialCars }: AdminReviewManagerProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [message, setMessage] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ReviewFormState>(buildEmptyForm(initialCars));

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedReviewId) ?? null,
    [reviews, selectedReviewId],
  );
  const isEditMode = Boolean(form.id);

  function selectReview(reviewId: string) {
    setSelectedReviewId(reviewId);
    const review = reviews.find((item) => item.id === reviewId);
    setForm(review ? mapReviewToForm(review) : buildEmptyForm(initialCars));
    setMessage("");
    setIsConfirmingDelete(false);
  }

  async function handleSubmit(formData: FormData) {
    const snapshot = { ...form };
    const action = snapshot.id ? updateReviewAction : saveReviewAction;
    startTransition(async () => {
      try {
        if (snapshot.id) {
          await action(formData);
          setReviews((current) =>
            current.map((review) =>
              review.id === snapshot.id
                ? {
                    ...review,
                    car_id: snapshot.carId,
                    reviewer_name: snapshot.reviewerName.trim(),
                    country_of_origin: snapshot.countryOfOrigin.trim(),
                    review_text: snapshot.reviewText.trim(),
                  }
                : review,
            ),
          );
          setMessage("Review updated.");
        } else {
          const savedId = await action(formData);
          const selectedCar = initialCars.find((car) => car.id === snapshot.carId) ?? null;
          setReviews((current) => [
            {
              id: savedId,
              car_id: snapshot.carId,
              reviewer_name: snapshot.reviewerName.trim(),
              country_of_origin: snapshot.countryOfOrigin.trim(),
              review_text: snapshot.reviewText.trim(),
              created_at: new Date().toISOString(),
              cars: selectedCar ? { name: selectedCar.name } : null,
            },
            ...current,
          ]);
          setSelectedReviewId(savedId);
          setForm({
            id: savedId,
            carId: snapshot.carId,
            reviewerName: snapshot.reviewerName.trim(),
            countryOfOrigin: snapshot.countryOfOrigin.trim(),
            reviewText: snapshot.reviewText.trim(),
          });
          setMessage("Review saved successfully.");
        }
        router.refresh();
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Something went wrong.";
        setMessage(errMessage);
      }
    });
  }

  function handleDelete() {
    const id = form.id.trim();
    if (!id) {
      setMessage("Select a review to delete.");
      return;
    }

    const formData = new FormData();
    formData.set("id", id);
    formData.set("carId", form.carId.trim());

    startTransition(async () => {
      try {
        await deleteReviewAction(formData);
        setReviews((current) => current.filter((review) => review.id !== id));
        setSelectedReviewId("");
        setForm(buildEmptyForm(initialCars));
        setIsConfirmingDelete(false);
        setMessage("Review deleted successfully.");
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
        <p className="admin-empty">Select a review to edit or create a new one.</p>
        {isEditMode ? (
          <div className="admin-actions">
            <button type="button" className="admin-secondary-button" onClick={() => selectReview("")}>
              + Add new review
            </button>
          </div>
        ) : null}
        <ul className="admin-list admin-review-list">
          {reviews.map((review) => (
            <li key={review.id}>
              <button
                type="button"
                className="admin-select-button"
                onClick={() => selectReview(review.id)}
                aria-current={selectedReview?.id === review.id}
              >
                <strong>{review.reviewer_name}</strong>
                <span>{review.country_of_origin}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <article className="admin-card">
        <h2>{isEditMode ? "Edit review" : "Create review"}</h2>
        {initialCars.length ? <form className="admin-form" action={handleSubmit}>
          <input type="hidden" name="id" value={form.id} />
          <input type="hidden" name="carId" value={form.carId} />

          <label>
            Car
            <CustomSelect
              options={initialCars.map((car) => ({ value: car.id, label: car.name }))}
              value={form.carId}
              onChange={(value) => setForm((current) => ({ ...current, carId: value }))}
              optionsAriaLabel="Cars"
            />
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
            {isPending ? "Saving..." : isEditMode ? "Save changes" : "Create review"}
          </MotionPressableButton>
          {isEditMode ? (
            isConfirmingDelete ? (
              <div className="admin-delete-confirm">
                <p>Delete this review permanently?</p>
                <p className="admin-delete-confirm-detail">This cannot be undone.</p>
                <div>
                  <button type="button" className="admin-danger-button" onClick={handleDelete} disabled={isPending}>
                    {isPending ? "Working..." : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="admin-danger-button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isPending}
              >
                Delete review
              </button>
            )
          ) : null}
        </form> : <p className="admin-empty">No cars available to attach new reviews.</p>}

        {message ? (
          <p className="booking-feedback" role="status">
            {message}
          </p>
        ) : null}
      </article>
    </section>
  );
}
