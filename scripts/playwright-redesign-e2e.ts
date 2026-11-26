import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function measureNav(page: import("playwright").Page, label: string, fn: () => Promise<void>) {
  const t0 = Date.now();
  await fn();
  const ms = Date.now() - t0;
  console.log(`TIMING [${label}]: ${ms}ms`);
  return ms;
}

async function run() {
  const browser = await chromium.launch();
  try {
    // 1. Mobile 390px + 360px public & navigation checks
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mobileCtx.newPage();

    await measureNav(mPage, "mobile-cold-home", async () => {
      await mPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      await mPage.locator(".connected-hero").waitFor({ state: "visible" });
    });
    const overflow390 = await mPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow390, false, "No horizontal overflow at 390px");
    await mPage.screenshot({ path: "../docs/e2e-evidence/after-home-mobile.png" });

    // Tap Explore in mobile bottom bar (cold then warm)
    await measureNav(mPage, "mobile-cold-explore-tap", async () => {
      await mPage.locator('.mobile-tabs a[href="/parent/activities"]').click();
      await mPage.waitForURL("**/parent/activities**");
      await mPage.locator(".explore-filter-wrap").waitFor({ state: "visible" });
    });
    await mPage.screenshot({ path: "../docs/e2e-evidence/after-explore-mobile.png" });

    // Warm switch back to Home and back to Explore
    await measureNav(mPage, "mobile-warm-home-tap", async () => {
      await mPage.locator('.mobile-tabs a[href="/"]').click();
      await mPage.waitForURL(`${BASE}/`);
      await mPage.locator(".connected-hero").waitFor({ state: "visible" });
    });
    await measureNav(mPage, "mobile-warm-explore-tap", async () => {
      await mPage.locator('.mobile-tabs a[href="/parent/activities"]').click();
      await mPage.waitForURL("**/parent/activities**");
      await mPage.locator(".explore-filter-wrap").waitFor({ state: "visible" });
    });

    // Open mobile filter sheet & apply category filter
    const filterBtn = mPage.locator(".mobile-filter-trigger");
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await mPage.locator(".filter-sheet").waitFor({ state: "visible" });
      await mPage.locator(".filter-sheet select").nth(1).selectOption("Learning");
      await mPage.locator('.filter-sheet button:has-text("Apply filters")').click();
      await mPage.waitForURL("**category=Learning**");
      await mPage.locator(".applied-filter-chips .filter-chip").waitFor({ state: "visible" });
    }

    // Open Activity detail & check mobile CTA + Guest booking tab + Back navigation
    await mPage.locator(".activity-card a.btn").first().click();
    await mPage.waitForURL("**/activities/**");
    await mPage.locator(".detail-info").waitFor({ state: "visible" });
    assert.equal(await mPage.locator(".mobile-book-cta-bar a").isVisible(), true, "Mobile booking CTA visible");
    assert.equal(await mPage.locator('button:has-text("Book as Guest")').isVisible(), true, "Book as Guest tab visible");
    await mPage.screenshot({ path: "../docs/e2e-evidence/after-activity-mobile.png" });
    await mPage.goBack();
    await mPage.waitForURL("**/parent/activities**");
    await mPage.locator(".explore-filter-wrap").waitFor({ state: "visible" });

    // Forgot Password & Reset Password (including expired/invalid link state)
    await mPage.goto(`${BASE}/forgot-password`, { waitUntil: "domcontentloaded" });
    await mPage.locator(".auth-card").waitFor({ state: "visible" });
    await mPage.screenshot({ path: "../docs/e2e-evidence/after-forgot-password.png" });
    await mPage.goto(`${BASE}/reset-password?error=expired`, { waitUntil: "domcontentloaded" });
    await mPage.locator(".auth-card").waitFor({ state: "visible" });
    assert.equal(await mPage.locator('a[href*="/forgot-password"]').isVisible(), true, "Expired reset link offers fresh link CTA");
    assert.equal(await mPage.locator(".password-toggle").isVisible(), true, "Password visibility toggle present");
    await mPage.screenshot({ path: "../docs/e2e-evidence/after-reset-password.png" });

    // 360px width check
    await mPage.setViewportSize({ width: 360, height: 800 });
    await mPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await mPage.locator(".connected-hero").waitFor({ state: "visible" });
    const overflow360 = await mPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow360, false, "No horizontal overflow at 360px");

    // 2. Role routing + warm parent tab switches
    const parentCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pPage = await parentCtx.newPage();
    await pPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await pPage.fill('input[name="email"]', "parent1@360kids.test");
    await pPage.fill('input[name="password"]', "ParentPass123!");
    await pPage.click('.auth-card form > button.btn');
    await pPage.waitForURL("**/parent");
    await pPage.locator("#main").waitFor({ state: "visible" });
    assert.ok(pPage.url().endsWith("/parent"), "Parent lands in /parent");

    await measureNav(pPage, "parent-cold-bookings-tap", async () => {
      await pPage.locator('.mobile-tabs a[href="/parent/bookings"]').click();
      await pPage.waitForURL("**/parent/bookings");
      await pPage.locator("#main").waitFor({ state: "visible" });
    });
    await measureNav(pPage, "parent-warm-overview-tap", async () => {
      await pPage.locator('.mobile-tabs a[href="/parent"]').click();
      await pPage.waitForURL(`${BASE}/parent`);
      await pPage.locator("#main").waitFor({ state: "visible" });
    });
    const warmSwitchMs = await measureNav(pPage, "parent-warm-bookings-tap", async () => {
      await pPage.locator('.mobile-tabs a[href="/parent/bookings"]').click();
      await pPage.waitForURL("**/parent/bookings");
      await pPage.locator("#main").waitFor({ state: "visible" });
    });
    assert.ok(warmSwitchMs < 1500, `Warm tab switch completed in ${warmSwitchMs}ms`);

    // 3. Multi-route 360px mobile responsiveness check across Parent, Partner, Admin & Legal pages
    const parentRoutes = ["/parent", "/parent/activities", "/parent/bookings", "/parent/saved", "/parent/profile"];
    await pPage.setViewportSize({ width: 360, height: 800 });
    for (const r of parentRoutes) {
      await pPage.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded" });
      await pPage.locator("#main").waitFor({ state: "visible" });
      const ov = await pPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(ov, false, `No horizontal overflow at 360px on ${r}`);
    }

    const partnerCtx = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const ptPage = await partnerCtx.newPage();
    await ptPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await ptPage.fill('input[name="email"]', "partner1@360kids.test");
    await ptPage.fill('input[name="password"]', "PartnerPass123!");
    await ptPage.click('.auth-card form > button.btn');
    await ptPage.waitForURL("**/partner");
    for (const r of ["/partner", "/partner/programs", "/partner/organizations", "/partner/team"]) {
      await ptPage.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded" });
      await ptPage.locator("#main").waitFor({ state: "visible" });
      const ov = await ptPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(ov, false, `No horizontal overflow at 360px on ${r}`);
    }

    const adminCtx = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const aPage = await adminCtx.newPage();
    await aPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await aPage.fill('input[name="email"]', "admin@360kids.test");
    await aPage.fill('input[name="password"]', "AdminPass123!");
    await aPage.click('.auth-card form > button.btn');
    await aPage.waitForURL("**/admin");
    for (const r of ["/admin", "/admin/partners", "/admin/programs", "/admin/bookings", "/admin/operations", "/admin/content", "/contact", "/faq", "/privacy", "/terms"]) {
      await aPage.goto(`${BASE}${r}`, { waitUntil: "load" });
      await aPage.locator("#main").waitFor({ state: "attached" });
      const ov = await aPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(ov, false, `No horizontal overflow at 360px on ${r}`);
    }

    // Admin Shopify-style Collections & Storefront Design Studio check
    await aPage.goto(`${BASE}/admin/content?slug=collections`, { waitUntil: "domcontentloaded" });
    await aPage.click('button:has-text("+ Add collection")');
    await aPage.click('button:has-text("Save & Publish")');
    await aPage.waitForSelector('text=Collections saved and published');

    await aPage.goto(`${BASE}/admin/content?slug=theme`, { waitUntil: "load" });
    await aPage.locator('h2:has-text("Storefront Design Customizer")').waitFor({ state: "visible" });
    await aPage.getByLabel(/Top announcement banner/i).fill("Winter Term 2026 Open");
    await aPage.click('button:has-text("Save & Publish")');
    await aPage.waitForSelector('text=Storefront design saved and published');

    await mPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await mPage.locator("#collections").waitFor({ state: "visible" });
    assert.equal(await mPage.locator("text=Winter Term 2026 Open").isVisible(), true, "Announcement banner live on storefront");
    assert.equal(await mPage.locator("text=Weekend STEM & Coding").isVisible(), true, "Admin collection live on storefront");

    // 4. Arabic RTL check
    await mPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await mPage.locator(".language-switcher select").selectOption("ar");
    await mPage.waitForTimeout(500);
    const dir = await mPage.evaluate(() => document.documentElement.dir);
    assert.equal(dir, "rtl", "Arabic switches html dir to rtl");

    console.log("ALL_REDESIGN_E2E_CHECKS_PASSED");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
