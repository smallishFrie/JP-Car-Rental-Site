"use client";

import { MotionPressableButton } from "@/app/components/MotionPressable";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import CustomSelect from "@/app/components/CustomSelect";
import type { CarRecord } from "@/lib/cars";
import { confirmCarTurnoverAction, deleteCarAction, saveCarAction } from "@/app/admin/actions";
import {
  categoryTokensWithoutTransmission,
  parseCategoryTokens,
  transmissionFromCategoryTokens,
} from "@/lib/carDisplay";

type AdminCarManagerProps = {
  initialCars: CarRecord[];
};

type FormState = {
  id: string;
  name: string;
  categoryOption: string;
  customCategory: string;
  transmission: "Automatic" | "Manual";
  tagline: string;
  description: string;
  dayRate: string;
  passengerCapacity: string;
  isActive: boolean;
  existingCardImage: string;
  existingGalleryImages: string[];
};

const CATEGORY_OPTIONS = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Crossover",
  "Coupe",
  "Convertable",
  "Station Wagon",
  "MPV",
  "Pickup Trick",
] as const;

const CUSTOM_CATEGORY_VALUE = "__custom__";
const TRANSMISSION_OPTIONS = ["Automatic", "Manual"] as const;

function parseFormCategory(categoryText: string): Pick<FormState, "categoryOption" | "customCategory" | "transmission"> {
  const tokens = parseCategoryTokens(categoryText);
  const categoryToken = categoryTokensWithoutTransmission(tokens)[0]?.trim() ?? "";
  const detectedTransmission = transmissionFromCategoryTokens(tokens);
  const transmission = detectedTransmission === "manual" ? "Manual" : "Automatic";
  if (categoryToken && CATEGORY_OPTIONS.includes(categoryToken as (typeof CATEGORY_OPTIONS)[number])) {
    return {
      categoryOption: categoryToken,
      customCategory: "",
      transmission,
    };
  }
  return {
    categoryOption: CUSTOM_CATEGORY_VALUE,
    customCategory: categoryToken,
    transmission,
  };
}

function composeCategoryValue(form: FormState): string {
  const category =
    form.categoryOption === CUSTOM_CATEGORY_VALUE ? form.customCategory.trim() : form.categoryOption.trim();
  return [category, form.transmission].filter(Boolean).join(", ");
}

const emptyForm: FormState = {
  id: "",
  name: "",
  categoryOption: CATEGORY_OPTIONS[0],
  customCategory: "",
  transmission: "Automatic",
  tagline: "",
  description: "",
  dayRate: "",
  passengerCapacity: "",
  isActive: true,
  existingCardImage: "",
  existingGalleryImages: [],
};

function mapCarToForm(car: CarRecord): FormState {
  const categoryState = parseFormCategory(car.category);
  return {
    id: car.id,
    name: car.name,
    categoryOption: categoryState.categoryOption,
    customCategory: categoryState.customCategory,
    transmission: categoryState.transmission,
    tagline: car.tagline,
    description: car.description,
    dayRate: String(car.day_rate),
    passengerCapacity: car.passenger_capacity != null ? String(car.passenger_capacity) : "",
    isActive: car.is_active,
    existingCardImage: car.card_image_url,
    existingGalleryImages: car.gallery_image_urls ?? [],
  };
}

export default function AdminCarManager({ initialCars }: AdminCarManagerProps) {
  const router = useRouter();
  const [cars, setCars] = useState<CarRecord[]>(initialCars);
  const [selectedCarId, setSelectedCarId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedCar = useMemo(
    () => cars.find((car) => car.id === selectedCarId) ?? null,
    [cars, selectedCarId],
  );

  /** Bookings that are not completed/canceled (still tied to live inventory). */
  const blockingBookingCount = selectedCar?.booking_count ?? 0;
  const canHardDelete = blockingBookingCount === 0;

  const isEditMode = Boolean(form.id);

  function chooseCar(carId: string) {
    setSelectedCarId(carId);
    const car = cars.find((item) => item.id === carId);
    setForm(car ? mapCarToForm(car) : emptyForm);
    setMessage("");
    setIsConfirmingDelete(false);
  }

  function removeExistingGalleryImage(url: string) {
    setForm((current) => ({
      ...current,
      existingGalleryImages: current.existingGalleryImages.filter((item) => item !== url),
    }));
  }

  async function handleSubmit(formData: FormData) {
    const formSnapshot = { ...form };
    const categoryValue = composeCategoryValue(formSnapshot);
    formData.set("category", categoryValue);
    startTransition(async () => {
      try {
        const savedId = await saveCarAction(formData);
        setCars((currentCars) => {
          const existingCar = currentCars.find((car) => car.id === savedId);
          if (!existingCar) {
            return currentCars;
          }

          return currentCars.map((car) =>
            car.id === savedId
              ? {
                  ...car,
                  name: formSnapshot.name.trim(),
                  category: categoryValue,
                  tagline: formSnapshot.tagline.trim(),
                  description: formSnapshot.description.trim(),
                  day_rate: Number(formSnapshot.dayRate),
                  passenger_capacity:
                    formSnapshot.passengerCapacity.trim() === ""
                      ? null
                      : Number(formSnapshot.passengerCapacity),
                  is_active: formSnapshot.isActive,
                }
              : car,
          );
        });
        setMessage("Car saved successfully.");
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Something went wrong.";
        setMessage(errMessage);
      }
    });
  }

  async function handleConfirmTurnover() {
    const id = selectedCar?.id?.trim();
    if (!id) {
      setMessage("Select a car first.");
      return;
    }

    const fd = new FormData();
    fd.set("carId", id);

    startTransition(async () => {
      try {
        await confirmCarTurnoverAction(fd);
        setCars((currentCars) =>
          currentCars.map((car) => (car.id === id ? { ...car, pending_turnover: false } : car)),
        );
        setMessage("Turnover confirmed — this car is available on the site again.");
        router.refresh();
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Something went wrong.";
        setMessage(errMessage);
      }
    });
  }

  async function handleDelete() {
    const id = form.id.trim();
    if (!id) {
      setMessage("Select a car first.");
      return;
    }

    const deleteFormData = new FormData();
    deleteFormData.set("id", id);

    startTransition(async () => {
      try {
        await deleteCarAction(deleteFormData);
        setMessage("Car deleted successfully.");
        setCars((currentCars) => currentCars.filter((car) => car.id !== id));
        setSelectedCarId("");
        setForm(emptyForm);
        setIsConfirmingDelete(false);
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Something went wrong.";
        setMessage(errMessage);
      }
    });
  }

  return (
    <section className="admin-manager">
      <aside className="admin-card">
        <h2>Inventory</h2>
        <p className="admin-empty">Select a car to edit or create a new one.</p>
        {isEditMode ? (
          <div className="admin-actions">
            <button type="button" className="admin-secondary-button" onClick={() => chooseCar("")}>
              + Add new car
            </button>
          </div>
        ) : null}
        <ul className="admin-list">
          {cars.map((car) => (
            <li key={car.id}>
              <button
                type="button"
                className="admin-select-button"
                onClick={() => chooseCar(car.id)}
                aria-current={selectedCar?.id === car.id}
              >
                <strong>{car.name}</strong>
                <span>
                  {car.category} - {car.tagline}
                  {!car.is_active ? " (Unavailable)" : ""}
                  {car.pending_turnover ? " · Needs turnover" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <article className="admin-card">
        <h2>{isEditMode ? "Edit car" : "Create car"}</h2>
        {selectedCar?.pending_turnover ? (
          <div className="admin-turnover-banner" role="region" aria-label="Turnover confirmation">
            <p>
              <strong>Turnover required.</strong> This vehicle finished an on-rent period. Confirm turnover before it can
              appear in the public fleet again.
            </p>
            <MotionPressableButton type="button" className="auth-primary" disabled={isPending} onClick={handleConfirmTurnover}>
              {isPending ? "Working…" : "Confirm turnover & return to listing"}
            </MotionPressableButton>
          </div>
        ) : null}
        <form className="admin-form" action={handleSubmit}>
          <input type="hidden" name="id" value={form.id} />
          <input type="hidden" name="existingCardImage" value={form.existingCardImage} />
          {form.existingGalleryImages.map((url) => (
            <input key={url} type="hidden" name="existingGalleryImages" value={url} />
          ))}

          <label>
            Car name
            <input
              name="name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>

          <label>
            Category
            <input type="hidden" name="category" value={composeCategoryValue(form)} />
            <CustomSelect
              options={[
                ...CATEGORY_OPTIONS.map((option) => ({ value: option, label: option })),
                { value: CUSTOM_CATEGORY_VALUE, label: "Custom" },
              ]}
              value={form.categoryOption}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  categoryOption: value,
                }))
              }
              optionsAriaLabel="Car categories"
            />
          </label>
          {form.categoryOption === CUSTOM_CATEGORY_VALUE ? (
            <label>
              Custom category
              <input
                value={form.customCategory}
                onChange={(event) => setForm((current) => ({ ...current, customCategory: event.target.value }))}
                required
              />
            </label>
          ) : null}

          <label>
            Transmission
            <CustomSelect
              options={TRANSMISSION_OPTIONS.map((option) => ({ value: option, label: option }))}
              value={form.transmission}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  transmission: value === "Manual" ? "Manual" : "Automatic",
                }))
              }
              optionsAriaLabel="Transmission type"
            />
          </label>

          <label>
            Passenger capacity
            <input
              name="passengerCapacity"
              type="number"
              min={1}
              max={55}
              step={1}
              value={form.passengerCapacity}
              onChange={(event) => setForm((current) => ({ ...current, passengerCapacity: event.target.value }))}
            />
          </label>

          <label>
            Tagline
            <input
              name="tagline"
              value={form.tagline}
              onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              required
            />
          </label>

          <label>
            Day rate (PHP)
            <input
              name="dayRate"
              type="number"
              min={0}
              step="0.01"
              value={form.dayRate}
              onChange={(event) => setForm((current) => ({ ...current, dayRate: event.target.value }))}
              required
            />
          </label>

          <label className="admin-availability-field">
            <input type="hidden" name="isActive" value="false" />
            <input
              name="isActive"
              type="checkbox"
              value="true"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Available for booking
          </label>

          <label>
            List image
            <input name="cardImage" type="file" accept="image/*" />
          </label>

          {form.existingCardImage ? (
            <p className="admin-file-note">Current list image is saved. Upload a new file to replace it.</p>
          ) : null}

          <label>
            Slideshow images
            <input name="galleryImages" type="file" accept="image/*" multiple />
          </label>

          {form.existingGalleryImages.length ? (
            <div className="admin-existing-images">
              <p className="admin-existing-images-title">Existing slideshow images</p>
              <ul>
                {form.existingGalleryImages.map((url) => (
                  <li key={url}>
                    <img src={url} alt="Existing slideshow image" loading="lazy" />
                    <div className="admin-existing-images-meta">
                      <span>{url.split("/").pop() ?? "Image file"}</span>
                      <small>{url}</small>
                    </div>
                    <button type="button" onClick={() => removeExistingGalleryImage(url)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <MotionPressableButton type="submit" className="auth-primary" disabled={isPending}>
            {isPending ? "Saving..." : isEditMode ? "Save changes" : "Create car"}
          </MotionPressableButton>
          {isEditMode ? (
            !canHardDelete ? (
              <div className="admin-delete-blocked" role="note">
                <p>
                  This car has {blockingBookingCount} open reservation
                  {blockingBookingCount === 1 ? "" : "s"}, so it cannot be removed from the database yet.
                </p>
              </div>
            ) : isConfirmingDelete ? (
              <div className="admin-delete-confirm">
                <p>Delete this car permanently?</p>
                <p className="admin-delete-confirm-detail">This cannot be undone. Images in storage will be removed.</p>
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
                Delete car
              </button>
            )
          ) : null}
          {message ? (
            <p className="booking-feedback" role="status">
              {message}
            </p>
          ) : null}
        </form>
      </article>
    </section>
  );
}
