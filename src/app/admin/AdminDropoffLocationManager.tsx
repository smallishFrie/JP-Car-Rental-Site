"use client";

import { useState, useTransition } from "react";
import { deleteDropoffLocationAction, saveDropoffLocationAction } from "@/app/admin/actions";

type DropoffLocationItem = {
  id: string;
  name: string;
  extraFee: number;
};

export default function AdminDropoffLocationManager({ initialLocations }: { initialLocations: DropoffLocationItem[] }) {
  const [locations, setLocations] = useState(initialLocations);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [extraFee, setExtraFee] = useState("0");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedLocation = locations.find((location) => location.id === selectedId) ?? null;

  function selectLocation(id: string) {
    setSelectedId(id);
    const location = locations.find((item) => item.id === id);
    setName(location?.name ?? "");
    setExtraFee(location ? String(location.extraFee) : "0");
    setMessage("");
  }

  function resetForm() {
    setSelectedId("");
    setName("");
    setExtraFee("0");
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const saved = await saveDropoffLocationAction(formData);
        setLocations((current) => {
          if (selectedId) {
            return current.map((item) =>
              item.id === selectedId ? { ...item, name: saved.name, extraFee: saved.extraFee } : item,
            );
          }
          return [...current, { id: saved.id, name: saved.name, extraFee: saved.extraFee }].sort((a, b) =>
            a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
          );
        });
        setMessage(selectedId ? "Location updated." : "Location added.");
        if (!selectedId) {
          resetForm();
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to save location.");
      }
    });
  }

  function handleDelete() {
    if (!selectedLocation) {
      setMessage("Select a location first.");
      return;
    }
    const fd = new FormData();
    fd.set("id", selectedLocation.id);
    startTransition(async () => {
      try {
        await deleteDropoffLocationAction(fd);
        setLocations((current) => current.filter((item) => item.id !== selectedLocation.id));
        setMessage("Location deleted.");
        resetForm();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to delete location.");
      }
    });
  }

  return (
    <section className="admin-manager">
      <aside className="admin-card">
        <h2>Locations</h2>
        <p className="admin-empty">Add and manage locations with extra fees.</p>
        {selectedId ? (
          <div className="admin-actions">
            <button type="button" className="admin-secondary-button" onClick={resetForm}>
              + Add new location
            </button>
          </div>
        ) : null}
        <ul className="admin-list">
          {locations.map((location) => (
            <li key={location.id}>
              <button
                type="button"
                className="admin-select-button"
                onClick={() => selectLocation(location.id)}
                aria-current={selectedLocation?.id === location.id}
              >
                <strong>{location.name}</strong>
                <span>Extra fee: PHP {location.extraFee.toFixed(2)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <article className="admin-card">
        <h2>{selectedId ? "Edit location" : "Create location"}</h2>
        <form className="admin-form" action={handleSubmit}>
          <input type="hidden" name="id" value={selectedId} />
          <label>
            Location name
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Airport Terminal"
              required
            />
          </label>
          <label>
            Extra fee (PHP)
            <input
              name="extraFee"
              type="number"
              min={0}
              step="0.01"
              value={extraFee}
              onChange={(event) => setExtraFee(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="auth-primary" disabled={isPending}>
            {isPending ? "Saving..." : selectedId ? "Save changes" : "Add location"}
          </button>
          {selectedId ? (
            <button type="button" className="admin-danger-button" onClick={handleDelete} disabled={isPending}>
              Delete location
            </button>
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
