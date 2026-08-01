// Nawigacja chrome'u (część 4.1): linki paska (desktop), sticky pasek,
// menu mobilne jako bottom sheet na overlay.ts (otwieranie, Esc, scrim,
// swipe-down), „Proces współpracy" w stopce (poza navbarem — D-CH4
// w docs/analiza-chrome-globalny.md).
import { expect, test } from "@playwright/test";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

test.describe("nawigacja desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("link Oferta nawiguje na podstronę /oferta/", async ({ page }) => {
    await gotoReady(page);
    // Asercja treści celowo ogólna (main h1): przeżyje wymianę szkieletu
    // na docelowy widok w Etapie 4.
    await page.locator('.nav-link[href="/oferta/"]').click();
    await expect(page).toHaveURL(/\/oferta\/?$/);
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("link Realizacje nawiguje na podstronę /realizacje/", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator('.nav-link[href="/realizacje/"]').click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator(".re-grid")).toBeVisible();
  });

  test("pasek jest sticky — widoczny u góry także po scrollu na dno", async ({
    page,
  }) => {
    // Na /realizacje/ (długa podstrona) — szkielet głównej mieści się
    // w jednym viewporcie. Design delung NIE chowa paska przy scrollu
    // (koniec data-hidden z szablonu) — pasek klei się do górnej krawędzi.
    await gotoReady(page, "/realizacje/");
    const nav = page.locator("[data-nav]");
    const maxScroll = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(maxScroll).toBeGreaterThan(200); // strażnik: jest czym scrollować
    await scrollPageTo(page, maxScroll);
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBe(0);
  });

  test("pill telefoniczny złożony w JS (antyscraping)", async ({ page }) => {
    await gotoReady(page);
    const tel = page.locator(".hdr-tel");
    await expect(tel).toBeVisible();
    await expect(tel).toHaveAttribute("href", "tel:+48690291143");
  });
});

test.describe("nawigacja mobile (bottom sheet)", () => {
  test.skip(({ isMobile }) => !isMobile, "tylko układ mobile");

  test("burger otwiera sheet, Escape zamyka i oddaje fokus", async ({
    page,
  }) => {
    await gotoReady(page);
    const root = page.locator("[data-nav]");
    const burger = page.locator("[data-burger]");
    const sheet = page.locator("#nav-sheet");

    await burger.click();
    await expect(root).toHaveAttribute("data-open", "");
    await expect(burger).toHaveAttribute("aria-expanded", "true");
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator(".m-link").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(root).not.toHaveAttribute("data-open", "");
    await expect(burger).toHaveAttribute("aria-expanded", "false");
    // Fokus wraca do elementu sprzed otwarcia (overlay.ts, lastFocused) —
    // bez twardej asercji: WebKit nie fokusuje buttonów po kliku myszą.
  });

  test("klik w scrim (nad panelem) zamyka sheet", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    const sheet = page.locator("#nav-sheet");
    await expect(sheet).toHaveClass(/is-open/);
    // Punkt przy górnej krawędzi = tło nakładki, poza [data-overlay-panel].
    await sheet.click({ position: { x: 10, y: 10 } });
    await expect(sheet).toBeHidden();
    await expect(page.locator("[data-nav]")).not.toHaveAttribute(
      "data-open",
      "",
    );
  });

  test("swipe-down za uchwyt zamyka sheet (gest overlay.ts)", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    const sheet = page.locator("#nav-sheet");
    await expect(sheet).toHaveClass(/is-open/);
    // Odczekaj wjazd panelu (transform .42s): boundingBox mierzony w trakcie
    // animacji celowałby tam, gdzie uchwyt dopiero BĘDZIE — pointerdown
    // trafiałby w nav sheeta i gest w ogóle by się nie zaczynał.
    await page.waitForTimeout(600);

    // Gest pointerowy: overlay.ts słucha pointer events, więc przeciągnięcie
    // myszą odpala tę samą ścieżkę co palec (drag > DRAG_CLOSE_PX zamyka).
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
    await expect(page.locator("[data-nav]")).not.toHaveAttribute(
      "data-open",
      "",
    );
    await expect(page.locator("[data-burger]")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("pozycja Oferta w sheecie nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    // Asercja treści ogólna (main h1), odporna na wymianę szkieletu.
    await page.locator('.m-link[href="/oferta/"]').click();
    await expect(page).toHaveURL(/\/oferta\/?$/);
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("pozycja Realizacje w sheecie nawiguje na podstronę", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    await page.locator('.m-link[href="/realizacje/"]').click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator(".re-grid")).toBeVisible();
  });

  test("pozycja Kontakt w sheecie nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    await page.locator('.m-link[href="/kontakt/"]').click();
    await expect(page).toHaveURL(/\/kontakt\/?$/);
    await expect(page.locator("#contact .kt-form")).toBeVisible();
  });

  test("sheet ma sekcję zadzwoń z numerem złożonym w JS", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    const call = page.locator("#nav-sheet .sheet-call a");
    await expect(call).toBeVisible();
    await expect(call).toHaveAttribute("href", "tel:+48690291143");
  });
});

// „Proces współpracy" żyje POZA navbarem (jak w designach — 4 pozycje);
// do czasu CTA sekcji (4.2/4.3) trasę linkuje stopka (D-CH4).
test("link Proces współpracy w stopce nawiguje na podstronę", async ({
  page,
}) => {
  await gotoReady(page);
  const link = page.locator('.ft-nav a[href="/proces-wspolpracy/"]');
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(/\/proces-wspolpracy\/?$/);
  await expect(page.locator("main h1")).toBeVisible();
});

test("logo w pasku prowadzi na stronę główną z podstrony", async ({ page }) => {
  await gotoReady(page, "/oferta/");
  await page.locator(".hdr-logo").click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("strona główna ładuje się bez błędów konsoli i 404", async ({ page }) => {
  const issues = collectPageIssues(page);
  await gotoReady(page);
  await settle(page);
  expect(issues()).toEqual([]);
});
