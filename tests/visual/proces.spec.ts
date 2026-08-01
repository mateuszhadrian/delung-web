// /proces-wspolpracy/ (część 4.5) — zrzuty na 6 profilach: góra strony
// (hero), pierwszy krok, CTA; desktop dodatkowo sekcja EFEKT; mini-sweep
// kolumny swap kroków tylko na chromium-1920 (bez mnożenia baseline'ów —
// wzorzec index.spec). Determinizm: freeze.css (prepareSweep) zeruje
// czasowe animacje (cue hero, puls kropki CTA); clip-path swap i liczniki
// są deterministyczne przy ustalonej pozycji scrolla (proces-motion.ts).
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, scrollPageToStable, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/proces-wspolpracy/";

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

test("proces: widok startowy vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  // Desktop: hero ze zdjęciem + ciemny navbar over; mobile: hero tekstowy.
  await expect(page).toHaveScreenshot("proces-top.png");
});

test("proces: pierwszy krok vs baseline", async ({ page, isMobile }) => {
  await prepareSweep(page, PATH);
  if (isMobile) {
    // element-zrzut kroku (numer/tag/h2/tekst/zdjęcie)
    await shootSection(page, '.step[data-step="1"]', "proces-step-01.png");
  } else {
    // desktop: krok żyje obok sticky kolumny swap — zrzut viewportu
    const top = await page
      .locator(".steps")
      .evaluate((el) => (el as HTMLElement).offsetTop);
    await scrollPageTo(page, top + 8);
    await settle(page, 400);
    await expect(page).toHaveScreenshot("proces-step-01.png");
  }
});

test("proces: sekcja EFEKT vs baseline (desktop)", async ({
  page,
  isMobile,
}) => {
  test.skip(!!isMobile, "sekcję EFEKT renderuje tylko desktop");
  await prepareSweep(page, PATH);
  await shootSection(page, ".efekt", "proces-efekt.png");
});

test("proces: CTA vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".cta", "proces-cta.png");
});

// ── mini-sweep kolumny swap (desktop) ──
// Postęp napędza scroll (proces-motion.ts, bez snapa) — trzy klatki osi
// na jednym profilu desktop wystarczą jako regres mechaniki clip-path.
test("proces: sweep kolumny swap (chromium-1920)", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "sweep kolumny swap — jeden profil desktop",
  );
  await prepareSweep(page, PATH);
  const range = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".steps")!;
    return { top: el.offsetTop, span: el.offsetHeight - window.innerHeight };
  });
  const points = [0, 0.5, 1] as const;
  for (let i = 0; i < points.length; i++) {
    await scrollPageToStable(page, range.top + range.span * points[i]);
    await settle(page, 1100); // clip-path transition 1 s musi usiąść
    const name = `proces-steps-sweep-${String(i).padStart(2, "0")}-p${String(
      Math.round(points[i] * 100),
    ).padStart(3, "0")}.png`;
    // expect.soft: jedna rozjechana klatka nie ucina sweepa.
    await expect.soft(page).toHaveScreenshot(name);
  }
});
