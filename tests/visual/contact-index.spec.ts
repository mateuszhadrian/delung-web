// Podstrona /kontakt/ po porcie na design delung (Etap 5) — zrzuty
// statycznych regionów na WSZYSTKICH 6 profilach (widok bez pinowanych
// scen → element-screenshoty, żaden sweep nie jest potrzebny; wzorzec
// proces.spec.ts). Determinizm: freeze.css (prepareSweep) zeruje
// czasowe animacje i wejścia [data-rev].
// Formularz zrzucamy PRZED interakcją (stan spoczynkowy — mechanikę
// weryfikuje e2e contact.spec.ts).
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/kontakt/";

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

test("kontakt: widok startowy vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  // Desktop: rozmyte hero + navbar `over` + kafle wjeżdżające na jego dół;
  // mobile: jasny hero tekstowy pod białym paskiem.
  await expect(page).toHaveScreenshot("contact-top.png");
});

test("kontakt: kafle kontaktowe vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  // Wartości tel/mail składa JS (sloty D-CH5) — prepareSweep czeka na
  // gotowość strony, więc na zrzucie są już pełne dane, nie maska.
  await shootSection(page, ".kt-cards", "contact-cards.png");
});

test("kontakt: karta formularza vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, "#contact .kt-frame", "contact-form.png");
});

test("kontakt: pigułka social vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  // Duplikat per-breakpoint (D-K3) — zrzucamy widoczny egzemplarz.
  await shootSection(page, ".kt-soc-sec:visible", "contact-soc.png");
});

test("kontakt: stopka vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, "footer.ft", "contact-footer.png");
});
