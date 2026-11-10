"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/client-api";
export function SignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      <button
        className="text-link"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            const response = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "signout" }),
            });
            if (!response.ok)
              throw new Error("Unable to sign out. Please try again.");
            router.replace("/login");
            router.refresh();
          } catch (e) {
            setError(errorMessage(e));
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function AuthForm({
  mode,
  next = "/parent",
  linkError = false,
}: {
  mode: "signin" | "signup" | "recover" | "update-password";
  next?: string;
  linkError?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(
      linkError
        ? "This link has expired or is invalid. Please request a new one."
        : "",
    );
  const title = {
    signin: "Welcome back",
    signup: "Start your family account",
    recover: "Reset your password",
    "update-password": "Choose a new password",
  }[mode];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          email: data.get("email"),
          password: data.get("password"),
          next,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      if (result.next) {
        router.replace(result.next);
        router.refresh();
      } else setMessage(result.message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="auth-card panel">
      <span className="eyebrow">EXPLORE. PLAY. GROW.</span>
      <h1>{title}</h1>
      <p>
        {mode === "signin"
          ? "A little more discovery, a lot more possibility."
          : mode === "signup"
            ? "Find activities and manage your family in one place."
            : "We’ll help you get back to your family activities."}
      </p>
      <form onSubmit={submit} className="form-stack">
        {mode !== "update-password" && (
          <label>
            Email address
            <input
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
            Password
            <input
              aria-label="Password"
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
              <small className="fine-print">At least 8 characters.</small>
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
          {pending
            ? "Please wait…"
            : {
                signin: "Sign in",
                signup: "Create account",
                recover: "Send reset link",
                "update-password": "Update password",
              }[mode]}
        </button>
      </form>
      <div className="auth-links">
        {mode === "signin" ? (
          <>
            <Link href="/forgot-password">Forgot password?</Link>
            <Link href={`/signup?next=${encodeURIComponent(next)}`}>
              Create an account
            </Link>
          </>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            Back to sign in
          </Link>
        )}
      </div>
    </section>
  );
}
