import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingDeadline,
  bookingIsOverdue,
  visibleInWorkspace,
} from "../src/lib/booking-view";
import type { Booking } from "../src/lib/client";
const booking: Booking = {
  id: "synthetic-booking",
  parent_id: "synthetic-parent",
  provider_id: "synthetic-provider",
  session_id: "synthetic-session",
  state: "OFFER_PENDING",
  version: 2,
  quantity: 1,
  amount_fils: 10000,
  held: false,
  response_due_at: "2030-04-29T12:00:00Z",
  payment_due_at: null,
  created_at: "2030-04-28T12:00:00Z",
  snapshot: {
    title: "Synthetic activity",
    provider: "Synthetic business",
    startsAt: "2030-05-01T12:00:00Z",
    policy: "Synthetic policy",
  },
  offer: {
    amountFils: 9500,
    reason: "Synthetic offer",
    expiresAt: "2030-04-30T12:00:00Z",
  },
  children: [],
  refunds: null,
};
test("a provider who also books as a parent gets the correct collection in each workspace", () => {
  assert.equal(
    visibleInWorkspace(booking, "family", "synthetic-parent", []),
    true,
  );
  assert.equal(
    visibleInWorkspace(booking, "family", "synthetic-business-owner", [
      "synthetic-provider",
    ]),
    false,
  );
  assert.equal(
    visibleInWorkspace(booking, "provider", "synthetic-business-owner", [
      "synthetic-provider",
    ]),
    true,
  );
  assert.equal(
    visibleInWorkspace(booking, "provider", "synthetic-other", []),
    false,
  );
});
test("offers use their own deadline and timely payment reviews remain protected after the due date", () => {
  assert.equal(bookingDeadline(booking), booking.offer!.expiresAt);
  assert.equal(
    bookingIsOverdue(booking, Date.parse("2030-04-30T12:00:00Z")),
    true,
  );
  assert.equal(
    bookingIsOverdue(booking, Date.parse("2030-04-29T14:00:00Z")),
    false,
  );
  assert.equal(
    bookingDeadline({
      ...booking,
      state: "PAYMENT_CHECKING",
      payment_due_at: "2030-04-29T12:00:00Z",
    }),
    null,
  );
  assert.equal(
    bookingIsOverdue(
      { ...booking, state: "PAYMENT_CHECKING" },
      Date.parse("2030-05-02T12:00:00Z"),
    ),
    false,
  );
});

import { notificationHref } from "../src/lib/notification-view";
test("notification destinations distinguish a provider’s own family bookings and pending applications", () => {
  assert.equal(
    notificationHref({ kind: "booking", workspace: "family" }, "provider"),
    "/account/bookings",
  );
  assert.equal(
    notificationHref({ kind: "booking", workspace: "provider" }, "provider"),
    "/provider/requests",
  );
  assert.equal(
    notificationHref({ kind: "provider", workspace: "family" }, "parent"),
    "/become-a-provider",
  );
  assert.equal(
    notificationHref({ kind: "account", workspace: "family" }, "admin"),
    "/account",
  );
});

import { appendBookingPage, bookingPagePath } from "../src/lib/booking-pages";

test("booking page queries preserve literal filters and cursors without query injection", () => {
  const path = bookingPagePath(
    { scope: "family", state: "CONFIRMED", search: "art & play?scope=all %_" },
    "cursor+/=",
  );
  const url = new URL(path, "https://example.invalid");
  assert.equal(url.pathname, "/bookings/page");
  assert.equal(url.searchParams.get("scope"), "family");
  assert.equal(url.searchParams.get("search"), "art & play?scope=all %_");
  assert.equal(url.searchParams.get("cursor"), "cursor+/=");
  assert.equal(url.searchParams.get("limit"), "25");
});
test("overlapping booking pages retain one updated record per ID and current totals", () => {
  const previous = {
    items: [booking, { ...booking, id: "second" }],
    total: 3,
    counts: { CONFIRMED: 1 },
    nextCursor: "old",
  };
  const next = {
    items: [
      { ...booking, id: "second", state: "CONFIRMED", version: 3 },
      { ...booking, id: "third" },
    ],
    total: 4,
    counts: { CONFIRMED: 2 },
    nextCursor: null,
  };
  const merged = appendBookingPage(previous, next);
  assert.deepEqual(
    merged.items.map((b) => b.id),
    [booking.id, "second", "third"],
  );
  assert.equal(merged.items[1].state, "CONFIRMED");
  assert.equal(merged.items[1].version, 3);
  assert.equal(merged.total, 4);
  assert.deepEqual(merged.counts, { CONFIRMED: 2 });
  assert.equal(merged.nextCursor, null);
  assert.equal(previous.items[1].state, "OFFER_PENDING");
});
