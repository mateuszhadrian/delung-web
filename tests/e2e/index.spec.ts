// Strona główna — kontrakty, których nie pilnują specy per sekcja:
// zakotwiczenie hero mobile w wysokości viewportu (D-Q2) i odporność sceny
// realizacji na niskie okno (D-Q5). Decyzje: docs/analiza-poprawki-2.md.
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

test.describe("scena realizacji: niskie okno (D-Q5)", () => {
  test.skip(
    ({ isMobile }) => !!isMobile,
    "scena przypięta istnieje tylko na desktopie",
  );

  /** Najmniejszy odstęp między dolną krawędzią linku „Więcej" (dla KAŻDEGO
   *  z trzech wpisów zajawki — opisy idą z CMS-a i różnią się długością)
   *  a górną krawędzią przycisku „Przeglądaj nasze realizacje", oraz
   *  odstęp między kolumną tekstu a tym przyciskiem. */
  const measure = async (page: Page) => {
    // Przełączanie wpisów ma PRZEJŚCIE transformu (0,55 s) — bez wyłączenia
    // go odczyt tuż po ustawieniu `transform: none` pokazuje jeszcze stare
    // 14 px przesunięcia i daje fałszywą kolizję.
    await page.addStyleTag({
      content: "*{transition:none!important;animation:none!important}",
    });
    return page.evaluate(() => {
      const cta = document.querySelector(".re-cta")!.getBoundingClientRect();
      const col = document.querySelector(".re-in")!.getBoundingClientRect();
      let tresc = Infinity;
      document.querySelectorAll<HTMLElement>("[data-retx]").forEach((tx) => {
        // stan wpisu AKTYWNEGO: przełączanie wpisów daje nieaktywnym
        // przesunięcie w dół, które nie jest widoczne dla użytkownika
        tx.style.opacity = "1";
        tx.style.transform = "none";
        const a = tx
          .querySelector("a[data-work-more]")!
          .getBoundingClientRect();
        tresc = Math.min(tresc, Math.round(cta.top - a.bottom));
      });
      return { kolumna: Math.round(cta.top - col.bottom), tresc };
    });
  };

  // Zgłoszenie Mateusza: przy niskim oknie opis z linkiem „Więcej" chował się
  // POD przyciskiem. Kolizja startowała przy ~730 px wysokości i rosła do
  // −214 px przy 520 px. Ta asercja jest twarda — przycisk ma NIGDY niczego
  // nie zasłaniać, bo dostał własny wiersz siatki (D-Q5).
  for (const h of [1080, 900, 800, 768, 720, 680, 640, 600, 560, 520, 480]) {
    test(`przycisk nie zasłania treści przy wysokości ${h} px`, async ({
      page,
    }) => {
      const w = page.viewportSize()!.width;
      await page.setViewportSize({ width: w, height: h });
      await gotoReady(page, PATH);
      await settle(page, 250);
      const m = await measure(page);
      expect(
        m.kolumna,
        "kolumna tekstu wchodzi na przycisk",
      ).toBeGreaterThanOrEqual(0);
      // pełna widoczność treści — do 600 px włącznie; niżej ogon opisu wolno
      // PRZYCIĄĆ (nigdy zasłonić), co jest świadomą degradacją z D-Q5
      if (h >= 600) {
        expect(m.tresc, "link Więcej ucięty").toBeGreaterThanOrEqual(0);
      }
    });
  }

  test("kolejność kurczenia: najpierw odstęp, potem blok opisu", async ({
    page,
  }) => {
    const w = page.viewportSize()!.width;
    await page.setViewportSize({ width: w, height: 1080 });
    await gotoReady(page, PATH);
    await settle(page, 250);
    const duze = await page.evaluate(() => ({
      gap: document.querySelector(".re-gap")!.getBoundingClientRect().height,
      txts: document.querySelector("[data-retxts]")!.getBoundingClientRect()
        .height,
    }));

    // 560 px: rozpórka ma już oddać sporo pikseli, blok opisu jeszcze
    // praktycznie nie (zmierzone: 1366 → 68/275 przy 1080 px, 39/273 przy 560)
    await page.setViewportSize({ width: w, height: 560 });
    await settle(page, 250);
    const male = await page.evaluate(() => ({
      gap: document.querySelector(".re-gap")!.getBoundingClientRect().height,
      txts: document.querySelector("[data-retxts]")!.getBoundingClientRect()
        .height,
    }));

    // rozpórka oddaje co najmniej jedną trzecią swojej wysokości…
    expect(male.gap, "odstęp nie oddał miejsca").toBeLessThan(duze.gap * 0.7);
    // …a blok opisu w tym czasie prawie nie drgnął (priorytet z D-Q5)
    expect(
      male.txts / duze.txts,
      "blok opisu skurczył się przed odstępem",
    ).toBeGreaterThan(0.98);
  });
});
