// Polityka prywatności — meta, komplet sekcji RODO, linki strona główna
// ↔ polityka, e-mail administratora składany w JS (antyscraping — patrz
// test dist w contact.spec.ts; od 4.5 przez wspólne sloty
// lib/contact-details). Layout pp-* designu (część 4.5): desktopowy
// sticky TOC z kotwicami #pp-NN + pasek CTA z pigułką telefonu. Chrome
// globalny 4.1: logo w pasku zamiast BackButtona (D-CH8 — mechanizm
// data-back uśpiony w BaseLayout). Treść jest niezależna od profilu —
// jak seo.spec.ts biega tylko na chromium-1920. PL-only (delung).
import { expect, test } from "@playwright/test";
import { POLICY_PATH } from "../../src/lib/routes";
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

  test(`${p.path}: nawigacja — logo do głównej, formularz, stopka`, async ({
    page,
  }) => {
    await gotoReady(page, p.path);
    // Chrome 4.1: droga powrotna = logo w pasku (BackButton poza chrome).
    await expect(page.locator(".hdr-logo")).toHaveAttribute("href", p.backHref);
    // Link do formularza kontaktowego w treści (§01) prowadzi na podstronę
    // kontaktu (migracja: docs/analiza-podstrona-kontakt.md).
    await expect(
      page.locator(`.pp-sec a[href="${p.contactHref}"]`).first(),
    ).toBeAttached();
    // Stopka: współdzielony Footer (chrome globalny 4.1).
    await expect(page.locator(".ft-soc a").first()).toBeAttached();
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

test("/polityka-prywatnosci/: TOC przewija do sekcji, CTA z telefonem po JS", async ({
  page,
}) => {
  await gotoReady(page, "/polityka-prywatnosci/");
  // TOC (desktop, chromium-1920): 9 linków-kotwic + „Masz pytanie o dane?"
  const toc = page.locator(".pp-toc-list a");
  await expect(toc).toHaveCount(9);
  await expect(page.locator(".pp-toc-ask")).toHaveAttribute(
    "href",
    "/kontakt/",
  );
  // klik kotwicy przewija do sekcji (scroll-margin-top pod --hdr-h)
  await toc.nth(6).click();
  await expect(page).toHaveURL(/#pp-07$/);
  await expect
    .poll(async () =>
      page
        .locator("#pp-07")
        .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(300);
  // pasek CTA: pigułka telefonu złożona w JS + „Wróć do kontaktu"
  await expect(page.locator(".pp-tel")).toHaveAttribute(
    "href",
    "tel:+48690291143",
  );
  await expect(page.locator(".pp-tel")).toHaveText("+48 690 291 143");
  await expect(page.locator(".pp-back")).toHaveAttribute("href", "/kontakt/");
});

test("linki polityki celują w podstrony: stopka głównej + nota na /kontakt/", async ({
  page,
}) => {
  // Nota RODO (.kt-note) żyje przy formularzu na /kontakt/;
  // link polityki w stopce = .ft-nav (chrome 4.1, widoczny też na mobile).
  const href = POLICY_PATH;
  await gotoReady(page, "/");
  await expect(page.locator(`.ft-nav a[href="${href}"]`)).toBeAttached();
  await gotoReady(page, "/kontakt/");
  await expect(page.locator(`.kt-note a[href="${href}"]`)).toBeAttached();
  await expect(page.locator(`.ft-nav a[href="${href}"]`)).toBeAttached();
});

// Test „strzałka wstecz wraca w zapamiętane miejsce" usunięty razem
// z BackButtonem (D-CH8) — mechanizm a[data-back]/initBackLinks zostaje
// uśpiony w BaseLayout; test wróci, jeśli przycisk wróci po Etapach 0–7.
