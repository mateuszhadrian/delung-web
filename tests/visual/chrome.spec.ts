// Chrome globalny (część 4.1) — regres wizualny elementów wspólnych:
// pasek `hdr` (desktop, wariant plain) i otwarty bottom sheet menu
// (mobile). Zrzuty robione na stronie głównej — chrome jest wspólny dla
// całego serwisu, więc jeden widok wystarczy jako regres.
// Determinizm: freeze.css (prepareSweep) zeruje przejścia, więc sheet
// otwiera się od razu w stanie końcowym (stagger linków bez animacji).
import { expect, test } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

usePreviewGuard();

test("chrome: pasek desktop (plain) vs baseline", async ({
  page,
  isMobile,
}) => {
  test.skip(!!isMobile, "pasek desktop — profile desktop");
  await prepareSweep(page, "/realizacje/");
  await expect(page.locator("[data-nav]")).toHaveScreenshot("chrome-bar.png");
});

test("chrome: otwarty bottom sheet menu vs baseline", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "bottom sheet — profile mobile");
  await prepareSweep(page, "/");
  await page.locator("[data-burger]").click();
  await expect(page.locator("#nav-sheet")).toHaveClass(/is-open/);
  await settle(page);
  await expect(page).toHaveScreenshot("chrome-sheet.png");
});
