// Widok /oferta/ (część 4.3): desktop — zakładki kategorii (wzorzec ARIA
// tabs, panel 01 w SSR) + CTA realizacji i procesu; mobile — karuzela
// 3 kafli + „zobacz pełną ofertę" → /kategorie/ z paskiem postępu
// (gotchas karuzel: sections.md). Decyzje: docs/analiza-oferta-kategorie.md.
import { expect, test, type Page } from "@playwright/test";
import { HOME_KAFLE } from "../../src/components/sections/home/home-oferta-content";
import {
  OFERTA_CATEGORIES,
  OFERTA_KAFLE_MOBILE,
} from "../../src/components/sections/oferta/oferta-content";
import {
  KATEGORIE_PATH,
  OFERTA_PATH,
  PROCESS_PATH,
  WORK_INDEX_PATH,
} from "../../src/lib/routes";
import { OFERTA_DESKTOP_MIN_PX } from "../../src/components/sections/oferta/oferta-config";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { readRealizacje } from "../helpers/realizacje";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

test("strona ładuje się bez błędów konsoli i 404", async ({ page }) => {
  const issues = collectPageIssues(page);
  await gotoReady(page, OFERTA_PATH);
  await settle(page);
  expect(issues()).toEqual([]);
});

test.describe("oferta desktop (zakładki + panel)", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("6 zakładek; panel 01 aktywny w SSR, karuzela ukryta", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    await expect(page.locator("main h1")).toBeVisible();
    const tabs = page.locator("[data-oftab]");
    await expect(tabs).toHaveCount(OFERTA_CATEGORIES.length);
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    const first = page.locator("[data-ofpanel]").first();
    await expect(first).toBeVisible();
    await expect(first.locator(".of-ptitle")).toHaveText(
      OFERTA_CATEGORIES[0].title,
    );
    await expect(page.locator("[data-rail]")).toBeHidden();
  });

  test("klik zakładki przełącza panel (aria-selected + treść)", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    const idx = 4; // Zabudowy łazienkowe
    const tabs = page.locator("[data-oftab]");
    await tabs.nth(idx).click();
    await expect(tabs.nth(idx)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "false");
    const panel = page.locator("[data-ofpanel]").nth(idx);
    await expect(panel).toBeVisible();
    await expect(panel.locator(".of-ptitle")).toHaveText(
      OFERTA_CATEGORIES[idx].title,
    );
    await expect(page.locator("[data-ofpanel]").first()).toBeHidden();
  });

  test("strzałki klawiatury przełączają zakładki (ARIA tabs)", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    const tabs = page.locator("[data-oftab]");
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(page.locator("[data-ofpanel]").nth(1)).toBeVisible();
    await page.keyboard.press("End");
    const last = OFERTA_CATEGORIES.length - 1;
    await expect(tabs.nth(last)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("[data-ofpanel]").nth(last)).toBeVisible();
  });

  test("deep-link /oferta/#<slug> zaznacza zakładkę tej kategorii (D-P1)", async ({
    page,
  }) => {
    const idx = 2; // Wnętrza komercyjne
    const cat = OFERTA_CATEGORIES[idx];
    await gotoReady(page, `${OFERTA_PATH}#${cat.slug}`);
    const tabs = page.locator("[data-oftab]");
    await expect(tabs.nth(idx)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "false");
    const panel = page.locator("[data-ofpanel]").nth(idx);
    await expect(panel).toBeVisible();
    await expect(panel.locator(".of-ptitle")).toHaveText(cat.title);
    // Hash niesie goły slug — nie ma takiego id w dokumencie, więc
    // przeglądarka niczego nie scrolluje.
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);
  });

  test("nieznany slug w hashu zostawia panel 01 z SSR", async ({ page }) => {
    await gotoReady(page, `${OFERTA_PATH}#nie-ma-takiej`);
    await expect(page.locator("[data-oftab]").first()).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("[data-ofpanel]").first()).toBeVisible();
  });

  test("karta CTA panelu prowadzi do realizacji z etykietą kategorii", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    // :visible — karta CTA ma dwa warianty w DOM (obok zdjęcia na niskim
    // desktopie ≤820px / pod specami wyżej); widoczny jest zawsze jeden.
    const cta = page
      .locator("[data-ofpanel]")
      .first()
      .locator(".of-ctaCard:visible");
    // Deep-link filtra /realizacje/#<slug> (część 4.4, D-R2).
    await expect(cta).toHaveAttribute(
      "href",
      `${WORK_INDEX_PATH}#${OFERTA_CATEGORIES[0].slug}`,
    );
    // Etykieta z categoryLabel() (D-OK6), nie `rel` z eksportu.
    await expect(cta).toContainText("KUCHNIE");
  });

  test("karta CTA znika w kategoriach bez realizacji (runda 4)", async ({
    page,
  }) => {
    const zWpisami = new Set(
      readRealizacje<{ category: string; order: number }>().map(
        (e) => e.category,
      ),
    );
    await gotoReady(page, OFERTA_PATH);
    for (const [i, c] of OFERTA_CATEGORIES.entries()) {
      // panele są w SSR wszystkie — czytamy je bez przełączania zakładek
      const cta = page.locator("[data-ofpanel]").nth(i).locator(".of-ctaCard");
      // oba duplikaty karty (--side / --wide) znikają razem
      await expect(cta).toHaveCount(zWpisami.has(c.slug) ? 2 : 0);
    }
  });

  test("CTA procesu nawiguje na /proces-wspolpracy/", async ({ page }) => {
    await gotoReady(page, OFERTA_PATH);
    const btn = page.locator(".pr-btn");
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(page).toHaveURL(new RegExp(`${PROCESS_PATH}?$`));
    await expect(page.locator("main h1")).toBeVisible();
  });

  // Strażnik decyzji D-Q1: scroll w serwisie jest NATYWNY — żaden skrypt nie
  // przejmuje kółka. Lenis wyszedł z projektu, bo przy JS-owym scrollu każda
  // klatka wymuszała przemalowanie warstwy hero i Safari gubiło klatki
  // (protokół pomiaru: docs/analiza-poprawki-2.md, D-Q1). Ten test pilnuje,
  // żeby nikt nie wprowadził wygładzacza tylnymi drzwiami.
  test("scroll jest natywny — bez biblioteki wygładzającej", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    await settle(page, 300);
    expect(await page.evaluate(() => "__lenis" in window)).toBe(false);

    const before = await page.evaluate(() => Math.round(window.scrollY));
    await page.mouse.move(700, 500);
    await page.mouse.wheel(0, 600);
    await settle(page, 250);
    expect(
      await page.evaluate(() => Math.round(window.scrollY)),
    ).toBeGreaterThan(before);
  });
});

test.describe("oferta mobile (karuzela)", () => {
  test.skip(({ isMobile }) => !isMobile, "tylko układ mobile");

  test("3 kafle + „zobacz pełną ofertę” — wszystkie do /kategorie/; zakładki ukryte", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    await expect(page.locator("main h1")).toBeVisible();
    const cards = page.locator(".of-card");
    await expect(cards).toHaveCount(OFERTA_KAFLE_MOBILE);
    // Kafel kategorii niesie hash otwierający jej kartę na /kategorie/
    // (deep-link — korekta po testach 4.3); „zobacz pełną ofertę" bez.
    const hrefs = await cards.evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    hrefs.forEach((href, i) => {
      expect(href).toBe(`${KATEGORIE_PATH}#${OFERTA_CATEGORIES[i].slug}`);
    });
    await expect(page.locator(".of-all")).toHaveAttribute(
      "href",
      KATEGORIE_PATH,
    );
    await expect(page.locator("[data-oftab]").first()).toBeHidden();
  });

  test("tor spełnia kontrakt karuzeli (snap-stop)", async ({ page }) => {
    // Gotcha sections.md: scroll-snap-stop: always na kaflach — bez tego
    // szybki swipe przeskakuje kilka kafli naraz.
    await gotoReady(page, OFERTA_PATH);
    const rail = page.locator("[data-rail]");
    expect(
      await rail
        .locator(".of-card")
        .first()
        .evaluate((el) => getComputedStyle(el).scrollSnapStop),
    ).toBe("always");
  });

  test("przewinięcie toru przesuwa wypełnienie paska postępu", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    const fill = page.locator("[data-barfill]");
    const at = (tf: string) =>
      parseFloat(/translateX\(([-\d.]+)/.exec(tf)?.[1] ?? "0");
    const before = at(await fill.evaluate((el) => el.style.transform));
    await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>("[data-rail]")!;
      rail.scrollLeft = rail.scrollWidth;
    });
    await page.waitForTimeout(300);
    const after = at(await fill.evaluate((el) => el.style.transform));
    expect(after).toBeGreaterThan(before);
    expect(after).toBeGreaterThan(100); // dojazd na koniec toru (n-1)*100%
  });

  test("kafel kategorii otwiera kartę W MIEJSCU, bez nawigacji (D-P3)", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    const cat = OFERTA_CATEGORIES[1]; // Szafy i garderoby
    await page.locator(".of-card").nth(1).click();
    // Korekta D-OK3 po testach klienckich: zostajemy na /oferta/.
    await expect(page).toHaveURL(new RegExp(`${OFERTA_PATH}$`));
    const sheet = page.locator(`#kat-${cat.slug}`);
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator("h2")).toHaveText(cat.title);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("deep-link /oferta/#<slug> otwiera kartę na wejściu", async ({
    page,
  }) => {
    // Kanoniczny adres kategorii działa na obu progach (D-P1): tu sheet,
    // na desktopie zakładka.
    const cat = OFERTA_CATEGORIES[4]; // Zabudowy łazienkowe
    await gotoReady(page, `${OFERTA_PATH}#${cat.slug}`);
    const sheet = page.locator(`#kat-${cat.slug}`);
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator("h2")).toHaveText(cat.title);
  });

  test("kafel „zobacz pełną ofertę” nawiguje bez otwierania karty", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    await page.locator(".of-all").click();
    await expect(page).toHaveURL(new RegExp(`${KATEGORIE_PATH}$`));
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("[data-overlay].is-open")).toHaveCount(0);
  });

  test("CTA procesu (mobile) nawiguje na /proces-wspolpracy/", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    const btn = page.locator(".pr-btn");
    await btn.scrollIntoViewIfNeeded();
    await settle(page, 300);
    await btn.click();
    await expect(page).toHaveURL(new RegExp(`${PROCESS_PATH}?$`));
  });
});

// ── kafle zajawki na stronie głównej (D-P1/D-P2) ──
// Desktop: kafel = deep-link zakładki na /oferta/. Mobile: tap otwiera
// kartę kategorii W MIEJSCU, bez opuszczania strony głównej.
test.describe("dojście ze strony głównej — kafle zajawki oferty", () => {
  /** Dowozi scenę oferty w kadr (desktop: scena przypięta 300vh). */
  async function revealOferta(page: Page) {
    const top = await page.evaluate(
      () => document.querySelector<HTMLElement>("[data-home-of]")!.offsetTop,
    );
    await scrollPageTo(page, top + 10);
    await settle(page, 300);
  }

  test("każdy kafel linkuje /oferta/#<slug> swojej kategorii", async ({
    page,
  }) => {
    await gotoReady(page);
    const cards = page.locator("[data-home-of] .cat");
    await expect(cards).toHaveCount(HOME_KAFLE.length);
    const hrefs = await cards.evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    hrefs.forEach((href, i) => {
      expect(href).toBe(`${OFERTA_PATH}#${HOME_KAFLE[i].slug}`);
    });
  });

  test("desktop: klik w kafel otwiera /oferta/ na TEJ kategorii", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "na mobile kafel otwiera kartę w miejscu");
    await gotoReady(page);
    await revealOferta(page);
    const idx = 1; // Szafy i garderoby — inna niż domyślny panel 01
    await page.locator("[data-home-of] .cat").nth(idx).click();
    await expect(page).toHaveURL(
      new RegExp(`${OFERTA_PATH}#${HOME_KAFLE[idx].slug}$`),
    );
    const tabs = page.locator("[data-oftab]");
    await expect(tabs.nth(idx)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("[data-ofpanel]").nth(idx)).toBeVisible();
  });

  test("mobile: tap w kafel otwiera kartę bez opuszczania strony", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "na desktopie kafel nawiguje (deep-link zakładki)");
    await gotoReady(page);
    await revealOferta(page);
    const idx = 1; // Szafy i garderoby
    const cat = OFERTA_CATEGORIES[idx];
    await page.locator("[data-home-of] .cat").nth(idx).click();
    await expect(page).toHaveURL(/\/$/);
    const sheet = page.locator(`#kat-${cat.slug}`);
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator("h2")).toHaveText(cat.title);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  // CTA sekcji to duplikat per-breakpoint: mobile prowadzi na listę
  // kategorii (komplet 6 — karuzela pokazuje 3), desktop na /oferta/
  // (komplet siedzi w zakładkach). Widoczny zawsze jeden egzemplarz.
  test("CTA sekcji prowadzi tam, gdzie na tym progu jest pełna oferta", async ({
    page,
    isMobile,
  }) => {
    await gotoReady(page);
    await revealOferta(page);
    const cta = page.locator("[data-home-of] .of-cta a:visible");
    await expect(cta).toHaveCount(1);
    const target = isMobile ? KATEGORIE_PATH : OFERTA_PATH;
    await expect(cta).toHaveAttribute("href", target);
    await cta.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator("main h1")).toBeVisible();
  });
});

// ── kontrakt progu (R14) ──
// Poniżej progu kategorie żyją jako karuzela `.of-rail`, powyżej — jako
// zakładki ARIA `.of-tabs` z panelami. Przełącza to wyłącznie @media,
// więc próg musi zgadzać się ze stałą OFERTA_DESKTOP_MIN_PX.
test("próg desktopowy: zakładki zastępują karuzelę dokładnie na OFERTA_DESKTOP_MIN_PX", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "kontrakt progu — jeden profil desktop wystarczy (test sam zmienia szerokość)",
  );
  await gotoReady(page, OFERTA_PATH);
  await expectBreakpointFlip(
    page,
    OFERTA_DESKTOP_MIN_PX,
    { zakladki: ".of-tabs", karuzela: ".of-rail" },
    { zakladki: "none", karuzela: "flex" },
    { zakladki: "flex", karuzela: "none" },
  );
});
