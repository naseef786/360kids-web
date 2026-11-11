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
    "/parent/bookings",
  );
  assert.equal(
    notificationHref({ kind: "booking", workspace: "provider" }, "provider"),
    "/partner",
  );
  assert.equal(
    notificationHref({ kind: "provider", workspace: "family" }, "parent"),
    "/partner/organizations",
  );
  assert.equal(
    notificationHref({ kind: "account", workspace: "family" }, "admin"),
    "/parent",
  );
});
