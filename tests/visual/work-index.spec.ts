// Podstrona /realizacje/ (część 4.4) — zrzuty regionów designu na
// 6 profilach + stany detalu #work-detail: sheet na profilach mobile,
// modal (i kadr wideo POD MASKĄ — klatka wideo to loteria, testing.md)
// tylko na chromium-1920, bez mnożenia baseline'ów. Determinizm:
// prepareSweep (freeze.css zatrzymuje przejścia; reveale [data-rev]
// dostają rv-in od razu w pierwszym ekranie). Obrazy z R2 na preview to
// znane 404 (/cdn-cgi/image istnieje tylko na produkcji) — kafle renderują
// tło #e5e1da deterministycznie.
import { expect, test, type Page } from "@playwright/test";
import { useVisualFixtureGuard } from "../helpers/guards";
import { settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/realizacje/";

useVisualFixtureGuard();

async function prepare(page: Page) {
  await prepareSweep(page, PATH);
}

/** Otwiera detal pierwszego kafla i czeka na spoczynek nakładki. */
async function openFirstDetail(page: Page) {
  const card = page.locator(".re-grid [data-work-slug]").first();
  await card.scrollIntoViewIfNeeded();
  await settle(page);
  await card.click();
  const detail = page.locator("#work-detail");
  await expect(detail).toHaveClass(/is-open/);
  await settle(page, 600);
  return detail;
}

test("realizacje: góra strony (head + szyna filtrów) vs baseline", async ({
  page,
}) => {
  await prepare(page);
  await expect(page).toHaveScreenshot("work-index-top.png");
});

test("realizacje: siatka kafli vs baseline", async ({ page }, testInfo) => {
  await prepare(page);
  const grid = page.locator(".re-grid");
  await grid.scrollIntoViewIfNeeded();
  await settle(page);
  // Wysoki element na chromium-pixel-5 (DPR 2.75) — subpikselowy jitter
  // stitchowania jak w work/contact z Etapu 3; próg pochłania jitter,
  // realną regresję (>2% pikseli) i tak złapie.
  const ratio = testInfo.project.name === "chromium-pixel-5" ? 0.02 : undefined;
  await expect(grid).toHaveScreenshot("work-index-grid.png", {
    ...(ratio !== undefined ? { maxDiffPixelRatio: ratio } : {}),
  });
});

test("realizacje: sekcja CTA vs baseline", async ({ page }) => {
  await prepare(page);
  const cta = page.locator(".re-cta");
  await cta.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(cta).toHaveScreenshot("work-index-cta.png");
});

test("realizacje: detal otwarty (sheet mobile / modal 1920)", async ({
  page,
}, testInfo) => {
  const isMobileProfile = Boolean(testInfo.project.use.isMobile);
  test.skip(
    !isMobileProfile && testInfo.project.name !== "chromium-1920",
    "sheet na profilach mobile, modal tylko na chromium-1920",
  );
  await prepare(page);
  const detail = await openFirstDetail(page);
  await expect(detail).toHaveScreenshot("work-detail-open.png", {
    // maska na wideo w galerii, gdyby pierwszy projekt je miał
    // maska obejmuje też podłożoną klatkę (.dt-poster) — to ten sam kadr
    // filmu co poster, więc na zrzucie jest równie niedeterministyczny
    mask: [detail.locator("video"), detail.locator(".dt-poster")],
  });
});

test("realizacje: podgląd pełnoekranowy galerii (sheet mobile / 1920)", async ({
  page,
}, testInfo) => {
  const isMobileProfile = Boolean(testInfo.project.use.isMobile);
  test.skip(
    !isMobileProfile && testInfo.project.name !== "chromium-1920",
    "podgląd na profilach mobile + chromium-1920",
  );
  await prepare(page);
  const detail = await openFirstDetail(page);
  await detail.locator("[data-slide]").first().click();
  const lb = detail.locator("[data-lightbox]");
  await expect(lb).toBeVisible();
  await settle(page, 600);
  await expect(lb).toHaveScreenshot("work-detail-fullscreen.png", {
    mask: [lb.locator("video"), lb.locator(".dt-poster")],
  });
});

test("realizacje: kadr wideo w detalu (maska) — tylko 1920", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "stan po przełączeniu kadru — jeden profil wystarczy",
  );
  await prepare(page);
  // wpis z wideo otwieramy po slugach z DOM (data-cat niepotrzebny —
  // szukamy kafla, którego detal ma slajd z wideo)
  const detail = await openFirstDetail(page);
  const hasVideo = (await detail.locator("video").count()) > 0;
  if (!hasVideo) {
    // pierwszy projekt bez wideo — przejdź projnavem aż do wpisu z wideo
    for (let i = 0; i < 12; i++) {
      await detail.locator("[data-nextproj]").click();
      await settle(page, 400);
      if ((await detail.locator("video").count()) > 0) break;
    }
  }
  test.skip(
    (await detail.locator("video").count()) === 0,
    "brak wpisu z wideo w kolekcji",
  );
  // dojazd kadrów do slajdu z wideo (dash z indeksem slajdu wideo)
  const idx = await detail
    .locator("[data-slide]")
    .evaluateAll((slides) =>
      slides.findIndex((s) => s.querySelector("video") !== null),
    );
  await detail.locator(`[data-dashes] [data-shot="${idx}"]`).click();
  await settle(page, 700);
  await expect(detail).toHaveScreenshot("work-detail-video.png", {
    // maska obejmuje też podłożoną klatkę (.dt-poster) — to ten sam kadr
    // filmu co poster, więc na zrzucie jest równie niedeterministyczny
    mask: [detail.locator("video"), detail.locator(".dt-poster")],
  });
});
