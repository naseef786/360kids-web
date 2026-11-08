"use client";
import { useState, type FormEvent } from "react";
export type Field = {
  defaultValue?: string | number;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};
export function Form({
  fields,
  onSubmit,
  submit = "Save",
  children,
}: {
  fields: Field[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submit?: string;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await onSubmit(
        Object.fromEntries(new FormData(form)) as Record<string, string>,
      );
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={send} className="form">
      {fields.map((f) => (
        <label key={f.name}>
          {f.label}
          {f.type === "textarea" ? (
            <textarea
              defaultValue={f.defaultValue}
              name={f.name}
              required={f.required !== false}
              placeholder={f.placeholder}
            />
          ) : f.options ? (
            <select
              defaultValue={f.defaultValue}
              name={f.name}
              required={f.required !== false}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              defaultValue={f.defaultValue}
              name={f.name}
              type={f.type || "text"}
              step={f.type === "number" ? "any" : undefined}
              required={f.required !== false}
              placeholder={f.placeholder}
            />
          )}
        </label>
      ))}
      {children}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="success">
          Saved successfully.
        </p>
      )}
      <button disabled={busy}>{busy ? "Saving…" : submit}</button>
    </form>
  );
}
