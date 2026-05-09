"use client";

import { useMemo, useState, useTransition } from "react";
import CustomSelect from "@/app/components/CustomSelect";
import { deleteContactOptionAction, saveContactOptionAction } from "@/app/admin/actions";
import {
  CONTACT_TYPE_LABELS,
  CONTACT_TYPES,
  type ContactOptionAdminRow,
  type ContactType,
} from "@/lib/contact-options-types";

export default function AdminContactManager({ initialOptions }: { initialOptions: ContactOptionAdminRow[] }) {
  const [options, setOptions] = useState(initialOptions);
  const [selectedId, setSelectedId] = useState("");
  const [contactType, setContactType] = useState<ContactType>("email");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedOption = options.find((option) => option.id === selectedId) ?? null;

  const contactTypeOptions = useMemo(
    () => CONTACT_TYPES.map((type) => ({ value: type, label: CONTACT_TYPE_LABELS[type] })),
    [],
  );

  function selectOption(id: string) {
    setSelectedId(id);
    const option = options.find((item) => item.id === id);
    setContactType(option?.contact_type ?? "email");
    setLabel(option?.label ?? "");
    setValue(option?.value ?? "");
    setSortOrder(option ? String(option.sort_order) : "0");
    setIsActive(option?.is_active ?? true);
    setMessage("");
  }

  function resetForm() {
    setSelectedId("");
    setContactType("email");
    setLabel("");
    setValue("");
    setSortOrder("0");
    setIsActive(true);
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const saved = await saveContactOptionAction(formData);
        setOptions((current) => {
          if (selectedId) {
            return current
              .map((item) =>
                item.id === selectedId
                  ? {
                      ...item,
                      contact_type: saved.contact_type,
                      label: saved.label,
                      value: saved.value,
                      sort_order: saved.sort_order,
                      is_active: saved.is_active,
                    }
                  : item,
              )
              .sort((a, b) => a.sort_order - b.sort_order || (a.label ?? "").localeCompare(b.label ?? "", "en"));
          }
          return [...current, saved].sort(
            (a, b) => a.sort_order - b.sort_order || (a.label ?? "").localeCompare(b.label ?? "", "en"),
          );
        });
        setMessage(selectedId ? "Contact updated." : "Contact added.");
        if (!selectedId) {
          resetForm();
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to save contact.");
      }
    });
  }

  function handleDelete() {
    if (!selectedOption) {
      setMessage("Select a contact first.");
      return;
    }
    const fd = new FormData();
    fd.set("id", selectedOption.id);
    startTransition(async () => {
      try {
        await deleteContactOptionAction(fd);
        setOptions((current) => current.filter((item) => item.id !== selectedOption.id));
        setMessage("Contact removed.");
        resetForm();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to delete contact.");
      }
    });
  }

  return (
    <section className="admin-manager">
      <aside className="admin-card">
        <h2>Contact channels</h2>
        {selectedId ? (
          <div className="admin-actions">
            <button type="button" className="admin-secondary-button" onClick={resetForm}>
              + Add new contact
            </button>
          </div>
        ) : null}
        <ul className="admin-list">
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="admin-select-button"
                onClick={() => selectOption(option.id)}
                aria-current={selectedOption?.id === option.id}
              >
                <strong>{option.label?.trim() || CONTACT_TYPE_LABELS[option.contact_type]}</strong>
                <span>
                  {CONTACT_TYPE_LABELS[option.contact_type]} · {option.is_active ? "Active" : "Hidden"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <article className="admin-card">
        <h2>{selectedId ? "Edit contact" : "Create contact"}</h2>
        <form className="admin-form" action={handleSubmit}>
          <input type="hidden" name="id" value={selectedId} />
          <input type="hidden" name="contactType" value={contactType} />
          <label>
            Type
            <CustomSelect
              options={contactTypeOptions}
              value={contactType}
              onChange={(next) => setContactType(next as ContactType)}
              optionsAriaLabel="Contact type"
              placeholder=""
            />
          </label>
          <label>
            Label
            <input name="label" value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <label>
            Value
            <input name="value" value={value} onChange={(event) => setValue(event.target.value)} required />
          </label>
          <label>
            Sort order
            <input
              name="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </label>
          <label className="admin-availability-field">
            <input type="hidden" name="isActive" value="false" />
            <input
              name="isActive"
              type="checkbox"
              value="true"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Show on website
          </label>
          <button type="submit" className="auth-primary" disabled={isPending}>
            {isPending ? "Saving..." : selectedId ? "Save changes" : "Add contact"}
          </button>
          {selectedId ? (
            <button type="button" className="admin-danger-button" onClick={handleDelete} disabled={isPending}>
              Delete contact
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
