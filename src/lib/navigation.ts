export function safeNext(value: unknown, fallback = "/parent"): string {
  if(typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = "https://local.invalid";
    const destination = new URL(value,base);
    return destination.origin === base ? destination.pathname + destination.search + destination.hash : fallback;
  } catch { return fallback; }
}

export function passwordResetPath(next: unknown): string {
  return `/reset-password?${new URLSearchParams({ next: safeNext(next) })}`;
}

/** Keep the safe return destination through both valid and expired auth links. */
export function authCallbackPath(next: unknown, type: string | null, success: boolean): string {
  let destination = safeNext(next);
  let parsed = new URL(destination, "https://local.invalid");
  if (type === "recovery" && parsed.pathname !== "/reset-password") {
    destination = passwordResetPath(destination);
    parsed = new URL(destination, "https://local.invalid");
  }
  if (success) return destination;
  const recovery = parsed.pathname === "/reset-password";
  return `${recovery ? "/forgot-password" : "/login"}?${new URLSearchParams({
    error: "link",
    next: recovery ? safeNext(parsed.searchParams.get("next")) : destination,
  })}`;
}
export function safeReturnTo(value: string | null, origin: string): string {
  if (!value?.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(value))
    return "/account";
  try {
    const destination = new URL(value, origin);
    return destination.origin === origin
      ? destination.pathname + destination.search + destination.hash
      : "/account";
  } catch {
    return "/account";
  }
}
