// Widok /proces-wspolpracy/ (część 4.5): mobile — 4 kroki ze zdjęciami
// + sticky chip licznika; desktop — sticky kolumna swap zdjęć (clip-path,
// licznik, pasek) + sekcja EFEKT + pełnoekranowe CTA. Tel/mail wyłącznie
// przez antyscraping D-CH5 (sloty + wariant href-only — etykieta
// „Zadzwoń teraz" zostaje). Decyzje: docs/analiza-proces-onas-polityka.md.
import { expect, test } from "@playwright/test";
import { CONTACT_PATH, PROCESS_PATH } from "../../src/lib/routes";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

const STEP_COUNT = 4;

test("strona ładuje się bez błędów konsoli i 404", async ({ page }) => {
  const issues = collectPageIssues(page);
  await gotoReady(page, PROCESS_PATH);
  await settle(page);
  expect(issues()).toEqual([]);
});

test("h1 z designu + 4 kroki z treścią (oba progi)", async ({ page }) => {
  await gotoReady(page, PROCESS_PATH);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main h1")).toHaveText(
    "Od rozmowy do gotowego wnętrza",
  );
  const steps = page.locator(".step");
  await expect(steps).toHaveCount(STEP_COUNT);
  await expect(steps.first().locator("h2")).toHaveText("Rozmowa i pomiar");
  await expect(steps.last().locator("h2")).toHaveText(
    "Czysty montaż „pod klucz”",
  );
});

test.describe("proces mobile (kroki + chip + CTA)", () => {
  test.skip(({ isMobile }) => !isMobile, "tylko układ mobile");

  test("zdjęcia kroków widoczne, kolumna swap i EFEKT nieobecne", async ({
    page,
  }) => {
    await gotoReady(page, PROCESS_PATH);
    await expect(page.locator(".step-photo img").first()).toBeVisible();
    await expect(page.locator(".steps-media")).toBeHidden();
    await expect(page.locator(".efekt")).toBeHidden();
  });

  test("sticky chip licznika rośnie przy scrollu do ostatniego kroku", async ({
    page,
  }) => {
    await gotoReady(page, PROCESS_PATH);
    const chip = page.locator("[data-count]");
    await expect(chip).toHaveText("01");
    // pozycja na stronie przez rect (offsetTop liczy od .steps —
    // position:relative), tak żeby top kroku wszedł pod próg 0.55·H
    const lastTop = await page
      .locator(".step")
      .last()
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await scrollPageTo(page, lastTop);
    await expect(chip).toHaveText("04");
  });

  test("CTA: „Zadzwoń teraz” dostaje tel-href (etykieta zostaje), „Napisz wiadomość” → kontakt", async ({
    page,
  }) => {
    await gotoReady(page, PROCESS_PATH);
    const call = page.locator(".cta-dark");
    // wariant href-only antyscrapingu: href złożony w JS, etykieta designu
    await expect(call).toHaveAttribute("href", "tel:+48690291143");
    await expect(call).toHaveText("Zadzwoń teraz");
    await expect(page.locator(".cta-out")).toHaveAttribute(
      "href",
      CONTACT_PATH,
    );
    // desktopowe rzędy przycisków nie istnieją w układzie mobile
    await expect(page.locator(".cta-primary")).toBeHidden();
  });
});

test.describe("proces desktop (hero + swap + EFEKT + CTA)", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("hero ze zdjęciem, kolumna swap widoczna, chip i zdjęcia kroków ukryte", async ({
    page,
  }) => {
    await gotoReady(page, PROCESS_PATH);
    await expect(page.locator(".hero-pic img")).toBeVisible();
    await expect(page.locator(".steps-stick")).toBeVisible();
    await expect(page.locator(".steps-chip")).toBeHidden();
    await expect(page.locator(".step-photo").first()).toBeHidden();
    // navbar wariant over w tonie ciemnym (D-P2)
    await expect(page.locator("header.hdr")).toHaveClass(/dark/);
  });

  test("swap kolumny: licznik i clip-path podążają za aktywnym krokiem", async ({
    page,
  }) => {
    await gotoReady(page, PROCESS_PATH);
    const cnt = page.locator("[data-swapcount]");
    await expect(cnt).toHaveText("01");
    const thirdTop = await page
      .locator('.step[data-step="3"]')
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await scrollPageTo(page, thirdTop);
    await expect(cnt).toHaveText("03");
    // trzeci kadr odsłonięty, czwarty wciąż zakryty (getComputedStyle
    // normalizuje skróty inset() — porównujemy znormalizowane wartości)
    await expect(page.locator(".swapimg").nth(2)).toHaveCSS(
      "clip-path",
      "inset(0%)",
    );
    await expect(page.locator(".swapimg").nth(3)).toHaveCSS(
      "clip-path",
      "inset(0% 0% 100%)",
    );
  });

  test("EFEKT: nagłówek i 4 punkty listy", async ({ page }) => {
    await gotoReady(page, PROCESS_PATH);
    await expect(page.locator(".efekt h2")).toBeVisible();
    await expect(page.locator(".efekt li")).toHaveCount(4);
  });

  test("CTA: primary → kontakt, pigułki tel/mail złożone w JS", async ({
    page,
  }) => {
    await gotoReady(page, PROCESS_PATH);
    await expect(page.locator(".cta-primary")).toHaveAttribute(
      "href",
      CONTACT_PATH,
    );
    const tel = page.locator(".cta-white");
    await expect(tel).toHaveAttribute("href", "tel:+48690291143");
    await expect(tel).toContainText("+48 690 291 143");
    const mail = page.locator(".cta-ghost");
    await expect(mail).toHaveAttribute("href", "mailto:kontakt@delung.pl");
    await expect(mail).toHaveText("kontakt@delung.pl");
    // mobilne przyciski nie istnieją w układzie desktop
    await expect(page.locator(".cta-dark")).toBeHidden();
  });
});

// Zajawka procesu na stronie głównej ma CTA na OBU progach (D-P5 —
// korekta D-SG5: desktop dostał przycisk, którego eksport nie miał).
test("dojście ze strony głównej: CTA zajawki procesu nawiguje na widok", async ({
  page,
}) => {
  await gotoReady(page);
  const cta = page.locator(".pr-cta a");
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", PROCESS_PATH);
  await cta.scrollIntoViewIfNeeded();
  await settle(page, 300);
  await cta.click();
  await expect(page).toHaveURL(new RegExp(`${PROCESS_PATH}?$`));
  await expect(page.locator("main h1")).toBeVisible();
});

test("antyscraping: surowy HTML strony bez numeru i adresu (kontrakt D-CH5)", async ({
  page,
}) => {
  // Duch kontraktu z contact.spec.ts (grep dist) — szybka asercja per-widok
  // na SUROWYM HTML z sieci (DOM po JS celowo zawiera pełne ciągi).
  const res = await page.request.get(PROCESS_PATH);
  const html = await res.text();
  expect(html).not.toContain("690291143");
  expect(html).not.toContain("690 291 143");
  expect(html).not.toContain("kontakt@delung.pl");
});
