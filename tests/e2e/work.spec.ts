// Sekcja Realizacje NA STRONIE GŁÓWNEJ (zajawka .re z części 4.2,
// docs/analiza-strona-glowna.md D-SG6): max 3 wpisy z Content Collections,
// kafle otwierają WorkDetail w Modalu (desktop, scena przypięta) /
// BottomSheet (mobile, karty w kolumnie) przez overlay.ts. Pokrycie
// nakładek na podstronie /realizacje/ biega w work-index.spec.ts.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo } from "../helpers/scroll";

const ENTRY_COUNT = readdirSync(
  fileURLToPath(new URL("../../src/content/realizacje", import.meta.url)),
).filter((f) => f.endsWith(".json")).length;

// Strona główna kapuje listę do 3 (pełna lista: /realizacje/).
const HOME_COUNT = Math.min(3, ENTRY_COUNT);

usePreviewGuard();

test("zajawka pokazuje max 3 realizacje", async ({ page }) => {
  await gotoReady(page);
  await expect(page.locator("[data-recards] [data-work-slug]")).toHaveCount(
    HOME_COUNT,
  );
});

test.describe("desktop: Modal ze sceny przypiętej", () => {
  test.skip(({ isMobile }) => !!isMobile, "modal tylko na desktop");

  test("klik w stos otwiera modal bieżącej realizacji, × i Escape zamykają", async ({
    page,
  }) => {
    await gotoReady(page);
    // Początek sceny przypiętej → wierzchni (klikalny) kafel = pierwsza
    // realizacja; clip-path pozostałych przycina też ich hit-testing.
    const secTop = await page.evaluate(
      () => document.querySelector<HTMLElement>("[data-home-re]")!.offsetTop,
    );
    await scrollPageTo(page, secTop + 10);
    const card = page.locator("[data-recards] [data-work-slug]").first();
    const name = await card.getAttribute("data-work-name");
    const modal = page.locator("#work-modal");

    await card.click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/is-open/);
    await expect(modal.locator(".wdx__title")).toHaveText(name ?? "");

    await modal.locator("[data-overlay-close]").click();
    await expect(modal).toBeHidden();
    // Host czyszczony po zamknięciu (zwalnia obrazy/DOM).
    await expect(modal.locator(".wdx")).toHaveCount(0);

    await card.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });
});

test.describe("mobile: BottomSheet z karty zajawki", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("tap w kartę otwiera sheet; zamykanie przyciskiem", async ({ page }) => {
    await gotoReady(page);
    // Dociera do karty i uspokaja scroll (guard „strona w ruchu" blokuje
    // otwarcie nakładki przez ~110 ms po scrollu).
    const card = page.locator("[data-recards] [data-work-slug]").first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const sheet = page.locator("#work-sheet");

    await card.click();
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator(".wdx__title")).toHaveText(
      (await card.getAttribute("data-work-name")) ?? "",
    );

    await sheet.locator("[data-overlay-close]").click();
    await expect(sheet).toBeHidden();
    await expect(sheet.locator(".wdx")).toHaveCount(0);
  });
});
