import test from "node:test";
import assert from "node:assert/strict";
import { authCallbackPath, passwordResetPath, safeNext } from "../src/lib/navigation";
import { foregroundRefresh } from "../src/lib/foreground-refresh";
import { canUseAdminPath, operatorHome } from "../src/lib/permissions";

test("password recovery retains the activity destination through callback and expired-link retry", () => {
  const next = "/activities/synthetic?session=synthetic-session#request";
  const reset = passwordResetPath(next);
  assert.equal(authCallbackPath(reset, null, true), reset);
  assert.equal(authCallbackPath(next, "recovery", true), reset);
  const resetUrl = new URL(reset, "https://local.invalid");
  assert.equal(safeNext(resetUrl.searchParams.get("next")), next);
  const retry = new URL(authCallbackPath(reset, null, false), "https://local.invalid");
  assert.equal(retry.pathname, "/forgot-password");
  assert.equal(retry.searchParams.get("error"), "link");
  assert.equal(retry.searchParams.get("next"), next);
  const login = new URL(authCallbackPath(next, null, false), "https://local.invalid");
  assert.equal(login.pathname, "/login");
  assert.equal(login.searchParams.get("next"), next);
});

test("recovery rejects external return destinations including nested reset links", () => {
  for (const bad of ["https://evil.invalid", "//evil.invalid", "/\\evil.invalid", "javascript:alert(1)"]) {
    assert.equal(passwordResetPath(bad), passwordResetPath("/parent"));
    const retry = new URL(authCallbackPath(`/reset-password?next=${encodeURIComponent(bad)}`, "recovery", false), "https://local.invalid");
    assert.equal(retry.searchParams.get("next"), "/parent");
  }
});

test("finance readers without booking permissions reach their authorized operations workspace", () => {
  const actor = { id: "synthetic", email: "test@example.invalid", role: "parent", roles: ["parent"], active: true, capabilities: ["payments.read"] };
  assert.equal(operatorHome(actor), "/admin/operations");
  assert.equal(canUseAdminPath(actor, operatorHome(actor)), true);
  assert.equal(canUseAdminPath(actor, "/admin/bookings"), false);
});

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test("foreground refresh pauses offline/hidden, resumes immediately and never overlaps requests", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let active = false, calls = 0;
  let resolve!: (value: number) => void;
  const received: number[] = [];
  const poller = foregroundRefresh({
    load: async () => { calls++; return new Promise<number>(done => { resolve = done; }); },
    isActive: () => active,
    onData: value => { received.push(value); },
    onError: () => true,
  });
  t.after(() => poller.stop());
  await poller.refresh();
  assert.equal(calls, 0);
  active = true;
  const first = poller.refresh();
  await poller.refresh();
  assert.equal(calls, 1);
  resolve(1); await first;
  t.mock.timers.tick(29_999); assert.equal(calls, 1);
  active = false;
  await poller.refresh();
  t.mock.timers.tick(300_000); assert.equal(calls, 1);
  active = true;
  const resumed = poller.refresh();
  assert.equal(calls, 2);
  resolve(2); await resumed;
  assert.deepEqual(received, [1, 2]);
});

test("refresh backs off failures, resets after recovery and stops on revoked access", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0, fail = true, revoked = false;
  const poller = foregroundRefresh({
    load: async () => { calls++; if (fail) throw new Error("Synthetic failure"); return 1; },
    isActive: () => true,
    onData: () => {},
    onError: () => !revoked,
  });
  t.after(() => poller.stop());
  await poller.refresh();
  for (const delay of [60_000, 120_000, 240_000, 300_000, 300_000]) {
    const previous = calls;
    t.mock.timers.tick(delay - 1); assert.equal(calls, previous);
    t.mock.timers.tick(1); await flush(); assert.equal(calls, previous + 1);
  }
  fail = false;
  await poller.refresh();
  const recovered = calls;
  t.mock.timers.tick(30_000); await flush(); assert.equal(calls, recovered + 1);
  fail = true; revoked = true;
  await poller.refresh();
  const stopped = calls;
  t.mock.timers.tick(600_000); await poller.refresh();
  assert.equal(calls, stopped);
});

test("unmount aborts the request and ignores a late private response", async () => {
  let signal!: AbortSignal, resolve!: (value: number) => void;
  let delivered = false;
  const poller = foregroundRefresh({
    load: async (input) => { signal = input; return new Promise<number>(done => { resolve = done; }); },
    isActive: () => true,
    onData: () => { delivered = true; },
    onError: () => { delivered = true; return true; },
  });
  const pending = poller.refresh();
  poller.stop();
  assert.equal(signal.aborted, true);
  resolve(1); await pending;
  assert.equal(delivered, false);
});
