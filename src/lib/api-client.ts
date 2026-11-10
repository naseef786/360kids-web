export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export interface Identity {
  id: string;
  token: string;
}
export interface RequestOptions {
  public?: boolean;
  signal?: AbortSignal;
}
interface Dependencies {
  baseUrl: string;
  getIdentity: () => Promise<Identity | null>;
  fetcher?: typeof fetch;
  randomId?: () => string;
  timeoutMs?: number;
}
function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const stop = () => reject(signal.reason);
    signal.addEventListener("abort", stop, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", stop));
  });
}
export function createApiClient({
  baseUrl,
  getIdentity,
  fetcher = fetch,
  randomId = () => crypto.randomUUID(),
  timeoutMs = 15000,
}: Dependencies) {
  // Preserve an intent key after a lost response. A retry must not create a
  // second command. Keys are account-scoped, bounded and kept in memory only.
  const pending = new Map<string, { id: string; until: number }>();
  return async function api<T>(
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    if (!baseUrl)
      throw new ApiError("The API URL has not been configured.", 503);
    const endpoint = baseUrl.replace(/\/+$/, "") + "/v1" + path;
    const controller = new AbortController();
    const stop = () =>
      controller.abort(new DOMException("Request cancelled.", "AbortError"));
    if (options.signal?.aborted) stop();
    else options.signal?.addEventListener("abort", stop, { once: true });
    const timer = setTimeout(
      () =>
        controller.abort(
          new DOMException("Request timed out.", "TimeoutError"),
        ),
      timeoutMs,
    );
    let intent: string | undefined;
    try {
      const identity = options.public
        ? null
        : await abortable(getIdentity(), controller.signal);
      const write = body !== undefined;
      if (write && /^\/bookings(?:\/[0-9a-f-]+\/actions)?$/i.test(path)) {
        const now = Date.now();
        for (const [key, value] of pending)
          if (value.until <= now) pending.delete(key);
        intent = JSON.stringify([identity?.id ?? null, path, body]);
        if (!pending.has(intent)) {
          if (pending.size >= 100) pending.delete(pending.keys().next().value!);
          pending.set(intent, { id: randomId(), until: now + 600000 });
        }
      }
      const response = await abortable(
        fetcher(endpoint, {
          method: write ? "POST" : "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            ...(write
              ? {
                  "Content-Type": "application/json",
                  "Idempotency-Key": intent
                    ? pending.get(intent)!.id
                    : randomId(),
                }
              : {}),
            ...(identity ? { Authorization: "Bearer " + identity.token } : {}),
          },
          body: write ? JSON.stringify(body) : undefined,
        }),
        controller.signal,
      );
      const raw = await abortable(response.text(), controller.signal);
      let data: unknown;
      try {
        data = raw ? JSON.parse(raw) : undefined;
      } catch {
        /* Gateways can return HTML error pages. */
      }
      if (!response.ok) {
        if (
          intent &&
          response.status < 500 &&
          ![408, 429].includes(response.status)
        )
          pending.delete(intent);
        const message =
          data &&
          typeof data === "object" &&
          "message" in data &&
          typeof data.message === "string"
            ? data.message.slice(0, 500)
            : `Service request failed (HTTP ${response.status}). Please try again.`;
        throw new ApiError(message, response.status);
      }
      if (response.status !== 204 && data === undefined)
        throw new ApiError(
          "The service returned an unexpected response. Please try again.",
          502,
        );
      if (intent) pending.delete(intent);
      if (identity) {
        const current = await abortable(getIdentity(), controller.signal);
        if (current?.id !== identity.id)
          throw new ApiError(
            "Your account changed. Reload before continuing.",
            409,
          );
      }
      return data as T;
    } catch (error) {
      if (controller.signal.aborted) {
        if (controller.signal.reason?.name === "TimeoutError")
          throw new ApiError("The request timed out. Please try again.", 408);
        throw controller.signal.reason;
      }
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "Unable to reach the service. Check your connection and try again.",
        503,
      );
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", stop);
    }
  };
}
