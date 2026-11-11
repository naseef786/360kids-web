export function safeNext(value: unknown, fallback = "/parent"): string {
  if(typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = "https://local.invalid";
    const destination = new URL(value,base);
    return destination.origin === base ? destination.pathname + destination.search + destination.hash : fallback;
  } catch { return fallback; }
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
