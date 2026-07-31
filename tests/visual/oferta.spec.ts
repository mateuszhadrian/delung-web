// /oferta/ (część 4.3) — element-zrzuty na 6 profilach: head + zakładki
// + panel 01 (desktop) / head + karuzela (mobile), marquee logotypów
// (tylko desktop — mobile go nie renderuje), CTA procesu; dodatkowo stan
// po przełączeniu zakładki (panel 05) tylko na chromium-1920 (bez
// mnożenia baseline'ów). Determinizm: freeze.css (prepareSweep) zeruje
// czasowe animacje — marquee staje na początku pętli, keyframes
// przełączenia panelu lądują w stanie końcowym (baza = stan końcowy).
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/oferta/";

usePreviewGuard();

/** Dojazd do sekcji + mikro-scroll (re-rasteryzacja sticky paska WebKit —
 *  wzorzec tests/visual/index.spec.ts) + zrzut elementu. */
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

test("oferta: widok startowy vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  // Desktop: head + zakładki + panel 01; mobile: head + karuzela.
  await expect(page).toHaveScreenshot("oferta-top.png");
});

test("oferta: sekcja oferty vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".of", "oferta-of.png");
});

test("oferta: marquee logotypów vs baseline (desktop)", async ({
  page,
  isMobile,
}) => {
  test.skip(!!isMobile, "marquee renderuje tylko desktop");
  await prepareSweep(page, PATH);
  await shootSection(page, ".mq", "oferta-mq.png");
});

test("oferta: CTA procesu vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".pr", "oferta-pr.png");
});

test("oferta: panel po przełączeniu zakładki (chromium-1920)", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "stan po przełączeniu — jeden profil desktop",
  );
  await prepareSweep(page, PATH);
  await page.locator("[data-oftab]").nth(4).click();
  await settle(page, 300);
  await expect(page.locator(".of")).toHaveScreenshot("oferta-panel-05.png");
});
