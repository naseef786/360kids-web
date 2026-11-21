import test from "node:test";
import assert from "node:assert/strict";
import { clearBookingIntent, readBookingIntent, saveBookingIntent } from "../src/lib/booking-intent";

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  } as Storage;
}

test("guest selection survives sign-in navigation without child data or extending its original seven-day expiry", () => {
  const local = storage(), start = Date.UTC(2026, 10, 19);
  saveBookingIntent(local, "activity", "session", 2, 3, start);
  const first = readBookingIntent(local, "activity", start + 1000);
  assert.equal(first?.sessionId, "session");
  assert.equal(first?.childCount, 3);
  assert.deepEqual(Object.keys(first ?? {}).sort(), ["activityId", "childCount", "expiresAt", "sessionId", "sessionPage"]);
  saveBookingIntent(local, "activity", "later-session", 3, 2, start + 1000);
  assert.equal(readBookingIntent(local, "activity", start + 2000)?.expiresAt, first?.expiresAt);
  assert.equal(readBookingIntent(local, "activity", start + 7 * 86400000), null);
});

test("a draft is scoped to its activity, rejects invalid selection, and clears after submission", () => {
  const local = storage(), now = Date.UTC(2026, 10, 19);
  saveBookingIntent(local, "first", "session", 1, 11, now);
  assert.equal(readBookingIntent(local, "first", now), null);
  saveBookingIntent(local, "first", "session", 1, 1, now);
  assert.equal(readBookingIntent(local, "second", now), null);
  clearBookingIntent(local, "first");
  assert.equal(readBookingIntent(local, "first", now), null);
});
