"use client";

import { useState, type InputHTMLAttributes } from "react";

type AuthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

export function AuthInput({
  id,
  label,
  error,
  hint,
  type = "text",
  disabled,
  ...props
}: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const description = [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={isPassword && visible ? "text" : type}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={description || undefined}
          className={`min-h-13 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-60 ${isPassword ? "pr-14" : ""} ${error ? "border-danger" : "border-border"}`}
        />
        {isPassword && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setVisible(!visible)}
            aria-label={`${label} ${visible ? "숨기기" : "표시"}`}
            aria-controls={id}
            aria-pressed={visible}
            className="absolute top-1 right-1 flex h-11 w-11 items-center justify-center rounded-xl text-muted outline-none hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {visible && <path d="m3 3 18 18" />}
            </svg>
          </button>
        )}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-2 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
