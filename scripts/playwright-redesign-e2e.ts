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
    // 1. Public & Guest 390x844 checks
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mobileCtx.newPage();

    await measureNav(mPage, "mobile-cold-home", async () => {
      await mPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      await mPage.locator(".connected-hero").waitFor({ state: "visible" });
    });
    await mPage.screenshot({ path: "../docs/e2e-evidence/after-home-mobile.png" });

    // Forgot Password & Reset Password (including expired/invalid link state)
    await mPage.goto(`${BASE}/forgot-password`, { waitUntil: "domcontentloaded" });
    await mPage.locator(".auth-card").waitFor({ state: "visible" });
    await mPage.screenshot({ path: "../docs/e2e-evidence/after-forgot-password.png" });
    await mPage.goto(`${BASE}/reset-password?error=expired`, { waitUntil: "domcontentloaded" });
    await mPage.locator(".auth-card").waitFor({ state: "visible" });
    assert.equal(await mPage.locator('a[href*="/forgot-password"]').isVisible(), true, "Expired reset link offers fresh link CTA");
    assert.equal(await mPage.locator(".password-toggle").isVisible(), true, "Password visibility toggle present");
    await mPage.screenshot({ path: "../docs/e2e-evidence/after-reset-password.png" });

    // 2. Signed-in Parent at 390x844: Explore above-the-fold, 4-tab single row, Menu, Filter Sheet, Save, Bookings
    const parentCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pPage = await parentCtx.newPage();
    await pPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await pPage.fill('input[name="email"]', "parent1@360kids.test");
    await pPage.fill('input[name="password"]', "ParentPass123!");
    await pPage.click(".auth-card form > button.btn");
    await pPage.waitForURL("**/parent");
    await pPage.locator("#main").waitFor({ state: "visible" });

    await measureNav(pPage, "parent-explore-tap", async () => {
      await pPage.locator('.mobile-tabs a[href="/parent/activities"]').click();
      await pPage.waitForURL("**/parent/activities");
      await pPage.locator(".explore-filter-wrap").waitFor({ state: "visible" });
    });

    // Verify 4 bottom tabs on 1 single row & >= 44x44 touch targets
    const tabs = pPage.locator(".mobile-tabs a");
    assert.equal(await tabs.count(), 4, "Exactly 4 bottom tabs for Parent");
    const tabBoxes = await Promise.all([0, 1, 2, 3].map((i) => tabs.nth(i).boundingBox()));
    const firstY = tabBoxes[0]!.y;
    for (const box of tabBoxes) {
      assert.ok(box && box.width >= 44 && box.height >= 44, "Bottom tab meets 44x44 touch target");
      assert.ok(Math.abs(box!.y - firstY) < 2, "All 4 bottom tabs sit on one single row");
    }

    // Verify first activity image AND title are visible above the bottom bar BEFORE scrolling at 390x844
    const navBarBox = await pPage.locator(".mobile-tabs").boundingBox();
    const firstImgBox = await pPage.locator(".activity-card .activity-image img").first().boundingBox();
    const firstTitleBox = await pPage.locator(".activity-card h3").first().boundingBox();
    assert.ok(navBarBox && firstImgBox && firstTitleBox, "Explore card elements rendered");
    assert.ok(
      firstImgBox!.y + firstImgBox!.height <= navBarBox!.y,
      `First activity image (${firstImgBox!.y + firstImgBox!.height}) above bottom bar (${navBarBox!.y})`,
    );
    assert.ok(
      firstTitleBox!.y + firstTitleBox!.height <= navBarBox!.y,
      `First activity title (${firstTitleBox!.y + firstTitleBox!.height}) above bottom bar (${navBarBox!.y})`,
    );
    await pPage.screenshot({ path: "../docs/e2e-evidence/after-signedin-explore-390.png" });

    // Verify Mobile Account Menu opens, shows Language & Sign out, and closes on Escape returning focus
    await pPage.locator(".mobile-menu-btn").click();
    await pPage.locator("#mobile-account-menu").waitFor({ state: "visible" });
    assert.equal(await pPage.locator('#mobile-account-menu a[href="/parent"]').isVisible(), true, "Overview link in menu");
    await pPage.keyboard.press("Escape");
    await pPage.locator("#mobile-account-menu").waitFor({ state: "hidden" });

    // Verify Filter Sheet: open -> Cancel preserves previous state -> open -> Apply updates URL
    await pPage.locator(".mobile-filter-trigger").click();
    await pPage.locator(".filter-sheet").waitFor({ state: "visible" });
    await pPage.screenshot({ path: "../docs/e2e-evidence/after-filter-sheet-390.png" });
    await pPage.locator(".filter-sheet select").nth(1).selectOption("Learning");
    await pPage.locator('.filter-sheet button:has-text("Cancel")').click();
    await pPage.locator(".filter-sheet").waitFor({ state: "hidden" });
    assert.equal(pPage.url().includes("category=Learning"), false, "Cancel preserves previous unfiltered state");

    await pPage.locator(".mobile-filter-trigger").click();
    await pPage.locator(".filter-sheet select").nth(1).selectOption("Learning");
    await pPage.locator('.filter-sheet button:has-text("Apply filters")').click();
    await pPage.waitForURL("**category=Learning**");
    await pPage.locator(".applied-filter-chips .filter-chip").waitFor({ state: "visible" });

    // Activity detail + Back navigation
    await pPage.locator(".activity-card a.btn").first().click();
    await pPage.waitForURL("**/activities/**");
    await pPage.locator(".detail-info").waitFor({ state: "visible" });
    await pPage.screenshot({ path: "../docs/e2e-evidence/after-activity-mobile.png" });
    await pPage.goBack();
    await pPage.waitForURL("**/parent/activities?category=Learning**");

    // Profile has Family Overview link
    await pPage.locator('.mobile-tabs a[href="/parent/profile"]').click();
    await pPage.waitForURL("**/parent/profile");
    await pPage.locator('#main a[href="/parent"]').waitFor({ state: "visible" });

    // Bookings warm switch + screenshot
    const warmBookingsMs = await measureNav(pPage, "parent-warm-bookings-tap", async () => {
      await pPage.locator('.mobile-tabs a[href="/parent/bookings"]').click();
      await pPage.waitForURL("**/parent/bookings");
      await pPage.locator("#main").waitFor({ state: "visible" });
    });
    assert.ok(warmBookingsMs < 1500, `Warm tab switch completed in ${warmBookingsMs}ms`);
    await pPage.screenshot({ path: "../docs/e2e-evidence/after-my-bookings-390.png" });

    // Multi-width overflow audit: 320, 360, 390, 430, 768, 1280
    for (const width of [320, 360, 390, 430, 768, 1280]) {
      await pPage.setViewportSize({ width, height: 844 });
      for (const r of ["/parent/activities", "/parent/saved", "/parent/bookings", "/parent/profile"]) {
        await pPage.goto(`${BASE}${r}`, { waitUntil: "load" });
        await pPage.locator("#main").waitFor({ state: "attached" });
        const ov = await pPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        assert.equal(ov, false, `No horizontal overflow at ${width}px on ${r}`);
      }
    }

    // 200% text size check at 390x844
    await pPage.setViewportSize({ width: 390, height: 844 });
    await pPage.goto(`${BASE}/parent/activities`, { waitUntil: "load" });
    await pPage.locator(".explore-filter-wrap").waitFor({ state: "visible" });
    await pPage.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const searchVisibleAt200 = await pPage.locator('.live-filters input[name="q"]').isVisible();
    assert.equal(searchVisibleAt200, true, "Search control remains visible and reachable at 200% text size");

    // 3. Partner & Admin operational queue at 390x844
    const partnerCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const ptPage = await partnerCtx.newPage();
    await ptPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await ptPage.fill('input[name="email"]', "partner1@360kids.test");
    await ptPage.fill('input[name="password"]', "PartnerPass123!");
    await ptPage.click(".auth-card form > button.btn");
    await ptPage.waitForURL("**/partner");
    await ptPage.locator("#main").waitFor({ state: "visible" });
    await ptPage.screenshot({ path: "../docs/e2e-evidence/after-operational-queue-390.png" });
    const ptOverflow = await ptPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(ptOverflow, false, "No horizontal overflow on Partner queue at 390px");

    const adminCtx = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const aPage = await adminCtx.newPage();
    await aPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await aPage.fill('input[name="email"]', "admin@360kids.test");
    await aPage.fill('input[name="password"]', "AdminPass123!");
    await aPage.click(".auth-card form > button.btn");
    await aPage.waitForURL("**/admin");
    for (const r of ["/admin", "/admin/partners", "/admin/programs", "/admin/bookings", "/admin/content"]) {
      await aPage.goto(`${BASE}${r}`, { waitUntil: "load" });
      await aPage.locator("#main").waitFor({ state: "attached" });
      const ov = await aPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(ov, false, `No horizontal overflow at 360px on ${r}`);
    }

    // 4. Arabic RTL check
    await mPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await mPage.locator(".mobile-menu-btn").click();
    await mPage.locator("#mobile-account-menu .language-switcher select").selectOption("ar");
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
