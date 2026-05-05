"use client";

import * as React from "react";

type PasswordInputProps = {
  label: string;
  name: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
};

export default function PasswordInput({
  label,
  name,
  required,
  minLength,
  autoComplete,
}: PasswordInputProps) {
  const [show, setShow] = React.useState(false);
  const inputId = React.useId();

  return (
    <label htmlFor={inputId}>
      {label}
      <span className="auth-password-row">
        <input
          id={inputId}
          type={show ? "text" : "password"}
          name={name}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          onClick={() => setShow((v) => !v)}
        >
          {show ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
              <path d="M9.36 5.5A10.56 10.56 0 0112 5c5.05 0 9.27 3.11 10 7-0.28 1.5-1.12 2.93-2.35 4.12" />
              <path d="M6.24 6.24C3.98 7.45 2.35 9.58 2 12c0.73 3.89 4.95 7 10 7 1.76 0 3.43-0.38 4.9-1.06" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M2 12c0.73-3.89 4.95-7 10-7s9.27 3.11 10 7c-0.73 3.89-4.95 7-10 7S2.73 15.89 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </span>
    </label>
  );
}

