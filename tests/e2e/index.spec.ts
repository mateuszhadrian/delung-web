// Strona główna — kontrakty, których nie pilnują specy per sekcja.
// Na razie: zakotwiczenie hero mobile w wysokości viewportu (D-Q2,
// docs/analiza-poprawki-2.md).
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady, settle } from "../helpers/scroll";

usePreviewGuard();

const PATH = "/";

/** Geometria hero: wysokość sekcji + położenie i wymiar zdjęcia WZGLĘDEM
 *  sekcji. Sam rozmiar sekcji nie wystarcza — objaw zgłoszony przez
 *  Mateusza to przesunięcie KADRU (`object-fit: cover` przy zmienionej
 *  wysokości boksu pokazuje inny wycinek), więc mierzymy relację. */
async function heroGeometry(page: Page) {
  return page.evaluate(() => {
    const hero = document.querySelector(".hero")!.getBoundingClientRect();
    const img = document.querySelector(".hero-img")!.getBoundingClientRect();
    return {
      h: Math.round(hero.height),
      imgTop: Math.round(img.top - hero.top),
      imgH: Math.round(img.height),
    };
  });
}

test.describe("hero mobile: zakotwiczenie w wysokości viewportu (D-Q2)", () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    "hero mobile istnieje tylko poniżej progu desktop",
  );

  test("chowany pasek przeglądarki (zmiana samej wysokości) nie rusza kadru", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await settle(page, 200);
    const before = await heroGeometry(page);

    // Dokładnie to, co robi chowający się pasek URL: wysokość viewportu
    // rośnie, szerokość zostaje. W przeglądarkach iOS zmieniających rozmiar
    // webview (DuckDuckGo, Firefox, Opera, Edge) przeliczało to `100svh`,
    // a `cover` pokazywał inny wycinek zdjęcia — napisy „przeskakiwały".
    const vp = page.viewportSize()!;
    await page.setViewportSize({ width: vp.width, height: vp.height + 90 });
    await settle(page, 200);
    const grown = await heroGeometry(page);

    expect(grown.h).toBe(before.h);
    expect(grown.imgTop).toBe(before.imgTop);
    expect(grown.imgH).toBe(before.imgH);

    // …i w drugą stronę (pasek wraca przy scrollu w górę)
    await page.setViewportSize({ width: vp.width, height: vp.height - 60 });
    await settle(page, 200);
    const shrunk = await heroGeometry(page);

    expect(shrunk.h).toBe(before.h);
    expect(shrunk.imgTop).toBe(before.imgTop);
    expect(shrunk.imgH).toBe(before.imgH);
  });

  const pin = (page: Page) =>
    page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--hero-h"),
    );

  test("bez drgania viewportu hero NIE jest przypięte (zero zmian w renderowaniu)", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await settle(page, 300);
    // Kontrakt kluczowy dla baseline'ów: dopóki svh się nie rusza, wysokość
    // liczy formuła CSS i JS nie wpisuje NICZEGO. Wpisana z JS wartość nigdy
    // nie jest bit w bit tym samym, co wyliczyła przeglądarka — profilaktyczne
    // przypinanie zmieniało rasteryzację o ułamek piksela (D-Q2).
    expect(await pin(page)).toBe("");
  });

  test("obrót ekranu (zmiana szerokości) zwalnia przypięcie i mierzy od nowa", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await settle(page, 200);
    const before = await heroGeometry(page);

    // Najpierw wymuś przypięcie (drgnięcie samej wysokości)…
    const vp = page.viewportSize()!;
    await page.setViewportSize({ width: vp.width, height: vp.height + 90 });
    await settle(page, 200);
    expect(await pin(page)).not.toBe("");

    // …a potem obróć ekran: mechanizm ma być odporny na pasek, ale NIE
    // zamrożony na stałe — przy realnie innym viewporcie wraca do formuły.
    await page.setViewportSize({ width: vp.height, height: vp.width });
    await settle(page, 200);
    const rotated = await heroGeometry(page);

    expect(await pin(page)).toBe("");
    expect(rotated.h).not.toBe(before.h);
  });
});
