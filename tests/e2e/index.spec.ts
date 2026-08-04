// Strona główna — kontrakty, których nie pilnują specy per sekcja:
// zakotwiczenie hero mobile w wysokości viewportu (D-Q2), odporność sceny
// realizacji na niskie okno (D-Q5) i zachowanie linku „Więcej" w tej scenie
// (D-Q6). Decyzje: docs/analiza-poprawki-2.md.
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

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

test.describe("scena realizacji: link „Więcej” (D-Q6)", () => {
  test.skip(
    ({ isMobile }) => !!isMobile,
    "karta opisu z linkiem istnieje tylko w scenie desktopowej",
  );

  /** Przewija scenę tak, żeby aktywny był wpis o podanym indeksie. */
  async function ustawWpis(page: Page, i: number) {
    const y = await page.evaluate((idx) => {
      const sec = document.querySelector<HTMLElement>("[data-home-re]")!;
      const zakres = sec.offsetHeight - window.innerHeight;
      return Math.round(sec.offsetTop + zakres * ((idx + 0.5) / 3));
    }, i);
    await scrollPageTo(page, y);
    await settle(page, 400);
  }

  for (const i of [0, 1, 2]) {
    test(`wpis ${i + 1}: link jest klikalny i otwiera detal TEJ realizacji`, async ({
      page,
    }) => {
      await gotoReady(page, PATH);
      await ustawWpis(page, i);

      const stan = await page.evaluate(() => {
        const karty = [
          ...document.querySelectorAll<HTMLElement>("[data-retx]"),
        ];
        const widoczny = karty.findIndex(
          (t) => getComputedStyle(t).opacity === "1",
        );
        const link =
          karty[widoczny].querySelector<HTMLElement>("a[data-work-more]")!;
        const b = link.getBoundingClientRect();
        // Zgłoszenie D-Q6: karty leżą jedna na drugiej, więc niewidoczna
        // potrafiła przechwytywać kliknięcia. Sprawdzamy, CO naprawdę leży
        // pod kursorem — nie samą widoczność linku.
        const pod = document.elementFromPoint(
          b.left + b.width / 2,
          b.top + b.height / 2,
        );
        return {
          widoczny,
          nazwa: karty[widoczny].dataset.txName ?? "",
          trafiaWLink: !!pod?.closest("a[data-work-more]"),
          kursor: pod ? getComputedStyle(pod).cursor : "",
        };
      });

      expect(stan.widoczny, "scena nie ustawiła oczekiwanego wpisu").toBe(i);
      expect(stan.trafiaWLink, "link zasłonięty innym elementem").toBe(true);
      expect(stan.kursor).toBe("pointer");

      await page
        .locator("[data-retx]")
        .nth(i)
        .locator("a[data-work-more]")
        .click();

      const detal = page.locator("#work-detail");
      await expect(detal).toHaveClass(/is-open/);
      await expect(detal).toContainText(stan.nazwa);
      // …i to detal, a NIE nawigacja na podstronę (tak było przed D-Q6)
      await expect(page).toHaveURL(/\/$/);
    });
  }

  test("bez JS link zostaje zwykłym odnośnikiem na podstronę", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    // fallback dla braku/awarii JS — wzorzec kafli kategorii (D-P2)
    await expect(
      page.locator("[data-retx] a[data-work-more]").first(),
    ).toHaveAttribute("href", "/realizacje/");
  });
});

// ── Bramka fontu przy typografii hero (D-T1) ────────────────────────────
// Zgłoszenie: w Firefoksie przy PIERWSZYM wejściu napisy hero renderowały
// się podwójnie (biała kopia <use> i kopia przycięta maską — każda innym
// krojem), bo Gecko nie unieważnia rastra po podmianie fontu. Poprawka nie
// dopuszcza do rasteryzacji napisów krojem zastępczym.
// Decyzje: docs/analiza-poprawki-3.md.
test.describe("hero desktop: bramka fontu typografii (D-T1)", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "typografia SVG istnieje tylko w hero desktopowym",
  );

  /** Opóźnia pliki fontów — symulacja zimnego cache / wolnego łącza. */
  async function slowFonts(page: Page, ms: number) {
    await page.route("**/*.woff2", async (route) => {
      await new Promise((r) => setTimeout(r, ms));
      await route.continue();
    });
  }

  const svg = (page: Page) => page.locator(".hero-d svg");

  test("dopóki font się nie wczytał, warstwa napisów nie jest renderowana", async ({
    page,
  }) => {
    await slowFonts(page, 3000);
    await page.goto(PATH, { waitUntil: "commit" });
    // skrypt bramki stoi PRZED markupem hero — gdy .hero-d już istnieje,
    // klasa musi być założona
    await page.locator(".hero-d").waitFor({ state: "attached" });

    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains("hero-wait"),
      ),
    ).toBe(true);
    await expect(svg(page)).toHaveCSS("display", "none");
  });

  test("po wczytaniu fontu bramka spada i napisy wracają", async ({ page }) => {
    await slowFonts(page, 700);
    await page.goto(PATH, { waitUntil: "load" });

    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.classList.contains("hero-wait"),
        ),
      )
      .toBe(false);
    await expect(svg(page)).toHaveCSS("display", "block");
  });

  test("awaria pobrania fontu NIE kasuje napisów (twarda podłoga)", async ({
    page,
  }) => {
    await page.route("**/*.woff2", (route) => route.abort());
    await page.goto(PATH, { waitUntil: "commit" });
    await page.locator(".hero-d").waitFor({ state: "attached" });

    // timeout bramki to 2500 ms i siedzi w skrypcie inline, więc działa
    // nawet gdy moduły JS nie dojadą
    await expect(svg(page)).toHaveCSS("display", "block", { timeout: 5000 });
  });

  test("lista znaków bramki pokrywa wszystkie napisy hero", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    // kontrakt: [data-font-text] i <text> mają jedno źródło w komponencie —
    // nowa nazwa kategorii ze znakiem spoza listy nie wymusiłaby pobrania
    // właściwego podzbioru fontu i bramka przepuściłaby krój zastępczy
    const brak = await page.evaluate(() => {
      const dozwolone = new Set(
        document.querySelector<HTMLElement>(".hero-d")!.dataset.fontText ?? "",
      );
      const napisy = [...document.querySelectorAll(".hero-d defs text")]
        .map((t) => t.textContent ?? "")
        .join("");
      return [...new Set(napisy.replace(/\s/g, ""))].filter(
        (z) => !dozwolone.has(z),
      );
    });
    expect(brak).toEqual([]);
  });
});
