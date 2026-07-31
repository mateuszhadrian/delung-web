// Podstrona realizacji (/realizacje/): pełna lista wpisów z Content
// Collections, nakładki WorkDetail (Modal >760 px / BottomSheet ≤760 px),
// scroll NATYWNY (bez Lenisa), chrome globalny 4.1 (sticky pasek + stopka
// ft). PL-only (delung); pełna adaptacja speców do widoków delung —
// Etap 3/4 instrukcji.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { OFERTA_PATH } from "../../src/lib/routes";
import {
  collectPageIssues,
  useChromium1920Only,
  usePreviewGuard,
} from "../helpers/guards";
import { gotoReady, scrollPageTo } from "../helpers/scroll";

const SITE = "https://delung.pl";

const ENTRY_COUNT = readdirSync(
  fileURLToPath(new URL("../../src/content/realizacje", import.meta.url)),
).filter((f) => f.endsWith(".json")).length;

const PAGES = [{ path: "/realizacje/", lang: "pl", homePath: "/" }] as const;

usePreviewGuard();

/** Dociera do pierwszej karty siatki i uspokaja scroll przed klikiem. */
async function revealFirstCard(page: Page) {
  const card = page.locator(".wix-grid [data-work-slug]").first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return card;
}

for (const p of PAGES) {
  test.describe(`${p.path}: meta i treść (jeden profil)`, () => {
    useChromium1920Only(
      "meta/treść niezależne od profilu — jeden projekt wystarczy",
    );

    test(`lang, tytuł, description, canonical, hreflang`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      await expect(page).toHaveTitle(ui[p.lang]["workPage.title"]);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", ui[p.lang]["workPage.description"]);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${p.path}`,
      );
    });

    test(`siatka pokazuje WSZYSTKIE wpisy + kafel ghost`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator(".wix-grid [data-work-slug]")).toHaveCount(
        ENTRY_COUNT,
      );
      await expect(page.locator(".wix-ghost")).toBeVisible();
      await expect(page.locator(".wix-title")).toContainText(
        ui[p.lang]["workPage.headlineAccent"],
      );
    });

    test(`scroll natywny — Lenis nie jest ładowany`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("body")).toHaveAttribute(
        "data-smooth-scroll",
        "off",
      );
      expect(await page.evaluate(() => Boolean(window.__lenis))).toBe(false);
    });

    test(`navbar podstrony: Oferta → podstrona, Realizacje = bieżąca`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Pozycja „Oferta" prowadzi na /oferta/.
      await expect(
        page.locator(`.nav-link[href="${OFERTA_PATH}"]`),
      ).toBeAttached();
      // Link Realizacje wskazuje bieżącą podstronę (aria-current).
      const work = page.locator(`.nav-link[href="${p.path}"]`);
      await expect(work).toBeAttached();
      await expect(work).toHaveAttribute("aria-current", "page");
      // Stopka: współdzielony Footer (chrome globalny 4.1) — link polityki
      // prywatności + social media (Instagram).
      await expect(
        page.locator(
          `.wix-foot .ft-nav a[href="${ui[p.lang]["contact.policyHref"]}"]`,
        ),
      ).toBeAttached();
      await expect(page.locator(".wix-foot .ft-soc a").first()).toBeAttached();
    });

    test(`sticky pasek z logo — widoczny u góry także po scrollu`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Chrome 4.1: logo ZAWSZE w pasku (design), BackButton poza chrome
      // (D-CH8 w docs/analiza-chrome-globalny.md), pasek sticky bez
      // chowania przy scrollu (koniec data-hidden z szablonu).
      const logo = page.locator(".hdr-logo");
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute("href", p.homePath);
      await scrollPageTo(page, 600);
      const nav = page.locator("[data-nav]");
      await expect(nav).toBeVisible();
      const box = await nav.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBe(0);
    });

    test(`strona ładuje się bez błędów konsoli i 404`, async ({ page }) => {
      const issues = collectPageIssues(page);
      await gotoReady(page, p.path);
      expect(issues()).toEqual([]);
    });
  });
}

test.describe("desktop: Modal na podstronie", () => {
  test.skip(({ isMobile }) => !!isMobile, "modal tylko na desktop");

  test("klik w kartę otwiera modal z treścią projektu, × zamyka", async ({
    page,
  }) => {
    await gotoReady(page, "/realizacje/");
    const card = await revealFirstCard(page);
    const name = await card.getAttribute("data-work-name");
    const modal = page.locator("#work-modal");

    await card.click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/is-open/);
    await expect(modal.locator(".wdx__title")).toHaveText(name ?? "");

    await modal.locator("[data-overlay-close]").click();
    await expect(modal).toBeHidden();
    await expect(modal.locator(".wdx")).toHaveCount(0);
  });
});

test.describe("mobile: BottomSheet na podstronie", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("tap w kartę otwiera sheet; zamykanie przyciskiem", async ({ page }) => {
    await gotoReady(page, "/realizacje/");
    const card = await revealFirstCard(page);
    const sheet = page.locator("#work-sheet");

    await card.click();
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator(".wdx__title")).toHaveText(
      (await card.getAttribute("data-work-name")) ?? "",
    );

    await sheet.locator("[data-overlay-close]").click();
    await expect(sheet).toBeHidden();
    await expect(sheet.locator(".wdx")).toHaveCount(0);
  });
});

test.describe("dojście ze strony głównej — linki Więcej realizacji", () => {
  // Zajawka .re z części 4.2 (PL-only): linki „Więcej" w tekstach sceny
  // desktopowej i CTA „Przeglądaj nasze realizacje" niosą [data-work-more]
  // i prowadzą na podstronę.
  test("wszystkie linki data-work-more prowadzą na podstronę", async ({
    page,
  }) => {
    await gotoReady(page);
    const links = await page.locator("a[data-work-more]").all();
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      await expect(a).toHaveAttribute("href", "/realizacje/");
    }
  });

  test("CTA zajawki nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    // Na desktopie CTA żyje w scenie przypiętej — dojazd na początek
    // sekcji pokazuje pin z widocznym CTA; na mobile CTA stoi we flow.
    const secTop = await page.evaluate(
      () => document.querySelector<HTMLElement>("[data-home-re]")!.offsetTop,
    );
    await scrollPageTo(page, secTop + 10);
    await page.locator(".re-cta a[data-work-more]").click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator(".wix-grid")).toBeVisible();
  });
});
