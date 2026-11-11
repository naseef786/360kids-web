export class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "RequestError";
  }
}

/** Shared by the cookie-backed browser client and server-side API reads. */
export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  try {
    const response = await fetch(url, { ...init, signal, cache: "no-store" });
    const text = await response.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : undefined; } catch { /* HTML gateway errors are not JSON. */ }
    if (!response.ok) {
      const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message.slice(0, 500)
        : `Service request failed (${response.status}). Please try again.`;
      throw new RequestError(response.status, message);
    }
    if (response.status !== 204 && data === undefined)
      throw new RequestError(502, "The service returned an unexpected response. Please try again.");
    return data as T;
  } catch (error) {
    if (init.signal?.aborted) throw init.signal.reason;
    if (timeout.aborted) throw new RequestError(408, "The request timed out. Please try again.");
    if (error instanceof RequestError) throw error;
    throw new RequestError(503, "Unable to reach the service. Check your connection and try again.");
  }
}
