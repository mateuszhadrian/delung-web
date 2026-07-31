// Polityka prywatności — meta, komplet sekcji RODO, linki strona główna
// ↔ polityka, e-mail administratora składany w JS (antyscraping — patrz
// test dist w contact.spec.ts) i strzałka „wstecz" (a[data-back] →
// history.back() przywraca pozycję scrolla strony głównej). Treść jest
// niezależna od profilu — jak seo.spec.ts biega tylko na chromium-1920.
// PL-only (delung).
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { useChromium1920Only } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

const SITE = "https://delung.pl";

useChromium1920Only(
  "treść/meta polityki są niezależne od profilu — jeden projekt wystarczy",
);

const PAGES = [
  {
    path: "/polityka-prywatnosci/",
    lang: "pl",
    title: "Polityka prywatności — Delung Meble",
    backHref: "/",
    contactHref: "/kontakt/",
    nip: "NIP: 7312021984",
  },
] as const;

for (const p of PAGES) {
  test(`${p.path}: lang, tytuł, canonical, komplet sekcji`, async ({
    page,
  }) => {
    await gotoReady(page, p.path);
    await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
    await expect(page).toHaveTitle(p.title);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}${p.path}`,
    );
    // 9 punktów zakresu RODO (§7 analizy) — strażnik przed przypadkowym
    // wycięciem sekcji przy edycji treści.
    await expect(page.locator(".pp-sec")).toHaveCount(9);
    // dane administratora (dokument prawny musi identyfikować podmiot)
    await expect(page.locator(".pp-sec").first()).toContainText(p.nip);
  });

  test(`${p.path}: nawigacja — wstecz, przełącznik języka, formularz`, async ({
    page,
  }) => {
    await gotoReady(page, p.path);
    // BackButton wzorca podstron: fallback na stronę główną, mechanizm
    // data-back → history.back() (globalny initBackLinks w BaseLayout).
    await expect(page.locator("a[data-back]")).toHaveAttribute(
      "href",
      p.backHref,
    );
    // Link do formularza kontaktowego w treści (§01) prowadzi na podstronę
    // kontaktu (migracja: docs/analiza-podstrona-kontakt.md).
    await expect(
      page.locator(`.pp-sec a[href="${p.contactHref}"]`).first(),
    ).toBeAttached();
    // Stopka: współdzielony Footer w kontenerze .pp-foot (ten sam co na
    // pozostałych podstronach).
    await expect(page.locator(".pp-foot .ft-soc a").first()).toBeAttached();
  });

  test(`${p.path}: e-mail administratora złożony w JS (mailto)`, async ({
    page,
  }) => {
    await gotoReady(page, p.path);
    // Pełny adres NIE występuje w HTML (kontrakt antyscrapingowy w
    // contact.spec.ts) — skrypt strony składa go z fragmentów po załadowaniu.
    const mail = page.locator('.pp-sec a[href^="mailto:"]');
    await expect(mail).toHaveAttribute("href", "mailto:kontakt@delung.pl");
    await expect(mail).toHaveText("kontakt@delung.pl");
  });
}

test("linki polityki celują w podstrony: stopka głównej + nota na /kontakt/", async ({
  page,
}) => {
  // Nota RODO (.kt-note) żyje przy formularzu na /kontakt/;
  // na głównej został footer.
  const href = ui.pl["contact.policyHref"];
  await gotoReady(page, "/");
  await expect(page.locator(`.ft-leg a[href="${href}"]`)).toBeAttached();
  await gotoReady(page, "/kontakt/");
  await expect(page.locator(`.kt-note a[href="${href}"]`)).toBeAttached();
  await expect(page.locator(`.ft-leg a[href="${href}"]`)).toBeAttached();
});

test("strzałka „wstecz” wraca na stronę główną w zapamiętane miejsce", async ({
  page,
}) => {
  await gotoReady(page, "/");
  const link = page.locator('.ft-leg a[href="/polityka-prywatnosci/"]');
  // Doscrollowanie PRZED odczytem pozycji: klik i tak scrolluje link do
  // viewportu, a mierzyć chcemy dokładnie pozycję, z której wychodzimy.
  await link.scrollIntoViewIfNeeded();
  const left = await page.evaluate(() => window.scrollY);
  await link.click();
  await expect(page).toHaveURL(/\/polityka-prywatnosci\/?$/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0); // polityka od góry

  await page.locator("a[data-back]").click();
  await expect(page).toHaveURL(/\/$/);
  // history.back() → natywne scroll restoration przywraca pozycję sprzed
  // przejścia. Poll: przywrócenie bywa asynchroniczne. Na szkielecie główna
  // mieści się w viewporcie (left ≈ 0) — asercja porównuje z zapamiętaną
  // pozycją, więc zaostrzy się sama, gdy strona główna urośnie w Etapie 4.
  await expect
    .poll(
      async () => Math.abs((await page.evaluate(() => window.scrollY)) - left),
      { timeout: 5000 },
    )
    .toBeLessThanOrEqual(2);
});
