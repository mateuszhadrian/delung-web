// Widok /oferta/ (część 4.3): desktop — zakładki kategorii (wzorzec ARIA
// tabs, panel 01 w SSR) + CTA realizacji i procesu; mobile — karuzela
// 3 kafli + „zobacz pełną ofertę" → /kategorie/ z paskiem postępu
// (gotchas karuzel: sections.md). Decyzje: docs/analiza-oferta-kategorie.md.
import { expect, test } from "@playwright/test";
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
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, settle } from "../helpers/scroll";

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
    await expect(cta).toHaveAttribute("href", WORK_INDEX_PATH);
    // Etykieta z categoryLabel() (D-OK6), nie `rel` z eksportu.
    await expect(cta).toContainText("KUCHNIE");
  });

  test("CTA procesu nawiguje na /proces-wspolpracy/", async ({ page }) => {
    await gotoReady(page, OFERTA_PATH);
    const btn = page.locator(".pr-btn");
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(page).toHaveURL(new RegExp(`${PROCESS_PATH}?$`));
    await expect(page.locator("main h1")).toBeVisible();
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

  test("tor spełnia kontrakt karuzeli (lenis-horizontal + snap-stop)", async ({
    page,
  }) => {
    // Gotchas sections.md: data-lenis-prevent-horizontal (NIE -prevent)
    // + scroll-snap-stop: always na kaflach.
    await gotoReady(page, OFERTA_PATH);
    const rail = page.locator("[data-rail]");
    await expect(rail).toHaveAttribute("data-lenis-prevent-horizontal", "");
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

  test("kafel kategorii otwiera jej kartę na /kategorie/ (deep-link)", async ({
    page,
  }) => {
    await gotoReady(page, OFERTA_PATH);
    const slug = OFERTA_CATEGORIES[1].slug; // Szafy i garderoby
    await page.locator(".of-card").nth(1).click();
    await expect(page).toHaveURL(new RegExp(`${KATEGORIE_PATH}#${slug}$`));
    const sheet = page.locator(`#kat-${slug}`);
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator("h2")).toHaveText(OFERTA_CATEGORIES[1].title);
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
