// Widok /kategorie/ (część 4.3): mobile-only lista 6 kafli; karta
// kategorii = pre-renderowany bottom sheet na overlay.ts (Esc/X/scrim/
// swipe-down — D-OK5); desktop = client-side redirect na /oferta/ przed
// paintem (mechanizm Etapu 0 — tu jawny test). Decyzje:
// docs/analiza-oferta-kategorie.md.
import { expect, test } from "@playwright/test";
import { OFERTA_CATEGORIES } from "../../src/components/sections/oferta/oferta-content";
import {
  CONTACT_PATH,
  KATEGORIE_PATH,
  OFERTA_PATH,
  WORK_INDEX_PATH,
} from "../../src/lib/routes";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { readRealizacje } from "../helpers/realizacje";
import { gotoReady, settle } from "../helpers/scroll";

usePreviewGuard();

test.describe("kategorie desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "redirect dotyczy desktopu");

  test("desktop redirectuje na /oferta/ (mechanizm Etapu 0)", async ({
    page,
  }) => {
    await page.goto(KATEGORIE_PATH, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(new RegExp(`${OFERTA_PATH}?$`));
    await expect(page.locator("main h1")).toBeVisible();
  });
});

test.describe("kategorie mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "widok tylko mobile");

  test("lista 6 kafli; strona bez błędów konsoli i 404", async ({ page }) => {
    const issues = collectPageIssues(page);
    await gotoReady(page, KATEGORIE_PATH);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".kt-card")).toHaveCount(
      OFERTA_CATEGORIES.length,
    );
    await settle(page);
    expect(issues()).toEqual([]);
  });

  test("tap w kafel otwiera kartę kategorii, Esc zamyka", async ({ page }) => {
    await gotoReady(page, KATEGORIE_PATH);
    const idx = 1; // Szafy i garderoby
    const cat = OFERTA_CATEGORIES[idx];
    await page.locator(".kt-card").nth(idx).click();
    const sheet = page.locator(`#kat-${cat.slug}`);
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator("h2")).toHaveText(cat.title);

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("deep-link #<slug> otwiera kartę na wejściu", async ({ page }) => {
    // Kontrakt kafli karuzeli /oferta/ (korekta po testach 4.3).
    const cat = OFERTA_CATEGORIES[1]; // Szafy i garderoby
    await gotoReady(page, `${KATEGORIE_PATH}#${cat.slug}`);
    const sheet = page.locator(`#kat-${cat.slug}`);
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator("h2")).toHaveText(cat.title);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("przycisk X zamyka kartę", async ({ page }) => {
    await gotoReady(page, KATEGORIE_PATH);
    await page.locator(".kt-card").first().click();
    const sheet = page.locator(`#kat-${OFERTA_CATEGORIES[0].slug}`);
    await expect(sheet).toHaveClass(/is-open/);
    await sheet.locator("[data-overlay-close]").click();
    await expect(sheet).toBeHidden();
  });

  test("klik w scrim (nad panelem) zamyka kartę", async ({ page }) => {
    await gotoReady(page, KATEGORIE_PATH);
    await page.locator(".kt-card").first().click();
    const sheet = page.locator(`#kat-${OFERTA_CATEGORIES[0].slug}`);
    await expect(sheet).toHaveClass(/is-open/);
    // Punkt przy górnej krawędzi = tło nakładki, poza [data-overlay-panel]
    // (panel ma 96svh — u samej góry zostaje pas scrima).
    await sheet.click({ position: { x: 10, y: 5 } });
    await expect(sheet).toBeHidden();
  });

  test("swipe-down za uchwyt zamyka kartę (gest overlay.ts)", async ({
    page,
  }) => {
    await gotoReady(page, KATEGORIE_PATH);
    await page.locator(".kt-card").first().click();
    const sheet = page.locator(`#kat-${OFERTA_CATEGORIES[0].slug}`);
    await expect(sheet).toHaveClass(/is-open/);
    // Odczekaj wjazd panelu (transform .38s) — boundingBox mierzony
    // w trakcie animacji celowałby tam, gdzie uchwyt dopiero BĘDZIE.
    await page.waitForTimeout(600);

    const grab = sheet.locator("[data-overlay-drag]");
    const box = await grab.boundingBox();
    expect(box).not.toBeNull();
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(startX, startY + i * 25);
    }
    await page.mouse.up();

    await expect(sheet).toBeHidden();
  });

  test("linki karty: realizacje z kategorii + kontakt w stopce", async ({
    page,
  }) => {
    await gotoReady(page, KATEGORIE_PATH);
    await page.locator(".kt-card").first().click();
    const sheet = page.locator(`#kat-${OFERTA_CATEGORIES[0].slug}`);
    await expect(sheet).toHaveClass(/is-open/);
    // Deep-link filtra /realizacje/#<slug> (część 4.4, D-R2).
    await expect(sheet.locator(".dt-more a")).toHaveAttribute(
      "href",
      `${WORK_INDEX_PATH}#${OFERTA_CATEGORIES[0].slug}`,
    );
    const foot = sheet.locator(".dt-foot a");
    await expect(foot).toHaveAttribute("href", CONTACT_PATH);
    await foot.click();
    await expect(page).toHaveURL(new RegExp(`${CONTACT_PATH}?$`));
    await expect(page.locator("#contact .kt-form")).toBeAttached();
  });

  test("CTA realizacji istnieje TYLKO w kategoriach, które mają wpisy", async ({
    page,
  }) => {
    // Runda 4: przycisk prowadzi na przefiltrowaną listę, więc w kategorii
    // bez wpisów obiecywałby pustą stronę. Oczekiwanie liczymy z tej samej
    // treści co build (kolekcja), nie z listy zaszytej w teście.
    const zWpisami = new Set(
      readRealizacje<{ category: string; order: number }>().map(
        (e) => e.category,
      ),
    );
    await gotoReady(page, KATEGORIE_PATH);
    for (const c of OFERTA_CATEGORIES) {
      const cta = page.locator(`#kat-${c.slug} .dt-more a`);
      if (zWpisami.has(c.slug)) {
        await expect(cta).toHaveAttribute(
          "href",
          `${WORK_INDEX_PATH}#${c.slug}`,
        );
      } else {
        await expect(cta).toHaveCount(0);
      }
    }
  });

  test("koniec treści nie chowa się pod stopką, gdy karta nie ma CTA", async ({
    page,
  }) => {
    // Zapas pod przyklejoną stopką niósł kiedyś sam przycisk CTA, więc gdy
    // zniknął (D-W5), ostatni parametr wjeżdżał pod „CHCESZ WIĘCEJ
    // SZCZEGÓŁÓW?" — zmierzone 35 px zasłonięcia.
    const zWpisami = new Set(
      readRealizacje<{ category: string; order: number }>().map(
        (e) => e.category,
      ),
    );
    const bezCta = OFERTA_CATEGORIES.find((c) => !zWpisami.has(c.slug));
    test.skip(
      !bezCta,
      "każda kategoria oferty ma realizacje — nie ma czego mierzyć",
    );

    await gotoReady(page, KATEGORIE_PATH);
    await page.evaluate(
      (id) => window.overlay?.open(id),
      `kat-${bezCta!.slug}`,
    );
    const sheet = page.locator(`#kat-${bezCta!.slug}`);
    await expect(sheet).toHaveClass(/is-open/);
    await settle(page, 400);

    const zaslonieteO = await sheet.evaluate((el) => {
      const scroll = el.querySelector<HTMLElement>("[data-overlay-scroll]")!;
      scroll.scrollTo({ top: scroll.scrollHeight, behavior: "instant" });
      const foot = el.querySelector<HTMLElement>(".dt-foot")!;
      const ostatni = [...el.querySelectorAll<HTMLElement>(".dt-spec")].pop()!;
      return Math.round(
        ostatni.getBoundingClientRect().bottom -
          foot.getBoundingClientRect().top,
      );
    });
    expect(zaslonieteO).toBeLessThanOrEqual(0);
  });

  test("CTA finałowe prowadzi do kontaktu", async ({ page }) => {
    await gotoReady(page, KATEGORIE_PATH);
    const cta = page.locator(".kt-cta a");
    await expect(cta).toHaveAttribute("href", CONTACT_PATH);
    await cta.scrollIntoViewIfNeeded();
    await settle(page, 300);
    await cta.click();
    await expect(page).toHaveURL(new RegExp(`${CONTACT_PATH}?$`));
  });
});
