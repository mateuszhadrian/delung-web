// /kategorie/ (część 4.3) — widok mobile-only: na profilach desktop
// inline skrypt Etapu 0 redirectuje na /oferta/ przed paintem, więc
// zrzuty biegają WYŁĄCZNIE na profilach mobilnych (webkit-SE/14,
// pixel-5). Zakres: widok startowy, lista kafli, CTA finałowe oraz
// otwarta karta kategorii (bottom sheet — freeze.css zeruje przejście,
// panel od razu w stanie końcowym).
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/kategorie/";

usePreviewGuard();

test.skip(({ isMobile }) => !isMobile, "widok mobile-only (redirect desktop)");

/** Dojazd do sekcji + mikro-scroll (wzorzec tests/visual/index.spec.ts). */
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

test("kategorie: widok startowy vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("kategorie-top.png");
});

test("kategorie: lista kafli vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".kt-list", "kategorie-list.png");
});

test("kategorie: CTA finałowe vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".kt-cta", "kategorie-cta.png");
});

test("kategorie: otwarta karta kategorii vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await page.locator(".kt-card").first().click();
  const sheet = page.locator("#kat-kuchnie");
  await expect(sheet).toHaveClass(/is-open/);
  await settle(page, 400);
  await expect(page).toHaveScreenshot("kategorie-sheet.png");
});
