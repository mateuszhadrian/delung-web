// Widok /o-nas/ (część 4.5): mobile — karta hero z certyfikatem, zespół
// (Adam + siatka 2), filary, karuzela 6 opinii; desktop — manifest,
// przypięty tor kart zespołu (postęp scrolla → transform + licznik),
// marquee opinii z duplikatem aria-hidden. Dane opinii wspólne ze stroną
// główną (src/lib/opinie.ts). Decyzje: docs/analiza-proces-onas-polityka.md.
import { expect, test } from "@playwright/test";
import { OPINIE } from "../../src/lib/opinie";
import { ZESPOL } from "../../src/components/sections/o-nas/onas-content";
import { ABOUT_PATH } from "../../src/lib/routes";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

test("strona ładuje się bez błędów konsoli i 404", async ({ page }) => {
  const issues = collectPageIssues(page);
  await gotoReady(page, ABOUT_PATH);
  await settle(page);
  expect(issues()).toEqual([]);
});

test("h1-cytat + 3 filary + link Google (oba progi)", async ({ page }) => {
  await gotoReady(page, ABOUT_PATH);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main h1")).toContainText("U nas nie usłyszysz");
  await expect(page.locator(".pillar")).toHaveCount(3);
  const google = page.locator(".rev-cta a");
  await expect(google).toHaveAttribute("href", /google\.com/);
  await expect(google).toHaveAttribute("rel", "noopener");
});

test.describe("o-nas mobile (karta hero + zespół + karuzela opinii)", () => {
  test.skip(({ isMobile }) => !isMobile, "tylko układ mobile");

  test("karta hero: certyfikat + akapit manifestu; sekcja manifest ukryta", async ({
    page,
  }) => {
    await gotoReady(page, ABOUT_PATH);
    await expect(page.locator(".cert img")).toBeVisible();
    await expect(page.locator(".hero-p--m")).toContainText(
      "bezkompromisowych zasadach",
    );
    await expect(page.locator(".manifest")).toBeHidden();
    await expect(page.locator(".hero-bus")).toBeHidden();
  });

  test("zespół: Adam duży + cytat + dwie karty siatki", async ({ page }) => {
    await gotoReady(page, ABOUT_PATH);
    await expect(page.locator(".tm-lead h3")).toHaveText(ZESPOL[0].name);
    await expect(page.locator(".tm-quote")).toContainText(
      "nie chodzę do pracy",
    );
    await expect(page.locator(".tm-cell")).toHaveCount(ZESPOL.length - 1);
    // desktopowy tor kart nie istnieje w układzie mobile
    await expect(page.locator(".team-hold")).toBeHidden();
  });

  test("karuzela opinii: 6 kart + gotchas toru (sections.md)", async ({
    page,
  }) => {
    await gotoReady(page, ABOUT_PATH);
    const car = page.locator(".rev-car");
    await expect(car.locator(".rc")).toHaveCount(OPINIE.length);
    await expect(car.locator(".rc").first()).toHaveCSS(
      "scroll-snap-stop",
      "always",
    );
    // marquee to gałąź desktop
    await expect(page.locator(".rev-marq").first()).toBeHidden();
  });
});

test.describe("o-nas desktop (manifest + tor zespołu + marquee)", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("manifest i bus widoczne, mobilne gałęzie ukryte, navbar ciemny", async ({
    page,
  }) => {
    await gotoReady(page, ABOUT_PATH);
    await expect(page.locator(".manifest-p")).toBeVisible();
    await expect(page.locator(".hero-bus img")).toBeVisible();
    await expect(page.locator(".hero-p--m")).toBeHidden();
    await expect(page.locator(".team-mob")).toBeHidden();
    await expect(page.locator("header.hdr")).toHaveClass(/dark/);
  });

  test("przypięty tor zespołu: postęp scrolla przesuwa karty i licznik", async ({
    page,
  }) => {
    await gotoReady(page, ABOUT_PATH);
    await expect(page.locator(".tc")).toHaveCount(ZESPOL.length);
    const teamTop = await page
      .locator(".team")
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const teamSpan = await page
      .locator(".team")
      .evaluate((el) => (el as HTMLElement).offsetHeight - window.innerHeight);
    await scrollPageTo(page, teamTop);
    await expect(page.locator("[data-teamcount]")).toHaveText("01");
    const at0 = await page
      .locator("[data-teamtrack]")
      .evaluate((el) => getComputedStyle(el).transform);
    await scrollPageTo(page, teamTop + teamSpan);
    await expect(page.locator("[data-teamcount]")).toHaveText("03");
    const at1 = await page
      .locator("[data-teamtrack]")
      .evaluate((el) => getComputedStyle(el).transform);
    // Zakres przesuwu = scrollWidth − szerokość okna toru; na bardzo
    // szerokich profilach (1920) karty mieszczą się w całości i tor stoi
    // (identyczna matematyka w eksporcie) — wtedy transform zostaje w 0.
    const max = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>("[data-teamtrack]")!;
      const hold = document.querySelector<HTMLElement>(".team-hold")!;
      return Math.max(0, track.scrollWidth - hold.clientWidth);
    });
    if (max > 0) {
      expect(at1).not.toBe(at0);
    } else {
      expect(at1).toBe(at0);
    }
  });

  test("marquee opinii: 2 tory, duplikat pętli aria-hidden", async ({
    page,
  }) => {
    await gotoReady(page, ABOUT_PATH);
    await expect(page.locator(".rev-marq")).toHaveCount(2);
    const first = page.locator(".rev-marq").first();
    await expect(first.locator(".rev-set")).toHaveCount(2);
    await expect(first.locator(".rev-set").nth(1)).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(page.locator(".rev-car")).toBeHidden();
  });
});
