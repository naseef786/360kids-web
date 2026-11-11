"use client";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="language-control">
      <label className="language-switcher">
        <span className="sr-only">{label}</span>
        <select
          aria-label={label}
          value={locale}
          disabled={pending}
          onChange={async (event) => {
            const nextLocale = event.target.value as Locale;
            setPending(true);
            setError("");
            try {
              const response = await fetch("/api/locale", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ locale: nextLocale }),
              });
              if (!response.ok) throw new Error("Unable to change language.");
              window.location.reload();
            } catch {
              setError(
                locale === "ar"
                  ? "تعذر تغيير اللغة. حاول مرة أخرى."
                  : "Unable to change language. Try again.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </label>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
