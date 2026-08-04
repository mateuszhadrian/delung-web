// Strona główna (część 4.2) — element-zrzuty sekcji na wszystkich
// 6 profilach + mini-sweep scen przypiętych (oferta/realizacje) tylko na
// chromium-1920 (bez mnożenia baseline'ów).
// Determinizm: freeze.css (prepareSweep) zeruje CZASOWE animacje —
// crossfade hero staje na pierwszym kadrze (baza opacity w komponencie),
// marquee logotypów i opinii na początku pętli; transformy sterowane
// scrollem (home-scroll.ts) są deterministyczne przy ustalonej pozycji.
// Kafle realizacji na preview to beżowe placeholdery (lokalny 404 mediów
// R2 — media żyją na media.delung.pl; spójne z baseline'ami work-index).
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, scrollPageToStable, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/";

usePreviewGuard();

/** Dojeżdża do sekcji, czeka aż reveale/scrub usiądą i zrzuca element.
 *  Mikro-scroll przed zrzutem = wymuszenie re-rasteryzacji warstwy sticky
 *  paska (WebKit trzyma ją „miękko" do pierwszego przemalowania, a pasek
 *  wjeżdża w kadr elementów u góry viewportu — wzorzec z widoku
 *  startowego). */
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

test("strona główna: widok startowy (hero + pasek) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  // Mikro-scroll tam i z powrotem: WebKit potrafi trzymać warstwę sticky
  // paska w niższej rasteryzacji do pierwszego przemalowania — zrzut bez
  // tego łapał raz ostre, raz rozmyte logo (flake ~0.01 ratio).
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  // Viewport: mobile — zdjęcie hero z tekstem; desktop — pierwszy kadr
  // sceny z typografią SVG + transparentny pasek `over` (--p = 0).
  await expect(page).toHaveScreenshot("index-top.png");
});

test("strona główna: pasek zaufania + logotypy vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".trust", "index-trust.png");
  await shootSection(page, ".logos", "index-logos.png");
});

test("strona główna: sekcja oferty vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  // Desktop: kadr sceny przypiętej w punkcie startu (postęp 0);
  // mobile: kolumna tekstu + karuzela kafli.
  await shootSection(page, "[data-home-of] .of-pin", "index-oferta.png");
});

test("strona główna: sekcja procesu vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, "[data-home-pr]", "index-proces.png");
});

test("strona główna: sekcja realizacji vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, "[data-home-re] .re-pin", "index-realizacje.png");
});

test("strona główna: sekcja o nas vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, "[data-home-abt]", "index-o-nas.png");
});

test("strona główna: sekcja opinii vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, "[data-home-op]", "index-opinie.png");
});

test("strona główna: banner kontaktu vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  // Sloty tel/mail wypełnia JS chrome'u przed zrzutem (gotoReady czeka na
  // networkidle — skrypty odpalone).
  await shootSection(page, "#contact", "index-kontakt.png");
});

// ── mini-sweep scen przypiętych (desktop) ──
// Postęp scen napędza scroll (home-scroll.ts, bez snapa) — trzy klatki osi
// na jednym profilu desktop wystarczą jako regres mechaniki.
for (const scene of [
  { key: "of", selector: "[data-home-of]" },
  { key: "re", selector: "[data-home-re]" },
]) {
  test(`strona główna: sweep sceny ${scene.key} (chromium-1920)`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-1920",
      "sweep scen przypiętych — jeden profil desktop",
    );
    await prepareSweep(page, PATH);
    const range = await page.evaluate((sel) => {
      const el = document.querySelector<HTMLElement>(sel)!;
      return {
        top: el.offsetTop,
        span: el.offsetHeight - window.innerHeight,
      };
    }, scene.selector);
    const points = [0, 0.5, 1] as const;
    for (let i = 0; i < points.length; i++) {
      await scrollPageToStable(page, range.top + range.span * points[i]);
      await settle(page, 400);
      const name = `index-${scene.key}-sweep-${String(i).padStart(2, "0")}-p${String(
        Math.round(points[i] * 100),
      ).padStart(3, "0")}.png`;
      // expect.soft: jedna rozjechana klatka nie ucina sweepa.
      await expect.soft(page).toHaveScreenshot(name);
    }
  });
}
