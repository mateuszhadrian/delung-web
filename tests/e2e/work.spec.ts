// Sekcja Realizacje NA STRONIE GŁÓWNEJ (zajawka .re z części 4.2,
// docs/analiza-strona-glowna.md D-SG6): max 3 wpisy z Content Collections,
// kafle otwierają detal w JEDNYM overlayu #work-detail (część 4.4 —
// modal ≥1024 / bottom sheet <1024 w CSS, open-detail.ts). Pełne pokrycie
// detalu (galeria, projnav, wideo) biega w work-index.spec.ts.
import { expect, test } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { HOME_MAX, realizacjeFiles } from "../helpers/realizacje";
import { gotoReady, scrollPageTo } from "../helpers/scroll";

const ENTRY_COUNT = realizacjeFiles().length;

// Strona główna kapuje listę do 3 (pełna lista: /realizacje/).
const HOME_COUNT = Math.min(HOME_MAX, ENTRY_COUNT);

usePreviewGuard();

// Panel pozwala usunąć wszystkie realizacje i strona to przeżywa (pusta scena),
// więc brak wpisów NIE jest awarią kodu — sygnałem jest kontrakt CMS
// w tests/unit/cms-contract.test.ts, a nie wywrotka całego zestawu e2e.
test.skip(
  ENTRY_COUNT === 0,
  "brak realizacji w kolekcji — zajawka nie ma czego pokazać",
);

test("zajawka pokazuje max 3 realizacje", async ({ page }) => {
  await gotoReady(page);
  await expect(page.locator("[data-recards] [data-work-slug]")).toHaveCount(
    HOME_COUNT,
  );
});

test.describe("desktop: modal ze sceny przypiętej", () => {
  test.skip(({ isMobile }) => !!isMobile, "układ modala tylko na desktop");

  test("klik w stos otwiera detal bieżącej realizacji, × i Escape zamykają", async ({
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
    const detail = page.locator("#work-detail");

    await card.click();
    await expect(detail).toBeVisible();
    await expect(detail).toHaveClass(/is-open/);
    await expect(detail.locator(".dt-title")).toHaveText(name ?? "");
    // kontekst zajawki = 3 wpisy (licznik detalu, D-R5)
    await expect(detail.locator("[data-projcount]")).toHaveText(
      `REALIZACJA 01 / ${String(HOME_COUNT).padStart(2, "0")}`,
    );

    // X w dt-head (desktop; drugi [data-overlay-close] to X sheeta mobile)
    await detail.locator(".dt-x").click();
    await expect(detail).toBeHidden();
    // Host czyszczony po zamknięciu (zwalnia obrazy/DOM).
    await expect(detail.locator(".dt-title")).toHaveCount(0);

    await card.click();
    await expect(detail).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(detail).toBeHidden();
  });
});

test.describe("mobile: bottom sheet z karty zajawki", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("tap w kartę otwiera sheet; X zamyka", async ({ page }) => {
    await gotoReady(page);
    // Dociera do karty i uspokaja scroll przed tapnięciem.
    const card = page.locator("[data-recards] [data-work-slug]").first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const detail = page.locator("#work-detail");

    await card.click();
    await expect(detail).toBeVisible();
    await expect(detail).toHaveClass(/is-open/);
    await expect(detail.locator(".dt-title")).toHaveText(
      (await card.getAttribute("data-work-name")) ?? "",
    );

    // X sheeta (jak karty kategorii 4.3 — korekta Mateusza po testach)
    await detail.locator(".dt-xm").click();
    await expect(detail).toBeHidden();
    await expect(detail.locator(".dt-title")).toHaveCount(0);
  });
});
