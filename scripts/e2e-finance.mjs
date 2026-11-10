import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const fixture = JSON.parse(
  await readFile(
    new URL("../../360kids-backend/.e2e-accounts.json", import.meta.url),
    "utf8",
  ),
);
const prior = JSON.parse(
  await readFile(
    new URL("../../360kids-backend/.e2e-result.json", import.meta.url),
    "utf8",
  ),
);
const origin = "http://localhost:3100";
class Session {
  cookies = new Map();
  async call(path, method = "GET", body, expected = 200) {
    const response = await fetch(origin + path, {
      method,
      headers: {
        Origin: origin,
        Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join(";"),
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
    });
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(";", 1)[0],
        split = pair.indexOf("=");
      this.cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    assert.equal(
      response.status,
      expected,
      `${method} ${path.split("?")[0]}: expected ${expected}, got ${response.status}`,
    );
    return response;
  }
  async api(path, method, body, expected) {
    return (
      await this.call("/api/backend" + path, method, body, expected)
    ).json();
  }
  async signIn(role) {
    const account = fixture.accounts[role];
    await this.call("/api/auth", "POST", {
      action: "signin",
      email: account.email,
      password: account.password,
    });
    return this;
  }
}
let admin, activity;
try {
  const parent = await new Session().signIn("outsider"),
    partner = await new Session().signIn("partner");
  admin = await new Session().signIn("admin");
  assert.equal((await parent.api("/status")).financeWorkflowEnabled, true);
  const start = new Date(Date.now() + 14 * 86400000).toISOString(),
    cutoff = new Date(Date.now() + 13 * 86400000).toISOString();
  activity = await admin.api(
    "/activities",
    "POST",
    {
      providerId: prior.providerId,
      title: "Synthetic finance simulation",
      description:
        "Fictional confirmation and refund recording only. No payment is collected.",
      category: "Learning",
      area: "Dubai",
      minAge: 3,
      maxAge: 12,
      priceFils: 5000,
      policy: "Fictional full-refund policy for development simulation only.",
      published: true,
      startsAt: start,
      cutoffAt: cutoff,
      capacity: 2,
    },
    201,
  );
  const child = await parent.api(
    "/children",
    "POST",
    { firstName: "Synthetic Finance Explorer", ageYears: 7 },
    201,
  );
  const booking = await parent.api(
    "/bookings",
    "POST",
    {
      sessionId: activity.sessionId,
      childIds: [child.id],
      policyAccepted: true,
    },
    201,
  );
  const action = async (session, verb, extra = {}) => {
    const current = await session.api(`/bookings/${booking.id}`);
    return session.api(`/bookings/${booking.id}/actions`, "POST", {
      action: verb,
      version: current.version,
      ...extra,
    });
  };
  await action(partner, "accept");
  assert.ok(
    (
      await (await parent.call(`/parent/bookings/${booking.id}`)).text()
    ).includes("Submit reference"),
  );
  await action(parent, "proof", { reference: "SYNTHETIC-NO-MONEY-TRANSFER" });
  assert.ok(
    (await (await admin.call(`/admin/bookings/${booking.id}`)).text()).includes(
      "Verify payment",
    ),
  );
  await action(admin, "verify");
  let detail = await parent.api(`/bookings/${booking.id}`);
  assert.equal(detail.state, "CONFIRMED");
  assert.equal(detail.payments[0].status, "verified");
  console.log(
    "PASS simulated parent reference and Superadmin verification reach Confirmed through the website API",
  );
  await action(admin, "cancel", { reason: "Synthetic full-refund simulation" });
  detail = await admin.api(`/bookings/${booking.id}`);
  assert.equal(detail.refunds[0].status, "pending");
  assert.equal(detail.refunds[0].amount_fils, 5000);
  assert.ok(
    (
      await (await admin.call("/admin/operations?resource=refunds")).text()
    ).includes("Record completed refund"),
  );
  await admin.api(`/admin/refunds/${detail.refunds[0].id}/complete`, "POST", {
    reference: "SYNTHETIC-REFUND-EVIDENCE-NO-MONEY",
  });
  detail = await parent.api(`/bookings/${booking.id}`);
  assert.equal(detail.state, "CANCELLED");
  assert.equal(detail.refunds[0].status, "completed");
  console.log(
    "PASS simulated cancellation creates a separate full-refund record and completion preserves payment history",
  );
  const normal = await (await fetch("http://localhost:4000/v1/status")).json();
  assert.equal(normal.financeWorkflowEnabled, false);
  console.log("PASS main development app retains payment collection disabled");
  await writeFile(
    new URL("../../360kids-backend/.e2e-finance-result.json", import.meta.url),
    JSON.stringify(
      {
        verifiedAt: new Date().toISOString(),
        bookingId: booking.id,
        confirmation: true,
        refund: true,
        moneyMoved: false,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : "Synthetic finance check failed; credentials were not printed.",
  );
  process.exitCode = 1;
} finally {
  if (admin && activity)
    await admin.api(`/activities/${activity.id}/publication`, "PUT", {
      published: false,
    });
}
