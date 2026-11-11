"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/client-api";
import { fetchJson } from "@/lib/http";
import {
  localizedAuthMessage,
  type AuthCopy,
  type AuthMode,
} from "@/lib/auth-copy";
import type { Locale } from "@/lib/i18n";

export function SignOut({
  locale,
  label,
  pendingLabel,
}: {
  locale: Locale;
  label: string;
  pendingLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="text-link"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            await fetchJson("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "signout" }),
            });
            router.replace("/login");
            router.refresh();
          } catch (caught) {
            setError(localizedAuthMessage(locale, errorMessage(caught)));
            setPending(false);
          }
        }}
      >
        {pending ? pendingLabel : label}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function AuthForm({
  mode,
  next = "/parent",
  linkError = false,
  locale,
  copy,
}: {
  mode: AuthMode;
  next?: string;
  linkError?: boolean;
  locale: Locale;
  copy: AuthCopy;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(linkError ? copy.invalidLink : "");
  const sending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setPending(true);
    setMessage("");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await fetchJson<{ next?: string; message: string }>(
        "/api/auth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: mode,
            email: data.get("email"),
            password: data.get("password"),
            next,
          }),
        },
      );
      if (result.next) {
        router.replace(result.next);
        router.refresh();
      } else {
        setMessage(localizedAuthMessage(locale, result.message));
      }
    } catch (caught) {
      setError(localizedAuthMessage(locale, errorMessage(caught)));
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <section className="auth-card panel">
      <span className="eyebrow">{copy.eyebrow}</span>
      <h1>{copy.titles[mode]}</h1>
      <p>{copy.descriptions[mode]}</p>
      <form onSubmit={submit} className="form-stack" aria-busy={pending}>
        {mode !== "update-password" && (
          <label>
            {copy.email}
            <input
              disabled={pending}
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
        )}
        {mode !== "recover" && (
          <label>
            {copy.password}
            <input
              aria-label={copy.password}
              disabled={pending}
              name="password"
              type="password"
              minLength={mode === "signin" ? 1 : 8}
              maxLength={128}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              required
            />
            {mode !== "signin" && (
              <small className="fine-print">{copy.passwordHint}</small>
            )}
          </label>
        )}
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        <button className="btn" disabled={pending}>
          {pending ? copy.pleaseWait : copy.submit[mode]}
        </button>
      </form>
      <div className="auth-links">
        {mode === "signin" ? (
          <>
            <Link href={`/forgot-password?next=${encodeURIComponent(next)}`}>
              {copy.forgotPassword}
            </Link>
            <Link href={`/signup?next=${encodeURIComponent(next)}`}>
              {copy.createAccount}
            </Link>
          </>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            {copy.backToSignIn}
          </Link>
        )}
      </div>
    </section>
  );
}
