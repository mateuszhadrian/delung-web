// /polityka-prywatnosci/ (część 4.5) — dokument statyczny, treść
// niezależna od profilu: zrzuty na DWÓCH profilach reprezentatywnych
// (chromium-1920 = layout z TOC, chromium-pixel-5 = jedna kolumna) —
// decyzja D-P8 (wzorzec zawężenia jak kategorie = tylko mobile).
// Zakres: góra dokumentu (head + początek treści), środek z TOC
// (desktop), pasek CTA.
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/polityka-prywatnosci/";
const PROJECTS = ["chromium-1920", "chromium-pixel-5"];

usePreviewGuard();

// eslint-disable-next-line no-empty-pattern -- Playwright wymaga destrukturyzacji fixtures
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    !PROJECTS.includes(testInfo.project.name),
    "dokument statyczny — wystarczą profile chromium-1920 i chromium-pixel-5",
  );
});

/** Mikro-scroll + zrzut elementu (wzorzec pozostałych speców visual). */
async function shootSection(page: Page, selector: string, name: string) {
  const el = page.locator(selector);
  await el.scrollIntoViewIfNeeded();
  await settle(page, 300);
  const y = await page.evaluate(() => window.scrollY);
  await scrollPageTo(page, y + 12);
  await scrollPageTo(page, y);
  await settle(page, 300);
  await expect(el).toHaveScreenshot(name);
}

test("polityka: widok startowy vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("polityka-top.png");
});

test("polityka: środek dokumentu vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  // sekcja 04 — desktop pokazuje obok sticky TOC, mobile kolumnę treści
  const top = await page
    .locator("#pp-04")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollPageTo(page, top - 120);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("polityka-doc.png");
});

test("polityka: pasek CTA vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".pp-cta", "polityka-cta.png");
});
