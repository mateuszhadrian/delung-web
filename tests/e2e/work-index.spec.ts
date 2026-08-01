// Podstrona realizacji (/realizacje/, część 4.4): szyna filtrów
// („Wszystkie" + tylko kategorie z wpisami — D-R1), deep-link
// /realizacje/#<slug> (D-R2), siatka kafli `tile` z Content Collections,
// detal = JEDEN overlay #work-detail (modal ≥1024 / sheet <1024 w CSS —
// D-R3) z galerią (strzałki/dashes desktop, snap-karuzela mobile),
// projnav i wideo na tap. Decyzje: docs/analiza-realizacje.md.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { CATEGORIES } from "../../src/lib/categories";
import { OFERTA_PATH, POLICY_PATH } from "../../src/lib/routes";
import {
  collectPageIssues,
  useChromium1920Only,
  usePreviewGuard,
} from "../helpers/guards";
import { gotoReady, scrollPageTo } from "../helpers/scroll";

const SITE = "https://delung.pl";
const PATH = "/realizacje/";

// Wpisy kolekcji wprost z plików JSON (jak robi to build) — testy nie
// hardkodują treści CMS-a, liczą to samo co workRail()/strona.
interface Entry {
  slug: string;
  order: number;
  title: string;
  category: string;
  gallery: { image: string; video?: string; duration?: string }[];
}
const DIR = fileURLToPath(
  new URL("../../src/content/realizacje", import.meta.url),
);
const ENTRIES: Entry[] = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")) as Entry)
  .sort((a, b) => a.order - b.order);

const pad = (n: number) => String(n).padStart(2, "0");
const CATS_WITH = CATEGORIES.filter((c) =>
  ENTRIES.some((e) => e.category === c.slug),
);
const CATS_EMPTY = CATEGORIES.filter(
  (c) => !ENTRIES.some((e) => e.category === c.slug),
);
const countOf = (slug: string) =>
  ENTRIES.filter((e) => e.category === slug).length;
const VIDEO_ENTRY = ENTRIES.find((e) => e.gallery.some((g) => g.video));

usePreviewGuard();

/** Dociera do pierwszego kafla siatki i uspokaja scroll przed klikiem. */
async function revealFirstCard(page: Page) {
  const card = page.locator(".re-grid [data-work-slug]").first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return card;
}

/** Otwiera detal kafla i czeka na koniec animacji wejścia nakładki. */
async function openDetail(page: Page, card: ReturnType<Page["locator"]>) {
  await card.click();
  const detail = page.locator("#work-detail");
  await expect(detail).toHaveClass(/is-open/);
  await page.waitForTimeout(600);
  return detail;
}

test.describe(`${PATH}: meta i treść (jeden profil)`, () => {
  useChromium1920Only(
    "meta/treść niezależne od profilu — jeden projekt wystarczy",
  );

  test("lang, tytuł, description, canonical", async ({ page }) => {
    await gotoReady(page, PATH);
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page).toHaveTitle(ui.pl["workPage.title"]);
    await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
      "content",
      ui.pl["workPage.description"],
    );
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}${PATH}`,
    );
  });

  test("nagłówek i siatka pokazują WSZYSTKIE wpisy kolekcji", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await expect(page.locator("main h1")).toHaveText("Nasze realizacje");
    await expect(page.locator(".re-grid [data-work-slug]")).toHaveCount(
      ENTRIES.length,
    );
    // pasek nad siatką: stan startowy „wszystkie"
    await expect(page.locator("[data-gridlabel]")).toHaveText(
      `WSZYSTKIE KATEGORIE · ${pad(ENTRIES.length)} Z ${pad(ENTRIES.length)}`,
    );
  });

  test("navbar podstrony: Oferta → podstrona, Realizacje = bieżąca", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await expect(
      page.locator(`.nav-link[href="${OFERTA_PATH}"]`),
    ).toBeAttached();
    const work = page.locator(`.nav-link[href="${PATH}"]`);
    await expect(work).toBeAttached();
    await expect(work).toHaveAttribute("aria-current", "page");
    // Stopka: chrome globalny 4.1 — link polityki + Instagram.
    await expect(
      page.locator(`.ft-nav a[href="${POLICY_PATH}"]`),
    ).toBeAttached();
    await expect(page.locator(".ft-soc a").first()).toBeAttached();
  });

  test("sticky pasek z logo — widoczny u góry także po scrollu", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const logo = page.locator(".hdr-logo");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/");
    await scrollPageTo(page, 600);
    const nav = page.locator("[data-nav]");
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBe(0);
  });

  test("strona ładuje się bez błędów konsoli i 404", async ({ page }) => {
    const issues = collectPageIssues(page);
    await gotoReady(page, PATH);
    expect(issues()).toEqual([]);
  });
});

test.describe("szyna filtrów + deep-link (jeden profil)", () => {
  useChromium1920Only("logika filtrów niezależna od profilu");

  test("szyna = „Wszystkie” + wyłącznie kategorie z wpisami", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const buttons = page.locator("[data-rail] button");
    await expect(buttons).toHaveCount(1 + CATS_WITH.length);
    const first = buttons.first();
    await expect(first).toContainText("Wszystkie");
    await expect(first).toHaveAttribute("aria-pressed", "true");
    for (const c of CATS_WITH) {
      const btn = page.locator(`[data-rail] button[data-f="${c.slug}"]`);
      await expect(btn).toContainText(c.label);
      await expect(btn.locator("b")).toHaveText(pad(countOf(c.slug)));
    }
    for (const c of CATS_EMPTY) {
      await expect(
        page.locator(`[data-rail] button[data-f="${c.slug}"]`),
      ).toHaveCount(0);
    }
  });

  test("klik filtra zawęża siatkę, aktualizuje pasek i hash; „Wszystkie” przywraca", async ({
    page,
  }) => {
    const cat = CATS_WITH[0];
    await gotoReady(page, PATH);
    await page.locator(`[data-rail] button[data-f="${cat.slug}"]`).click();

    await expect(page.locator(".re-grid [data-work-slug]:visible")).toHaveCount(
      countOf(cat.slug),
    );
    await expect(page.locator("[data-gridlabel]")).toHaveText(
      `${cat.label.toUpperCase()} · ${pad(countOf(cat.slug))} Z ${pad(ENTRIES.length)}`,
    );
    await expect(
      page.locator(`[data-rail] button[data-f="${cat.slug}"]`),
    ).toHaveAttribute("aria-pressed", "true");
    expect(new URL(page.url()).hash).toBe(`#${cat.slug}`);

    await page.locator('[data-rail] button[data-f=""]').click();
    await expect(page.locator(".re-grid [data-work-slug]:visible")).toHaveCount(
      ENTRIES.length,
    );
    expect(new URL(page.url()).hash).toBe("");
  });

  test("deep-link /realizacje/#<slug> startuje przefiltrowany (D-R2)", async ({
    page,
  }) => {
    const cat = CATS_WITH[0];
    await gotoReady(page, `${PATH}#${cat.slug}`);
    await expect(page.locator(".re-grid [data-work-slug]:visible")).toHaveCount(
      countOf(cat.slug),
    );
    await expect(
      page.locator(`[data-rail] button[data-f="${cat.slug}"]`),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("slug spoza szyny (pusta kategoria/literówka) → pełna siatka", async ({
    page,
  }) => {
    const bad = CATS_EMPTY[0]?.slug ?? "nie-ma-takiej-kategorii";
    await gotoReady(page, `${PATH}#${bad}`);
    await expect(page.locator(".re-grid [data-work-slug]:visible")).toHaveCount(
      ENTRIES.length,
    );
    await expect(page.locator('[data-rail] button[data-f=""]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

test.describe("detal desktop: modal, galeria, projnav", () => {
  test.skip(({ isMobile }) => !!isMobile, "układ modala tylko na desktop");

  test("klik w kafel otwiera modal z treścią projektu; ×, Esc i scrim zamykają", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const card = await revealFirstCard(page);
    const name = await card.getAttribute("data-work-name");
    const detail = await openDetail(page, card);

    await expect(detail.locator(".dt-title")).toHaveText(name ?? "");
    await expect(detail.locator("[data-projcount]")).toHaveText(
      `REALIZACJA 01 / ${pad(ENTRIES.length)}`,
    );

    // X w dt-head (desktop; drugi [data-overlay-close] to X sheeta mobile)
    await detail.locator(".dt-x").click();
    await expect(detail).toBeHidden();
    // host czyszczony po zamknięciu (zwalnia obrazy/DOM)
    await expect(detail.locator(".dt-title")).toHaveCount(0);

    await openDetail(page, card);
    await page.keyboard.press("Escape");
    await expect(detail).toBeHidden();

    await openDetail(page, card);
    // klik w tło (róg nakładki, poza panelem) zamyka
    await page.mouse.click(8, 8);
    await expect(detail).toBeHidden();
  });

  test("galeria: strzałki i dashes przełączają kadry, licznik nadąża", async ({
    page,
  }) => {
    const shots = ENTRIES[0].gallery.length;
    test.skip(shots < 2, "pierwszy wpis ma jeden kadr");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    const count = detail.locator("[data-shotcount]");
    await expect(count).toHaveText(`01 / ${pad(shots)}`);
    await expect(detail.locator("[data-prevshot]")).toBeDisabled();

    await detail.locator("[data-nextshot]").click();
    await expect(count).toHaveText(`02 / ${pad(shots)}`);
    await expect(detail.locator("[data-prevshot]")).toBeEnabled();
    await expect(
      detail.locator("[data-dashes] [data-shot]").nth(1),
    ).toHaveClass(/on/);

    await detail.locator(`[data-dashes] [data-shot="0"]`).click();
    await expect(count).toHaveText(`01 / ${pad(shots)}`);
  });

  test("projnav przechodzi do następnej realizacji w obrębie kontekstu", async ({
    page,
  }) => {
    test.skip(ENTRIES.length < 2, "potrzeba min. 2 wpisów");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    await detail.locator("[data-nextproj]").click();
    // crossfade podmienia treść po ~220 ms
    await expect(detail.locator(".dt-title")).toHaveText(ENTRIES[1].title);
    await expect(detail.locator("[data-projcount]")).toHaveText(
      `REALIZACJA 02 / ${pad(ENTRIES.length)}`,
    );
    // nakładka pozostaje otwarta (klik w projnav to nie klik w tło)
    await expect(detail).toHaveClass(/is-open/);

    await detail.locator("[data-prevproj]").click();
    await expect(detail.locator(".dt-title")).toHaveText(ENTRIES[0].title);
  });

  test("„Zobacz więcej z kategorii” filtruje siatkę i zamyka detal", async ({
    page,
  }) => {
    const first = ENTRIES[0];
    const label = CATEGORIES.find((c) => c.slug === first.category)!.label;
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    await detail.locator(".dt-more").click();
    await expect(detail).toBeHidden();
    await expect(page.locator(".re-grid [data-work-slug]:visible")).toHaveCount(
      countOf(first.category),
    );
    await expect(page.locator("[data-gridlabel]")).toContainText(
      label.toUpperCase(),
    );
    expect(new URL(page.url()).hash).toBe(`#${first.category}`);
  });

  test("klik w kadr otwiera podgląd pełnoekranowy; strzałki, X i Esc", async ({
    page,
  }) => {
    const shots = ENTRIES[0].gallery.length;
    test.skip(shots < 2, "pierwszy wpis ma jeden kadr");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));
    const lb = detail.locator("[data-lightbox]");

    await detail.locator("[data-slide]").first().click();
    await expect(lb).toBeVisible();
    await expect(lb.locator("[data-lb-count]").last()).toHaveText(
      `01 / ${pad(shots)}`,
    );
    await expect(lb.locator("[data-lb-prev]")).toBeDisabled();

    // strzałka w prawo: kadr odjeżdża w lewo, następny wjeżdża z prawej
    await lb.locator("[data-lb-next]").click();
    await expect(lb.locator("[data-lb-count]").last()).toHaveText(
      `02 / ${pad(shots)}`,
    );
    await expect(lb.locator("[data-lb-dashes] button").nth(1)).toHaveClass(
      /on/,
    );

    // X zamyka TYLKO podgląd; galeria wraca na oglądany kadr
    await lb.locator(".lb-x").click();
    await expect(lb).toBeHidden();
    await expect(detail).toHaveClass(/is-open/);
    await expect(detail.locator("[data-shotcount]")).toHaveText(
      `02 / ${pad(shots)}`,
    );

    // Esc w podglądzie zamyka podgląd, nie detal
    await detail.locator("[data-slide]").nth(1).click();
    await expect(lb).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(lb).toBeHidden();
    await expect(detail).toHaveClass(/is-open/);
  });

  test("wideo: ikonka kamery, autoplay w podglądzie, tap = pauza↔play", async ({
    page,
  }) => {
    test.skip(!VIDEO_ENTRY, "brak wpisu z wideo w kolekcji");
    const entry = VIDEO_ENTRY!;
    const videoIdx = entry.gallery.findIndex((g) => g.video);
    await gotoReady(page, PATH);
    const card = page.locator(`.re-grid [data-work-slug="${entry.slug}"]`);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const detail = await openDetail(page, card);

    const video = detail.locator("[data-gal] video");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveAttribute("playsinline", "");
    // bez `controls` i bez własnego znaku play (korekta Mateusza) —
    // ewentualny znak może dodać wyłącznie sama przeglądarka
    expect(await video.getAttribute("controls")).toBeNull();
    // rozmiary obrazów WYŁĄCZNIE przez imgAt() — na preview (build prod)
    // poster idzie przez /cdn-cgi/image/ (lokalnie 404 — znany artefakt)
    expect(await video.getAttribute("poster")).toMatch(/^\/cdn-cgi\/image\//);

    // dojazd do kadru z wideo: ikonka kamery + czas trwania na kadrze
    await detail.locator(`[data-dashes] [data-shot="${videoIdx}"]`).click();
    await expect(detail.locator("[data-gal] [data-cam]")).toBeVisible();
    if (entry.gallery[videoIdx].duration) {
      await expect(detail.locator("[data-gal] .dt-time")).toBeVisible();
    }

    // tap w kadr wideo → podgląd pełnoekranowy z JUŻ grającym filmem
    // (play() przestawia stan od razu — media R2 poza ścieżką PR)
    await detail.locator("[data-gal] [data-slide]").nth(videoIdx).click();
    const lb = detail.locator("[data-lightbox]");
    await expect(lb).toBeVisible();
    await expect(lb.locator("[data-lb-count]").last()).toHaveText(
      `${pad(videoIdx + 1)} / ${pad(entry.gallery.length)}`,
    );
    const lbVideo = lb.locator("video");
    expect(await lbVideo.evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      false,
    );
    // grający film chowa ikonkę kamery
    await expect(lb.locator("[data-cam]")).toBeHidden();

    // tap w grający film = pauza (ikonka wraca), kolejny tap = play
    await lbVideo.click();
    expect(await lbVideo.evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      true,
    );
    await expect(lb.locator("[data-cam]")).toBeVisible();
    await lbVideo.click();
    expect(await lbVideo.evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      false,
    );
  });
});

test.describe("detal mobile: bottom sheet, karuzela, gesty", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("tap w kafel otwiera sheet; X i Esc zamykają, host czyszczony", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const card = await revealFirstCard(page);
    const name = await card.getAttribute("data-work-name");
    const detail = await openDetail(page, card);

    await expect(detail.locator(".dt-title")).toHaveText(name ?? "");
    // desktopowy dt-head schowany; sheet ma własny X (jak karty
    // kategorii 4.3 — korekta Mateusza po testach)
    await expect(detail.locator(".dt-head")).toBeHidden();
    await detail.locator(".dt-xm").click();
    await expect(detail).toBeHidden();
    await expect(detail.locator(".dt-title")).toHaveCount(0);

    await openDetail(page, card);
    await page.keyboard.press("Escape");
    await expect(detail).toBeHidden();
  });

  test("tap w kadr → podgląd pełnoekranowy; chevron wraca na oglądany kadr", async ({
    page,
  }) => {
    const shots = ENTRIES[0].gallery.length;
    test.skip(shots < 2, "pierwszy wpis ma jeden kadr");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));
    const lb = detail.locator("[data-lightbox]");

    await detail.locator("[data-slide]").first().click();
    await expect(lb).toBeVisible();
    // chrome mobile: chevron-wstecz jest, X i pasek strzałek desktopu nie
    await expect(lb.locator(".lb-back")).toBeVisible();
    await expect(lb.locator(".lb-x")).toBeHidden();
    await expect(lb.locator("[data-lb-count]").first()).toHaveText(
      `01 / ${pad(shots)}`,
    );

    // swipe (programowo: scroll toru o szerokość ekranu) przełącza kadr
    await lb.locator("[data-lb-track]").evaluate((el) => {
      el.scrollTo({ left: el.clientWidth, behavior: "instant" });
    });
    await expect(lb.locator("[data-lb-count]").first()).toHaveText(
      `02 / ${pad(shots)}`,
    );

    // chevron zamyka TYLKO podgląd; galeria wraca na oglądany kadr
    await lb.locator(".lb-back").click();
    await expect(lb).toBeHidden();
    await expect(detail).toHaveClass(/is-open/);
    await expect(detail.locator("[data-shotcount]")).toHaveText(
      `02 / ${pad(shots)}`,
    );

    // wyraźny swipe-down również zamyka podgląd (korekta Mateusza)
    await detail.locator("[data-slide]").nth(1).click();
    await expect(lb).toBeVisible();
    const vw = page.viewportSize()!;
    const cx = vw.width / 2;
    await page.mouse.move(cx, vw.height * 0.4);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(cx, vw.height * 0.4 + i * 22);
    }
    await page.mouse.up();
    await expect(lb).toBeHidden();
    await expect(detail).toHaveClass(/is-open/);
  });

  test("karuzela galerii: gotchas toru + licznik ze scrolla", async ({
    page,
  }) => {
    const shots = ENTRIES[0].gallery.length;
    test.skip(shots < 2, "pierwszy wpis ma jeden kadr");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    const track = detail.locator("[data-track]");
    // gotchas karuzel (sections.md): atrybut Lenisa + snap-stop
    await expect(track).toHaveAttribute("data-lenis-prevent-horizontal", "");
    await expect(track.locator("[data-slide]").first()).toHaveCSS(
      "scroll-snap-stop",
      "always",
    );

    // przewinięcie toru o kafel przestawia licznik
    await track.evaluate((el) => {
      const slide = el.children[0] as HTMLElement;
      el.scrollTo({ left: slide.offsetWidth + 10, behavior: "instant" });
    });
    await expect(detail.locator("[data-shotcount]")).toHaveText(
      `02 / ${pad(shots)}`,
    );
  });

  test("swipe-down za uchwyt zamyka sheet (gest overlay.ts)", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    const grab = detail.locator("[data-overlay-drag]");
    const box = await grab.boundingBox();
    expect(box).not.toBeNull();
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(startX, startY + i * 25);
    }
    await page.mouse.up();

    await expect(detail).toBeHidden();
  });

  test("tap w scrim (pas nad sheetem) zamyka", async ({ page }) => {
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));
    // sheet ma 96svh — pas u samej góry to tło nakładki
    const vw = page.viewportSize()!;
    await page.mouse.click(vw.width / 2, 4);
    await expect(detail).toBeHidden();
  });
});

test.describe("dojście ze strony głównej — linki Więcej realizacji", () => {
  test("wszystkie linki data-work-more prowadzą na podstronę", async ({
    page,
  }) => {
    await gotoReady(page);
    const links = await page.locator("a[data-work-more]").all();
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      await expect(a).toHaveAttribute("href", PATH);
    }
  });

  test("CTA zajawki nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    const secTop = await page.evaluate(
      () => document.querySelector<HTMLElement>("[data-home-re]")!.offsetTop,
    );
    await scrollPageTo(page, secTop + 10);
    await page.locator(".re-cta a[data-work-more]").click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator(".re-grid")).toBeVisible();
  });
});
