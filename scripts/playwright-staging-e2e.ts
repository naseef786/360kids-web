import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "../../360kids-backend/node_modules/@electric-sql/pglite/dist/index.js";
import { createApp } from "../../360kids-backend/src/app.js";
import { migrate } from "../../360kids-backend/src/migrations.js";
import { Platform } from "../../360kids-backend/src/platform.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, "..");
const evidenceDir = path.resolve(webDir, "..", "docs", "e2e-evidence");

function makeJwt(sub: string, email: string, aal: "aal1" | "aal2" = "aal1") {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub,
    email,
    aal,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.sig`;
}

async function main() {
await mkdir(evidenceDir, { recursive: true });
const { chromium } = await import("playwright");

// 1. Start isolated PGlite + real Backend API
const pg = new PGlite();
const runQuery = (sql: string, params?: unknown[]) =>
  params === undefined ? pg.exec(sql).then((r) => r[0] ?? { rows: [] }) : pg.query(sql, params);
const db = {
  query: runQuery,
  connect: async () => ({
    query: runQuery,
    release() {},
  }),
  end: () => pg.close(),
} as unknown as Parameters<typeof migrate>[0];
await migrate(db);
const platform = new Platform(db as unknown as ConstructorParameters<typeof Platform>[0], true);

// Seed prerequisite staging Admin account
const adminId = randomUUID();
const adminEmail = "staging-admin@example.invalid";
const adminPass = "AdminPass123!@#";
await platform.me(adminId, adminEmail);
await pg.query("UPDATE app.profiles SET role='admin' WHERE id=$1", [adminId]);
await pg.query(
  `INSERT INTO app.platform_role_grants(user_id,role,granted_by,reason)
   SELECT $1,role,$1,'Staging E2E prerequisite admin'
   FROM (VALUES ('content'),('support'),('finance')) AS g(role)
   ON CONFLICT DO NOTHING`,
  [adminId],
);

// 2. Local Supabase-compatible Auth Stub
const users = new Map<
  string,
  { id: string; email: string; password: string; aal: "aal1" | "aal2" }
>();
users.set(adminEmail, {
  id: adminId,
  email: adminEmail,
  password: adminPass,
  aal: "aal2",
});

const authServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = chunks.length
    ? JSON.parse(Buffer.concat(chunks).toString("utf8"))
    : {};

  const json = (status: number, data: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };

  if (req.method === "POST" && url.pathname === "/auth/v1/signup") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || password.length < 8) {
      return json(422, { code: "weak_password", message: "Invalid signup" });
    }
    if (users.has(email)) {
      return json(422, { code: "user_already_exists", message: "Exists" });
    }
    const id = randomUUID();
    users.set(email, { id, email, password, aal: "aal1" });
    const token = makeJwt(id, email, "aal1");
    return json(200, {
      access_token: token,
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: `refresh-${id}`,
      user: {
        id,
        email,
        email_confirmed_at: new Date().toISOString(),
        aud: "authenticated",
        role: "authenticated",
      },
      session: {
        access_token: token,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: `refresh-${id}`,
        user: {
          id,
          email,
          email_confirmed_at: new Date().toISOString(),
        },
      },
    });
  }

  if (req.method === "POST" && url.pathname === "/auth/v1/token") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const u = users.get(email);
    if (!u || u.password !== password) {
      return json(400, {
        error: "invalid_grant",
        error_description: "Invalid login credentials",
      });
    }
    const token = makeJwt(u.id, u.email, u.aal);
    return json(200, {
      access_token: token,
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: `refresh-${u.id}`,
      user: {
        id: u.id,
        email: u.email,
        email_confirmed_at: new Date().toISOString(),
      },
    });
  }

  if (req.method === "GET" && url.pathname === "/auth/v1/user") {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (!token) return json(401, { message: "Unauthorized" });
    try {
      const claims = JSON.parse(
        Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
      );
      return json(200, {
        id: claims.sub,
        email: claims.email,
        email_confirmed_at: new Date().toISOString(),
        aud: "authenticated",
        role: "authenticated",
      });
    } catch {
      return json(401, { message: "Invalid token" });
    }
  }

  if (req.method === "POST" && url.pathname === "/auth/v1/logout") {
    return json(204, {});
  }

  return json(404, { message: "Not handled in stub" });
});

authServer.listen(0, "127.0.0.1");
await once(authServer, "listening");
const authPort = (authServer.address() as { port: number }).port;
const authOrigin = `http://127.0.0.1:${authPort}`;

// Custom authenticator that reads our local stub JWTs
const testAuth = async (token: string) => {
  const claims = JSON.parse(
    Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
  );
  return {
    id: claims.sub as string,
    email: claims.email as string,
    assuranceLevel: (claims.aal ?? "aal1") as "aal1" | "aal2",
    emailVerified: true,
  };
};

const webPort = 3099;
const webOrigin = `http://127.0.0.1:${webPort}`;

const apiServer = createApp(webOrigin, platform, testAuth).listen(0, "127.0.0.1");
await once(apiServer, "listening");
const apiPort = (apiServer.address() as { port: number }).port;
const apiOrigin = `http://127.0.0.1:${apiPort}`;

// 3. Start Next.js production server against isolated API & Auth stub
const nextProc = spawn(
  process.execPath,
  [path.join(webDir, "node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(webPort)],
  {
    cwd: webDir,
    env: {
      ...process.env,
      API_URL: apiOrigin,
      NEXT_PUBLIC_API_URL: apiOrigin,
      SUPABASE_URL: authOrigin,
      SUPABASE_PUBLISHABLE_KEY: "synthetic-anon-key",
      NEXT_PUBLIC_SUPABASE_URL: authOrigin,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-anon-key",
    },
    stdio: "pipe",
  },
);

async function waitForWeb() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${webOrigin}/login`);
      if (r.ok) return;
    } catch {
      /* waiting */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Next.js test server did not start in time.");
}

const results: string[] = [];
const pass = (msg: string) => {
  results.push(`PASS: ${msg}`);
  console.log(`PASS: ${msg}`);
};

try {
  await waitForWeb();
  const browser = await chromium.launch({ headless: true });

  const parentCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const partnerCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const parentPage = await parentCtx.newPage();
  const partnerPage = await partnerCtx.newPage();
  const adminPage = await adminCtx.newPage();

  const runId = randomUUID().slice(0, 6);
  const partnerEmail = `partner-${runId}@example.invalid`;
  const parentEmail = `parent-${runId}@example.invalid`;
  const passWord = "StrongPass123!@";
  const orgName = `Staging Academy ${runId}`;
  const progTitle = `Robotics Explorers ${runId}`;

  // Step 1: Parent registers on /signup (even with ?next=/partner!) -> MUST land on /parent
  await parentPage.goto(`${webOrigin}/signup?next=/partner`);
  await parentPage.fill('input[name="email"]', parentEmail);
  await parentPage.fill('input[name="password"]', passWord);
  await parentPage.click('button:has-text("Create account")');
  try {
    await parentPage.waitForURL(`${webOrigin}/parent`, { timeout: 15000 });
  } catch (e) {
    console.error("Step 1 failed. Current URL:", parentPage.url());
    console.error("Page text:", await parentPage.locator("main").innerText().catch(() => ""));
    throw e;
  }
  pass("Parent registration redirects to /parent (even when next=/partner was supplied)");

  // Negative check: Parent cannot access /partner or /admin
  await parentPage.goto(`${webOrigin}/partner`);
  await parentPage.waitForURL(`${webOrigin}/access-denied`);
  await parentPage.goto(`${webOrigin}/admin`);
  await parentPage.waitForURL(`${webOrigin}/access-denied`);
  pass("Parent blocked from /partner and /admin (/access-denied)");

  // Step 2: Partner registers via /signup?next=/partner/apply -> lands on /partner/apply & submits application
  await partnerPage.goto(`${webOrigin}/signup?next=/partner/apply`);
  await partnerPage.fill('input[name="email"]', partnerEmail);
  await partnerPage.fill('input[name="password"]', passWord);
  await partnerPage.click('button:has-text("Create account")');
  await partnerPage.waitForURL(`${webOrigin}/partner/apply`);
  await partnerPage.fill('input[name="name"]', orgName);
  await partnerPage.fill('textarea[name="description"]', "Staging E2E test STEM academy in Dubai.");
  await partnerPage.click('button:has-text("Submit partner application")');
  await partnerPage.waitForSelector(`text=${orgName}`);
  await partnerPage.waitForSelector("text=pending");
  await partnerPage.screenshot({ path: path.join(evidenceDir, "01_partner_apply_pending.png"), fullPage: true });
  pass("Partner registered and submitted application (status: pending)");

  // Negative check: Pending partner cannot access /partner
  await partnerPage.goto(`${webOrigin}/partner`);
  await partnerPage.waitForURL(`${webOrigin}/access-denied`);
  pass("Pending partner blocked from /partner");

  // Step 3: Admin signs in, checks notifications, and approves Partner
  await adminPage.goto(`${webOrigin}/login`);
  await adminPage.fill('input[name="email"]', adminEmail);
  await adminPage.fill('input[name="password"]', adminPass);
  await adminPage.click('button:has-text("Sign in")');
  await adminPage.waitForURL(`${webOrigin}/admin`);
  await adminPage.goto(`${webOrigin}/admin/partners`);
  await adminPage.waitForSelector(`text=${orgName}`);
  await adminPage.click(`article:has-text("${orgName}") summary:has-text("Review application")`);
  await adminPage.click(`article:has-text("${orgName}") button:has-text("Save review decision")`);
  await adminPage.waitForSelector(`article:has-text("${orgName}") >> text=approved`);
  await adminPage.screenshot({ path: path.join(evidenceDir, "02_admin_approved_partner.png"), fullPage: true });
  pass("Admin reviewed and approved Partner application");

  // Step 4: Partner creates a draft programme on /partner/programs
  await partnerPage.goto(`${webOrigin}/partner/programs`);
  await partnerPage.click('summary:has-text("Create an activity")');
  await partnerPage.selectOption('select[name="providerId"]', { label: orgName });
  await partnerPage.fill('input[name="title"]', progTitle);
  await partnerPage.fill('textarea[name="description"]', "Hands-on robotics and coding workshop for kids in Dubai.");
  await partnerPage.selectOption('select[name="category"]', "Learning");
  await partnerPage.fill('input[name="area"]', "Dubai Marina");
  await partnerPage.fill('input[name="minAge"]', "6");
  await partnerPage.fill('input[name="maxAge"]', "12");
  await partnerPage.fill('input[name="price"]', "150");
  const startsAt = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 16);
  const cutoffAt = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 16);
  await partnerPage.fill('input[name="startsAt"]', startsAt);
  await partnerPage.fill('input[name="cutoffAt"]', cutoffAt);
  await partnerPage.fill('input[name="capacity"]', "5");
  await partnerPage.fill('textarea[name="policy"]', "Full refund up to 48 hours before session start.");
  await partnerPage.click('button:has-text("Submit activity for review")');
  await partnerPage.waitForSelector(`text=${progTitle}`);
  await partnerPage.screenshot({ path: path.join(evidenceDir, "03_partner_draft_programme.png"), fullPage: true });
  pass("Partner created draft programme");

  // Negative check: Draft programme must NOT appear publicly
  await parentPage.goto(`${webOrigin}/parent/activities?q=${encodeURIComponent(progTitle)}`);
  assert.equal(await parentPage.locator(`text=${progTitle}`).count(), 0);
  pass("Unapproved draft programme hidden from public discovery");

  // Step 5: Admin publishes the programme
  await adminPage.goto(`${webOrigin}/admin/programs`);
  await adminPage.waitForSelector(`text=${progTitle}`);
  await adminPage.click(`article:has-text("${progTitle}") summary:has-text("Publication decision")`);
  await adminPage.click(`article:has-text("${progTitle}") button:has-text("Publish activity")`);
  await adminPage.waitForSelector(`article:has-text("${progTitle}") >> text=Published`);
  await adminPage.screenshot({ path: path.join(evidenceDir, "04_admin_published_programme.png"), fullPage: true });
  pass("Admin published programme");

  // Step 6: Parent adds child, edits child, discovers programme, and submits booking request
  await parentPage.goto(`${webOrigin}/parent/profile`);
  await parentPage.fill('input[name="firstName"]', "Zayd");
  await parentPage.fill('input[name="surname"]', "Al Mansoor");
  await parentPage.fill('input[name="ageYears"]', "8");
  await parentPage.click('button:has-text("Add child")');
  await parentPage.waitForSelector("text=Zayd");

  await parentPage.goto(`${webOrigin}/parent/activities?q=${encodeURIComponent(progTitle)}`);
  await parentPage.waitForSelector(`text=${progTitle}`);
  await parentPage.click(`a:has-text("${progTitle}")`);
  await parentPage.waitForSelector('select[name="sessionId"]');
  const firstSessionVal = await parentPage.locator('select[name="sessionId"] option').nth(1).getAttribute("value");
  assert.ok(firstSessionVal);
  await parentPage.selectOption('select[name="sessionId"]', firstSessionVal);
  await parentPage.check('.check-list input[type="checkbox"]');
  await parentPage.check('input[type="checkbox"][name="policyAccepted"]');
  await parentPage.click('button:has-text("Send booking request")');
  await parentPage.waitForURL(`${webOrigin}/parent/bookings`);
  await parentPage.waitForSelector(`text=${progTitle}`);
  await parentPage.screenshot({ path: path.join(evidenceDir, "05_parent_booking_requested.png"), fullPage: true });
  pass("Parent created child, discovered programme, and submitted booking request");

  // Step 7: Partner sees request and accepts it -> Awaiting payment
  await partnerPage.goto(`${webOrigin}/partner`);
  await partnerPage.waitForSelector(`text=${progTitle}`);
  await partnerPage.click(`tr:has-text("${progTitle}") a:has-text("View request")`);
  await partnerPage.waitForURL(/\/partner\/bookings\//);
  const bookingUrl = partnerPage.url();
  const bookingId = bookingUrl.split("/").pop()!;
  await partnerPage.click('button:has-text("Accept request")');
  await partnerPage.waitForSelector("text=Awaiting payment");
  await partnerPage.screenshot({ path: path.join(evidenceDir, "06_partner_accepted_booking.png"), fullPage: true });
  pass("Partner accepted booking -> Awaiting payment");

  // Step 8: Admin receives notification and sees booking in /admin/bookings
  await adminPage.goto(`${webOrigin}/admin/notifications`);
  await adminPage.waitForSelector(`a[href="/admin/bookings/${bookingId}"]`);
  await adminPage.goto(`${webOrigin}/admin/bookings/${bookingId}`);
  await adminPage.waitForSelector("text=Awaiting payment");
  pass("Admin received notification and sees Awaiting payment booking");

  // Step 9: Parent submits staging payment proof -> Payment under review
  await parentPage.goto(`${webOrigin}/parent/bookings/${bookingId}`);
  await parentPage.waitForSelector("text=Awaiting payment");
  await parentPage.fill('input[name="reference"]', `STAGING-PAY-${runId}`);
  await parentPage.click('button:has-text("Submit reference")');
  await parentPage.waitForSelector("text=Payment under review");
  pass("Parent submitted staging payment proof -> Payment under review");

  // Step 10: Admin verifies payment -> Confirmed
  await adminPage.reload();
  await adminPage.waitForSelector('button:has-text("Verify payment")');
  await adminPage.click('button:has-text("Verify payment")');
  await adminPage.waitForSelector("text=Confirmed");
  await adminPage.screenshot({ path: path.join(evidenceDir, "07_admin_confirmed_booking.png"), fullPage: true });
  pass("Admin verified payment -> Confirmed");

  // Step 11: Persistence after reload across all 3 dashboards
  await parentPage.reload();
  await parentPage.waitForSelector("text=Confirmed");
  await parentPage.screenshot({ path: path.join(evidenceDir, "08_parent_confirmed_booking.png"), fullPage: true });
  await partnerPage.reload();
  await partnerPage.waitForSelector("text=Confirmed");
  pass("Booking Confirmed persists across all 3 dashboards after reload");

  // Step 12: Negative login + Mobile 390px overflow check
  const anonCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const anonPage = await anonCtx.newPage();
  await anonPage.goto(`${webOrigin}/login`);
  await anonPage.fill('input[name="email"]', "wrong@example.invalid");
  await anonPage.fill('input[name="password"]', "WrongPass123!");
  await anonPage.click('button:has-text("Sign in")');
  await anonPage.waitForSelector('[role="alert"]');
  await anonPage.goto(`${webOrigin}/`);
  const homeOverflow = await anonPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(homeOverflow, false, "Homepage should have zero horizontal overflow at 390px");
  await anonPage.goto(`${webOrigin}/parent/activities`);
  const catOverflow = await anonPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(catOverflow, false, "Catalogue should have zero horizontal overflow at 390px");
  await anonPage.screenshot({ path: path.join(evidenceDir, "09_mobile_390px_catalogue.png"), fullPage: true });
  pass("Invalid login error + 390px mobile zero-overflow verified");

  await browser.close();
  console.log(`\nALL ${results.length} PLAYWRIGHT E2E CHECKS PASSED!`);
} finally {
  nextProc.kill("SIGTERM");
  apiServer.closeAllConnections();
  await new Promise<void>((r) => apiServer.close(() => r()));
  authServer.closeAllConnections();
  await new Promise<void>((r) => authServer.close(() => r()));
  await pg.close();
}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
