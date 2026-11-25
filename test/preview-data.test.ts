import assert from "node:assert/strict";
import test from "node:test";
import { previewActivities, previewAdminQueue, previewBookings, previewProviderQueue } from "../src/lib/preview-data";

test("fictional preview spans the three workspaces without real identifiers or child data", () => {
  assert.ok(previewActivities.length >= 6);
  assert.ok(previewBookings.length >= 5);
  assert.ok(previewProviderQueue.length >= 3);
  assert.ok(previewAdminQueue.length >= 3);
  assert.equal(new Set(previewActivities.map((activity) => activity.id)).size, previewActivities.length);
  for (const item of previewBookings) {
    assert.match(item.reference, /^DEMO-/);
    assert.ok(item.place && item.action && item.deadline);
  }
  assert.doesNotMatch(JSON.stringify({ previewActivities, previewBookings, previewProviderQueue, previewAdminQueue }), /@|birth_date|childIds|access_token|postgresql:/i);
});
