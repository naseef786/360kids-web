"use client";
import { useRef, useState, type FormEvent } from "react";
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
  successMessage = "Saved successfully.",
}: {
  fields: Field[];
  onSubmit: (data: Record<string, string>) => Promise<void | string>;
  submit?: string;
  children?: React.ReactNode;
  successMessage?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  const sending = useRef(false);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current) return;
    sending.current = true;
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const message = await onSubmit(
        Object.fromEntries(new FormData(form)) as Record<string, string>,
      );
      setSaved(message || successMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
      sending.current = false;
    }
  }
  return (
    <form onSubmit={send} className="form" aria-busy={busy}>
      {fields.map((f) => (
        <label key={f.name}>
          {f.label}
          {f.type === "textarea" ? (
            <textarea
              disabled={busy}
              defaultValue={f.defaultValue}
              name={f.name}
              required={f.required !== false}
              placeholder={f.placeholder}
            />
          ) : f.options ? (
            <select
              disabled={busy}
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
              disabled={busy}
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
          {saved}
        </p>
      )}
      <button disabled={busy}>{busy ? "Saving…" : submit}</button>
    </form>
  );
}
