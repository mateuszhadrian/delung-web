// Podstrona „Kontakt" (/kontakt/): sekcja Contact z formularzem, scroll
// NATYWNY (smoothScroll={false}, jak /realizacje/), chrome globalny 4.1
// (sticky pasek + stopka ft). Mechanikę formularza (walidacja, pułapki,
// reveal, mock endpointu) testuje contact.spec.ts. PL-only (delung);
// pełna adaptacja speców do widoków delung — Etap 3/4 instrukcji.
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { OFERTA_PATH } from "../../src/lib/routes";
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

    test(`pełna sekcja: formularz, reveal danych, footer w chrome strony`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      const section = page.locator("#contact");
      await expect(section.locator(".kt-form")).toBeAttached();
      await expect(section.locator(".kt-rev")).toHaveCount(2);
      await expect(section.locator(".kt-chip")).toHaveCount(4);
      // Footer wyszedł z sekcji do chrome'u strony (D4 analizy).
      await expect(section.locator(".ft")).toHaveCount(0);
      await expect(page.locator(".ktp-foot .ft")).toBeAttached();
    });

    test(`desktop: scroll natywny (bez Lenisa — jak /realizacje/)`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("body")).toHaveAttribute(
        "data-smooth-scroll",
        "off",
      );
      // Chwila na ewentualny (błędny) dynamiczny import — potem asercja.
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => Boolean(window.__lenis))).toBe(false);
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
        page.locator(
          `.ktp-foot .ft-nav a[href="${ui[p.lang]["contact.policyHref"]}"]`,
        ),
      ).toBeAttached();
      await expect(page.locator(".ktp-foot .ft-soc a").first()).toBeAttached();
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
