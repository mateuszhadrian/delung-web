// Podstrona „Kontakt" (/kontakt/) po porcie na design delung (Etap 5):
// hero + kafle kontaktowe + formularz + social, scroll NATYWNY
// (smoothScroll={false} — D-K9), chrome globalny 4.1 (sticky pasek
// w wariancie `over` + stopka ft). Mechanikę formularza (walidacja,
// pułapki, sloty, mock endpointu) testuje contact.spec.ts.
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { OFERTA_PATH, POLICY_PATH } from "../../src/lib/routes";
import {
  collectPageIssues,
  useChromium1920Only,
  usePreviewGuard,
} from "../helpers/guards";
import { gotoReady, scrollPageTo } from "../helpers/scroll";

const SITE = "https://delung.pl";

const PAGES = [{ path: "/kontakt/", lang: "pl", homePath: "/" }] as const;

usePreviewGuard();

for (const p of PAGES) {
  test.describe(`${p.path}: meta i treść (jeden profil)`, () => {
    useChromium1920Only(
      "meta/treść niezależne od profilu — jeden projekt wystarczy",
    );

    test(`lang, tytuł, description, canonical`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      await expect(page).toHaveTitle(ui[p.lang]["contactPage.title"]);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", ui[p.lang]["contactPage.description"]);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${p.path}`,
      );
    });

    test(`komplet widoku: hero, 4 kafle, formularz, social, stopka`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Jedyny h1 strony (kontrakt smoke) siedzi w hero.
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator(".kt-cards .kt-card")).toHaveCount(4);
      const section = page.locator("#contact");
      await expect(section.locator(".kt-form")).toBeAttached();
      // Pola wg designu: imię, telefon, e-mail, wiadomość (bez chipsów).
      await expect(section.locator(".kt-field")).toHaveCount(4);
      // Pigułka social renderowana per breakpoint — widoczny JEDEN egzemplarz.
      await expect(page.locator(".kt-soc a:visible")).toHaveCount(1);
      // Stopka = chrome strony (Footer.astro), nie sekcja.
      await expect(section.locator(".ft")).toHaveCount(0);
      await expect(page.locator("footer.ft")).toBeAttached();
    });

    test(`desktop: scroll natywny`, async ({ page }) => {
      // Dotąd ta trasa była wyjątkiem (D-K9: formularz lepiej czuje się bez
      // pośrednika); od D-Q1 to reguła całego serwisu — Lenis wyszedł
      // z projektu, więc nie ma już atrybutu przełączającego tryb scrolla.
      await gotoReady(page, p.path);
      await expect(page.locator("body")).not.toHaveAttribute(
        "data-smooth-scroll",
        /.*/,
      );
      // Chwila na ewentualny (błędny) dynamiczny import — potem asercja.
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => "__lenis" in window)).toBe(false);
    });

    test(`navbar podstrony: Oferta → podstrona, Kontakt = bieżąca`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Pozycja „Oferta" prowadzi na /oferta/.
      await expect(
        page.locator(`.nav-link[href="${OFERTA_PATH}"]`),
      ).toBeAttached();
      // Link Kontakt wskazuje bieżącą podstronę (aria-current).
      const self = page.locator(`.nav-link[href="${p.path}"]`);
      await expect(self).toBeAttached();
      await expect(self).toHaveAttribute("aria-current", "page");
      // Stopka: współdzielony Footer (chrome globalny 4.1).
      await expect(
        page.locator(`footer.ft .ft-nav a[href="${POLICY_PATH}"]`),
      ).toBeAttached();
      await expect(page.locator("footer.ft .ft-soc a").first()).toBeAttached();
    });

    test(`sticky pasek z logo — widoczny u góry także po scrollu`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Chrome 4.1: logo ZAWSZE w pasku (design), BackButton poza chrome
      // (D-CH8 w docs/analiza-chrome-globalny.md), pasek sticky bez
      // chowania przy scrollu.
      const logo = page.locator(".hdr-logo");
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute("href", p.homePath);
      // Po zjeździe na sam dół (ile go jest) pasek zostaje u góry viewportu.
      await scrollPageTo(page, 10_000);
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

test.describe("banner na stronie głównej", () => {
  // Banner CTA kontaktu (sekcja .ko z części 4.2, docs/analiza-strona-glowna.md
  // D-SG8): kotwica #contact, CTA → /kontakt/ (desktop), wiersze/pigułki
  // tel/mail składane w JS (antyscraping D-CH5 — surowy dist pilnuje osobno
  // grep w contact.spec.ts).
  for (const p of PAGES) {
    test(`${p.homePath}: kotwica #contact — banner bez formularza, CTA → ${p.path}`, async ({
      page,
    }) => {
      await gotoReady(page, p.homePath);
      const banner = page.locator("#contact");
      // Kotwica #contact zostaje (stare linki /#contact), ale sekcja to
      // tylko banner — formularz żyje na podstronie.
      await expect(banner).toBeAttached();
      await expect(banner.locator(".kt-form")).toHaveCount(0);
      // CTA (widoczne na desktopie; mobile ma wiersze tel/mail) prowadzi
      // na podstronę kontaktu.
      await expect(banner.locator(".ko-main a")).toHaveAttribute(
        "href",
        p.path,
      );
      // Pozycja navbara „Kontakt" prowadzi wprost na podstronę.
      await expect(
        page.locator(`[data-nav] a[href="${p.path}"]`).first(),
      ).toBeAttached();
    });

    test(`${p.homePath}: tel/mail bannera składane w JS (sloty D-CH5)`, async ({
      page,
    }) => {
      await gotoReady(page, p.homePath);
      const tel = page.locator("#contact a[data-tel]");
      const mail = page.locator("#contact a[data-mail]");
      // Wariant slotu wewnętrznego fillContactSlots: href na kotwicy,
      // tekst w [data-slot] (ikona i etykieta wiersza zostają).
      await expect(tel).toHaveAttribute("href", /^tel:\+48/);
      await expect(tel.locator("[data-slot]")).toContainText("690");
      await expect(mail).toHaveAttribute("href", /^mailto:/);
      await expect(mail.locator("[data-slot]")).toContainText("@delung.pl");
    });
  }

  test("desktop: klik w CTA bannera nawiguje na podstronę", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "CTA bannera widoczne tylko na desktopie");
    await gotoReady(page);
    const btn = page.locator("#contact .ko-main a");
    await btn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await btn.click();
    await expect(page).toHaveURL(/\/kontakt\/?$/);
    await expect(page.locator("#contact .kt-form")).toBeAttached();
  });

  test("stary link /#contact ląduje na bannerze (kotwica działa)", async ({
    page,
  }) => {
    await gotoReady(page, "/#contact");
    await expect(page.locator("#contact h2")).toBeVisible();
  });
});
