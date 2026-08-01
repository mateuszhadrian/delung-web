// /o-nas/ (część 4.5) — zrzuty na 6 profilach: góra strony (hero),
// zespół, precyzja, opinie; desktop dodatkowo manifest; mini-sweep toru
// zespołu tylko na chromium-1920 (bez mnożenia baseline'ów — wzorzec
// index.spec). Determinizm: freeze.css (prepareSweep) zatrzymuje marquee
// opinii na początku pętli; transformy sterowane scrollem (onas-motion)
// są deterministyczne przy ustalonej pozycji.
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, scrollPageToStable, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/o-nas/";

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

test("o-nas: widok startowy vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  // Desktop: hero grid tekst/zdjęcie + ciemny navbar; mobile: zdjęcie+karta.
  await expect(page).toHaveScreenshot("o-nas-top.png");
});

test("o-nas: manifest vs baseline (desktop)", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "sekcję manifest renderuje tylko desktop");
  await prepareSweep(page, PATH);
  await shootSection(page, ".manifest", "o-nas-manifest.png");
});

test("o-nas: zespół vs baseline", async ({ page, isMobile }) => {
  await prepareSweep(page, PATH);
  if (isMobile) {
    await shootSection(page, ".team", "o-nas-team.png");
  } else {
    // scena przypięta 300vh — zrzut viewportu na początku osi
    const top = await page
      .locator(".team")
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await scrollPageTo(page, top + 8);
    await settle(page, 400);
    await expect(page).toHaveScreenshot("o-nas-team.png");
  }
});

test("o-nas: precyzja vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".prec", "o-nas-prec.png");
});

test("o-nas: opinie vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await shootSection(page, ".rev", "o-nas-opinie.png");
});

// ── mini-sweep toru zespołu (desktop) ──
test("o-nas: sweep toru zespołu (chromium-1920)", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "sweep toru zespołu — jeden profil desktop",
  );
  await prepareSweep(page, PATH);
  const range = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".team")!;
    return {
      top: el.getBoundingClientRect().top + window.scrollY,
      span: el.offsetHeight - window.innerHeight,
    };
  });
  const points = [0, 0.5, 1] as const;
  for (let i = 0; i < points.length; i++) {
    await scrollPageToStable(page, range.top + range.span * points[i]);
    await settle(page, 400);
    const name = `o-nas-team-sweep-${String(i).padStart(2, "0")}-p${String(
      Math.round(points[i] * 100),
    ).padStart(3, "0")}.png`;
    // expect.soft: jedna rozjechana klatka nie ucina sweepa.
    await expect.soft(page).toHaveScreenshot(name);
  }
});
