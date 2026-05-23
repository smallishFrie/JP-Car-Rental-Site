"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motionTweens } from "@/lib/motion";

export type CustomSelectOption = { value: string; label: React.ReactNode };

type CustomSelectProps = {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shown on the closed trigger when no matching option label is found */
  placeholder?: string;
  /** Accessible name for the listbox panel */
  optionsAriaLabel: string;
  /** id for the trigger (e.g. to pair with <label htmlFor>) */
  id?: string;
  className?: string;
};

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Choose…",
  optionsAriaLabel,
  id,
  className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const triggerId = id ?? `${uid}-trigger`;
  const reduce = useReducedMotion();

  const selectedLabel = useMemo(() => {
    const match = options.find((o) => o.value === value);
    return match?.label ?? placeholder;
  }, [options, value, placeholder]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const field = containerRef.current;
      if (field && !field.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
      if (event.key === "Tab") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const selected = containerRef.current?.querySelector<HTMLButtonElement>(
      ".custom-select-option[aria-selected='true']",
    );
    window.requestAnimationFrame(() => {
      selected?.focus();
    });
  }, [open]);

  const panelTransition = reduce ? { duration: 0 } : motionTweens.press;

  return (
    <div className={`custom-select-field${className ? ` ${className}` : ""}`} ref={containerRef}>
      <button
        type="button"
        id={triggerId}
        ref={triggerRef}
        className="booking-date-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{selectedLabel}</span>
        <span
          className={`booking-date-trigger-chevron${open ? " booking-date-trigger-chevron-open" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            layout
            key="custom-select-panel"
            className="custom-select-dropdown popover-motion-layer"
            id={listId}
            role="listbox"
            aria-label={optionsAriaLabel}
            aria-hidden={false}
            initial={{ opacity: 0, y: -8, scale: 0.98, visibility: "hidden" }}
            animate={{ opacity: 1, y: 0, scale: 1, visibility: "visible" }}
            exit={{ opacity: 0, y: -6, scale: 0.98, visibility: "hidden" }}
            transition={panelTransition}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`custom-select-option${option.value === value ? " custom-select-option-selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
