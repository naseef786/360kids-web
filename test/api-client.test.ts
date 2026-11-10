import test from "node:test";
import assert from "node:assert/strict";
import {
  createApiClient,
  ApiError,
  type Identity,
} from "../src/lib/api-client";
import { safeReturnTo } from "../src/lib/navigation";
const user: Identity = { id: "synthetic-parent", token: "synthetic-token" };
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("a lost booking response retries the same intent, successful new intents get a new key", async () => {
  const keys: string[] = [];
  let attempt = 0,
    ids = 0;
  const api = createApiClient({
    baseUrl: "https://api.example.invalid/",
    getIdentity: async () => user,
    randomId: () => `synthetic-${++ids}`,
    fetcher: async (input, init) => {
      assert.equal(input, "https://api.example.invalid/v1/bookings");
      keys.push((init?.headers as Record<string, string>)["Idempotency-Key"]);
      if (++attempt === 1) throw new TypeError("Synthetic lost response");
      return json({ id: "synthetic-booking" });
    },
  });
  const body = {
    sessionId: "synthetic-session",
    childIds: ["synthetic-child"],
    policyAccepted: true,
  };
  await assert.rejects(() => api("/bookings", body), /Unable to reach/);
  await api("/bookings", body);
  await api("/bookings", body);
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[1], keys[2]);
});
test("an account change rejects a private response and never reuses the previous account intent key", async () => {
  let identity: Identity | null = user;
  const keys: string[] = [];
  const api = createApiClient({
    baseUrl: "https://api.example.invalid",
    getIdentity: async () => identity,
    fetcher: async (_input, init) => {
      keys.push((init?.headers as Record<string, string>)["Idempotency-Key"]);
      identity = { id: "synthetic-other", token: "synthetic-other-token" };
      return json({ private: "synthetic account data" });
    },
  });
  await assert.rejects(
    () => api("/bookings", { synthetic: true }),
    /account changed/,
  );
  await api("/bookings", { synthetic: true });
  assert.notEqual(keys[0], keys[1]);
});
test("public browsing does not wait for authentication or send an access token", async () => {
  const api = createApiClient({
    baseUrl: "https://api.example.invalid",
    getIdentity: async () => {
      throw new Error("Authentication must not be called");
    },
    fetcher: async (_input, init) => {
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        undefined,
      );
      return json([]);
    },
  });
  assert.deepEqual(await api("/activities", undefined, { public: true }), []);
});
test("proxy HTML errors and malformed successful responses remain usable errors", async () => {
  const api = createApiClient({
    baseUrl: "https://api.example.invalid",
    getIdentity: async () => null,
    fetcher: async () =>
      new Response("<html>Gateway unavailable</html>", { status: 503 }),
  });
  await assert.rejects(
    () => api("/activities"),
    (e: unknown) =>
      e instanceof ApiError &&
      e.status === 503 &&
      e.message.includes("HTTP 503"),
  );
  const malformed = createApiClient({
    baseUrl: "https://api.example.invalid",
    getIdentity: async () => null,
    fetcher: async () => new Response("<html>Unexpected</html>"),
  });
  await assert.rejects(() => malformed("/activities"), /unexpected response/);
});
test("timeouts also cover stalled session resolution, and callers can cancel requests", async () => {
  const api = createApiClient({
    baseUrl: "https://api.example.invalid",
    timeoutMs: 15,
    getIdentity: () => new Promise(() => {}),
    fetcher: async () => json([]),
  });
  await assert.rejects(
    () => api("/bookings"),
    (e: unknown) => e instanceof ApiError && e.status === 408,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () => api("/bookings", undefined, { signal: controller.signal }),
    (e: unknown) => e instanceof DOMException && e.name === "AbortError",
  );
});
test("sign-in return destinations stay inside the site, including backslash and control-character attacks", () => {
  const origin = "https://360kids.example.invalid";
  for (const value of [
    "//outside.example",
    "/\\outside.example",
    "/\n/outside.example",
    "javascript:alert(1)",
    "https://outside.example",
  ])
    assert.equal(safeReturnTo(value, origin), "/account");
  assert.equal(
    safeReturnTo("/activities/synthetic?view=request#policy", origin),
    "/activities/synthetic?view=request#policy",
  );
});

test("malformed successful booking responses keep their intent key for a safe retry", async () => {
  const keys: string[] = [];
  let attempts = 0;
  const api = createApiClient({
    baseUrl: "https://api.example.invalid",
    getIdentity: async () => user,
    fetcher: async (_input, init) => {
      keys.push((init?.headers as Record<string, string>)["Idempotency-Key"]);
      return ++attempts === 1
        ? new Response("")
        : json({ id: "synthetic-booking" });
    },
  });
  await assert.rejects(
    () => api("/bookings", { synthetic: true }),
    /unexpected response/,
  );
  await api("/bookings", { synthetic: true });
  assert.equal(keys[0], keys[1]);
});
