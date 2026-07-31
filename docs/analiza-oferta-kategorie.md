# Analiza — /oferta/ + /kategorie/ (Etap 4, część 4.3)

Port dwóch widoków oferty na design delung: `/oferta/` (desktop zakładki
+ panel kategorii, mobile karuzela 3 kafli) i `/kategorie/` (mobile-only:
pełna lista kategorii + karta kategorii w bottom sheecie). Cel jak w
4.1/4.2: wygląd i zachowanie **1:1 z eksportami**; szkielety z Etapu 0
znikają.

Referencje: `docs/design/oferta.html`, `docs/design/kategorie.html`,
`docs/analiza-chrome-globalny.md` (D-CH4, D-CH5), `docs/analiza-strona-glowna.md`
(wzorce motion-gate, kontrasty), `.claude/rules/sections.md` (gotchas
karuzel, overlaye), `.claude/rules/testing.md`.

## 1. Co mówią eksporty (anatomia widoków)

**`/oferta/`** (navbar `plain` — dokładnie dzisiejszy wariant):

| Blok | Mobile (<1024) | Desktop (≥1024) |
| --- | --- | --- |
| `of` | biały; head (kicker OFERTA / h1 „Co tworzymy?" / linia / lead) + **karuzela pozioma**: 3 kafle kategorii (zdjęcie, tint, podpis łamany, kółko-strzałka) + kafel „zobacz pełną ofertę" → `kategorie.html`; pod torem pasek postępu (wypełnienie 1/4, translateX z przewinięcia toru) | cream; head dwukolumnowy (kicker zielony, h1, lead „Wybierz kategorię…"), **6 zakładek-pigułek** + **panel**: grid zdjęcie ⁄ (numer+KATEGORIA, h2, opis) ⁄ (4 spece w siatce + karta CTA „Przeglądaj realizacje z kategorii X" → `realizacje.html`); panel wypełnia pierwszy ekran (`min-height: 100svh − pasek`); przełączenie zakładki = wjazd elementów + clip-path reveal zdjęcia (w eksporcie GSAP) |
| `mq` | brak | marquee 6 logotypów dostawców (4 kopie, animacja CSS 34 s), białe tło, hairline góra/dół |
| `pr` | tło kaszmir blur(7)+tint, kicker PROCES WSPÓŁPRACY, akapit, przycisk „Poznaj proces współpracy" → `proces.html`; **h2 ukryte** | pełnoekranowy finał wyśrodkowany: kicker, h2 „Jak pracujemy?", akapit, przycisk; parallax tła (`data-par`) |

Dane kategorii stoją w jednej tablicy `KATEGORIE` (6 pozycji:
num/tab/card/title/img/pos/desc/det[4]) — mobile pokazuje pierwsze 3
(`KAFLE_MOBILE=3`), desktop wszystkie. Warianty niskich ekranów:
`835–1023 × ≤700` (head dwukolumnowy, kafle dopasowane wysokością)
i `≥1024 × ≤820` (spece i CTA pod zdjęciem, 4 kolumny).

**`/kategorie/`** (TYLKO mobile; na desktopie redirect):

- `kt-head`: kicker PEŁNA OFERTA, h1 „Przestrzeń bez kompromisów.",
  linia, lead.
- `kt-list`: 6 pionowych kafli (zdjęcie 338/300, tint, numer, nazwa +
  blurb, kółko-strzałka) — tap otwiera **kartę kategorii**.
- Karta = bottom sheet 96svh na białym tle: grab-handle, przycisk „X",
  kicker `NN — OFERTA`, tytuł, zdjęcie 338/190, opis, „W STANDARDZIE" +
  4 spece z ikonami w kółkach, link „Zobacz realizacje z tej kategorii"
  → `realizacje.html`; przyklejona stopka-gradient z CTA „Skontaktuj się
  z nami" → `kontakt.html`. Zamykanie: X, scrim, Esc, przeciągnięcie
  grab-handle >120 px.
- `kt-cta`: tło kaszmir blur(7)+tint, h2 „Masz wizję swojego wnętrza?",
  przycisk „Skontaktuj się i omówmy projekt." → `kontakt.html`.

Dane w eksporcie kategorie.html = ta sama tablica co oferta.html
+ pola `name`/`blurb` (kafle listy) i ikony spec.

## 2. Decyzje portu

### D-OK1. Dane: treści oferty kluczowane slugami `categories.ts`, sługi NIETKNIĘTE

Nowy moduł `src/components/sections/oferta/oferta-content.ts`: tablica
6 wpisów **kluczowanych `CategorySlug`** z `src/lib/categories.ts`
(kolejność designu = kolejność `CATEGORIES`, zgodne 1:1). Wpis niesie
treści marketingowe eksportu: `num`, `tab` (zakładka), `card` (podpis
kafla mobile z łamaniem), `name`+`blurb` (kafle /kategorie/), `title`,
`desc`, `det[4]`, obraz + `object-position`. Etykiety marketingowe
(„Kuchnie i sprzęt AGD") są treścią oferty i **nie zmieniają** labeli
ani slugów `categories.ts` (kontrakt selecta CMS nietknięty — test
kontraktu dalej zielony). Kategoria **`inne` nie ma treści oferty**
(nie ma jej w designie) — żyje tylko w CMS i filtrach realizacji;
oferta pokazuje 6 kategorii. Unit test spójności: każdy wpis wskazuje
istniejący slug, dokładnie 6 pozycji w kolejności `CATEGORIES`,
komplet pól.

### D-OK2. Desktop /oferta/: wzorzec ARIA tabs, animacje panelu w CSS (bez GSAP)

Zakładki jako pełny wzorzec tabs: `role="tablist"` / `role="tab"`
(`aria-selected`, `tabindex` roving, strzałki ←→) / `role="tabpanel"`
(`aria-labelledby`). **Panel 01 aktywny już w SSR** (klasa `on`
w markupie) — bez JS strona pokazuje pierwszą kategorię, zakładki
wymagają JS (jak w eksporcie). Animacje przełączenia (wjazd elementów
ze staggerem, clip-path reveal zdjęcia, dojazd skali) portuję jako
**czyste keyframes CSS** — `display:none → grid` restartuje animacje
przy każdym przełączeniu, więc JS tylko przepina klasy `on`;
`prefers-reduced-motion: reduce` wyłącza (media query w CSS). GSAP
nie wchodzi (spójnie z D-SG9, budżet skryptu).

### D-OK3. Mobile /oferta/: karuzela 3+1 wg gotchas, pasek postępu funkcjonalny

Karuzela: 3 kafle (pierwsze 3 pozycje treści) + kafel „zobacz pełną
ofertę" — **całe kafle to linki do `/kategorie/`** (1:1 z designem;
bez deep-linku do konkretnej kategorii — eksport go nie ma). Gotchas
sections.md na torze: `data-lenis-prevent-horizontal` (NIE
`data-lenis-prevent`) + `scroll-snap-stop: always` (mimo że Lenis jest
dziś desktop-only — atrybut to kontrakt reguł, nic nie kosztuje).
Pasek postępu pod torem = funkcjonalny feedback przewijania (nie
dekoracja): listener `scroll` toru w skrypcie ładowanym **zawsze**
(jak tabs), poza bramką motion; bez JS pokazuje pierwszą ćwiartkę.
Wariant niskiego landscape'u 835–1023×≤700 portuję 1:1 (tanio, jest
w eksporcie).

### D-OK4. `pr` + marquee: reuse assetów z 4.2, bez dotykania komponentów home

- Tło `pr` (i `kt-cta` na /kategorie/) = **istniejący `ko-bg.webp`**
  (kaszmir przygotowany pod blur(7) w 4.2) — zero nowych bajtów.
- Marquee logotypów: reuse plików `src/assets/home/logo-*.webp`, ale
  **własny lokalny markup/CSS w sekcji oferty** — HomeTrust zostaje
  nietknięty (jego zmiana odświeżałaby baseline'y strony głównej;
  ekstrakcja wspólnego komponentu = ewentualny refactor przy 4.5).
  Drugi–czwarty obieg pętli `aria-hidden="true"`, przy reduce marquee
  stoi (statyczny pierwszy obieg) — wzorzec opinii z 4.2.
- `pr` na mobile bez h2 (jak eksport — jedyny nagłówek to h1 strony;
  bez dziury w hierarchii, bo to h2 ukrywane per-breakpoint).

### D-OK5. /kategorie/: redirect nietknięty; karta kategorii = 6 pre-renderowanych sheetów na `overlay.ts`

Mechanizm z Etapu 0 zostaje bez zmian: inline skrypt redirectu
w `<head>` (desktop → `/oferta/` przed paintem), `canonicalPath` →
`/oferta/`, `smoothScroll={false}`, sitemapa bez `/kategorie/`.

Karta kategorii: **6 kompletnych overlayów w SSR** (po jednym na
kategorię, `id="kat-<slug>"`), markup wg designu (`dt`: grab, X, body,
stopka CTA) z kontraktem `overlay.ts`: `data-overlay` +
`data-overlay-kind="sheet"` + `data-overlay-panel` +
`data-overlay-drag` + `role="dialog"` `aria-modal`. Za darmo:
focus-trap, Esc, scrim, swipe-down, blokada scrolla. Kafle listy jako
`<button class="kt-card">` (`aria-haspopup="dialog"`,
`aria-controls`) → `overlay.open("kat-…")`. Pre-render zamiast
szablonu+JS (wzorzec work-detail), bo treść jest statyczna i znana
w build time — zero templatingu po stronie klienta. Przycisk „X"
z designu zostaje (`data-overlay-close`). Przejście ≥1024 przy
otwartym sheecie **zamyka go** (matchMedia — reguła sections.md;
redirect działa tylko na load, resize go nie odpala). Nie reużywam
`BottomSheet.astro` (ciemny motyw szablonu, max-width 520 — design
karty jest full-width, biały, 96svh; ta sama decyzja co D-CH6).

### D-OK6. CTA realizacji: etykiety z `categoryLabel()`, href bez parametru (deep-link = 4.4)

Karta CTA panelu desktop („Przeglądaj realizacje z kategorii **X**")
i link `dt-more` w karcie kategorii prowadzą do `/realizacje/`.
Etykieta kategorii = `categoryLabel(slug)` uppercase — **nie** pole
`rel` z eksportu (eksport ma nazwy kategorii sprzed decyzji D2:
„ŁAZIENKI", komercyjne/dekoracje zlane w „INNE"; po D2 każda z 6
kategorii oferty ma własną kategorię realizacji 1:1). Href bez
parametru filtra: filtry `/realizacje/` powstają w 4.4 — deep-link
(`?kategoria=` czy hash) to decyzja tamtej części; dziś parametr byłby
martwy. Odnotowuję w planie 4.4.

### D-OK7. Kontrasty pod pustą allowlistę axe (wzorzec D-CH7.5/D-SG7)

Hierarchia rozmiarem, nie kontrastem:

1. Kickery i drobne napisy na jasnych tłach z eksportu poniżej AA:
   `of-kick`/`kt-kick` rgba(26,26,26,.5), desktopowy `of-kick`
   i akcenty numeracji/spec **`--gr` #2f8f5b (~4.0:1)** → `--accent-ink`
   (#256f47); `of-pnum b`, `of-ctaCard .k`, `dt-spec b` alpha .45 →
   min. 0.64 (`--faint`).
2. Ciemne tła: `pr-kick` .65 → min. rgba(255,255,255,.7) (wzorzec
   sheet-call); `dt-foot b` .6 na `--ink` ≈ 7:1 — zostaje.
3. Teksty na zdjęciach (podpisy kafli, numery) leżą na tincie
   gradientowym jak kafle home — axe nie liczy kontrastu na obrazach,
   ale tint + text-shadow z eksportu zostają (czytelność).

### D-OK8. Skrypty: funkcjonalne zawsze, ruch za bramką; breakpoint 1024 w parze

- `oferta-config.ts`: stała **`OFERTA_DESKTOP_MIN_PX = 1024`**
  (importują testy) + ten sam próg w `@media` komponentów — W PARZE.
- Skrypt funkcjonalny (ładowany zawsze): zakładki (D-OK2), pasek
  karuzeli (D-OK3); na /kategorie/: otwieranie sheetów + domknięcie
  przy ≥1024 (D-OK5).
- Ruch (za bramką `prefers-reduced-motion: no-preference`, dynamiczny
  import — wzorzec home): reveale `[data-rev]` (IO) + parallax tła `pr`
  / `kt-cta` (rAF) — ~40 linii bez GSAP; stany startowe revealów
  uzbraja klasa `js-motion` (bez JS/przy reduce strona w pełni
  statyczna).

### D-OK9. Assety: nowe kadry kategorii, reszta z 4.2

Kwadratowe `cat-*.webp` z 4.2 (960×960, krop pod zajawkę home) **nie
nadają się** pod kadry oferty (kafel mobile 296/470 pionowy, panel
desktop szeroki ~670×850 CSS px, karta /kategorie/ 338/300 +
338/190) — `object-position` designu (`0% 50%`, `100% 50%`) odnosi się
do pełnych źródeł. Generuję z pełnych PNG
(`docs/design/assets/img/*_category.png`) po **jednym pliku na
kategorię**: `src/assets/oferta/cat-<slug>.webp`, szerokość ~1400 px
(pokrywa panel desktop przy DPR2 z zapasem; kafle biorą mniejsze
kadry przez `object-fit: cover`). Reuse: `logo-*.webp` (marquee),
`ko-bg.webp` (tła pr/kt-cta). Obrazy poniżej foldu `loading="lazy"`
+ `decoding="async"`, jawne wymiary; zdjęcie aktywnego panelu 01
(pierwszy ekran desktop) bez lazy.

### D-OK10. Meta i porządki

Tytuły/opisy stron zostają ze szkieletów (są docelowe; seo.spec bez
zmian). Sitemapa/canonical bez zmian. Żaden z widoków nie importował
`legacy-dark.css` — nic do usunięcia (lekcja 1). `SkeletonPage.astro`
zostaje (używają go proces/o-nas do 4.5). Niezacommitowana
aktualizacja CLAUDE.md (stan po 4.2) z working tree wchodzi do
pierwszego commita na feature branchu.

## 3. Kontrakty selektorów i testów

| Kontrakt | Los |
| --- | --- |
| `main h1` (navigation: klik „Oferta"; smoke) | spełnia `of-head h1` / `kt-head h1` |
| skan a11y /kategorie/ tylko na pixelu | **bez zmian** (a11y.spec nietknięty) |
| redirect desktop `/kategorie/` → `/oferta/` | **bez zmian** (inline skrypt Etapu 0) |
| test kontraktu selecta CMS (categories.ts) | **bez zmian** — sługi/labele nietknięte (D-OK1) |
| nowe | `OFERTA_DESKTOP_MIN_PX` (import w testach), `[role="tablist"]`/`.of-tab`/`.of-panel`, `[data-rail]`/`.of-card`/`.of-all`, `[data-barfill]`, `.kt-card[aria-controls]`, overlaye `#kat-<slug>` (`data-overlay`), `.dt-more a`, `.dt-foot a` |

## 4. Plan implementacji

1. Assety: `optimize-images.mjs` — 6 × `src/assets/oferta/cat-<slug>.webp`
   (~1400 px) z pełnych źródeł designu.
2. `oferta-content.ts` + `oferta-config.ts`
   (`src/components/sections/oferta/`) + unit test spójności z
   `CATEGORIES` (D-OK1).
3. `/oferta/`: `OfertaPage` złożona z sekcji `OfertaHead`+zakładki+
   panele (lub jeden `Oferta.astro` — strona jest jednym blokiem
   designu), `OfertaLogos` (marquee), `OfertaProcesCta` (`pr`);
   skrypty wg D-OK8; `src/pages/oferta.astro` przechodzi ze
   `SkeletonPage` na nowy widok.
4. `/kategorie/`: sekcja listy + 6 overlayów karty kategorii
   (wspólne dane z `oferta-content.ts`); `src/pages/kategorie.astro`
   zachowuje head-slot redirectu, canonical i `smoothScroll={false}`
   bez zmian.
5. Testy e2e/visual (niżej), lokalnie pełna bramka (`typecheck`,
   `lint`, `test:unit`, `test:e2e`, `build` + `test:visual`).
6. Baseline'y w świętej kolejności; PR `feat/etap-4-3-oferta-kategorie`
   (pierwszy commit zabiera czekającą aktualizację CLAUDE.md z 4.2).

## 5. Testy

- **Unit**: kontrakt `oferta-content` ↔ `CATEGORIES` (D-OK1);
  istniejący kontrakt CMS bez zmian.
- **E2E — nowy `tests/e2e/oferta.spec.ts`**:
  - desktop (`isDesktop` po `OFERTA_DESKTOP_MIN_PX`): 6 zakładek,
    panel 01 widoczny domyślnie; klik zakładki N przełącza panel
    (tytuł, `aria-selected`); strzałki ←→ przenoszą fokus i wybór;
    karta CTA panelu → `/realizacje/`; przycisk `pr` →
    `/proces-wspolpracy/`; karuzela niewidoczna.
  - mobile: 3 kafle + kafel „zobacz pełną ofertę" (wszystkie →
    `/kategorie/`); tor ma `data-lenis-prevent-horizontal`
    i `scroll-snap-stop: always` (asercja atrybutów/CSS); przewinięcie
    toru przesuwa wypełnienie paska; zakładki niewidoczne.
- **E2E — nowy `tests/e2e/kategorie.spec.ts`**:
  - desktop: `goto /kategorie/` ląduje na `/oferta/` (jawny test
    mechanizmu z Etapu 0 — dotąd pokrywany pośrednio).
  - mobile: 6 kafli; tap otwiera sheet właściwej kategorii (tytuł
    z treści), fokus wchodzi do dialogu; Esc zamyka i oddaje fokus
    kaflowi; X i scrim zamykają; swipe-down po `data-overlay-drag`
    zamyka (wzorzec z navigation.spec 4.1); `dt-more` →
    `/realizacje/`, stopka karty → `/kontakt/`, CTA `kt-cta` →
    `/kontakt/`.
  - a11y/SEO/smoke/navigation — **bez zmian speców**; nowe widoki
    muszą przejść pustą allowlistę axe (stąd D-OK7).
- **Visual**: nowy `tests/visual/oferta.spec.ts` — zrzuty sekcji po
  `prepareSweep` (freeze zatrzymuje marquee): head+zakładki+panel 01
  (desktop) / head+karuzela (mobile), `mq` (desktop), `pr`; dodatkowo
  panel innej zakładki (np. 05) tylko na `chromium-1920` (stan po
  przełączeniu, bez mnożenia baseline'ów). Nowy
  `tests/visual/kategorie.spec.ts` — TYLKO profile mobile (desktop
  redirectuje): head, lista, `kt-cta`, otwarty sheet kategorii 01.
  Istniejące komplety (home, chrome, work, contact) nietknięte —
  chrome bez zmian. Święta kolejność: kod → workflow linux z brancha
  PR → `git pull` → lokalny `pnpm test:visual:update` → commit darwin
  NA KOŃCU.

## 6. Ryzyka i weryfikacja na fizycznym telefonie

> **Korekty po testach Mateusza (2026-07-31, przed PR-em):**
>
> 1. Wariant niskiego desktopu (≥1024, wysokość ≤820 px) przebudowany —
>    eksportowy układ „spece i CTA pod zdjęciem 16/11" nie mieścił się
>    w viewporcie. Teraz: karta CTA w prawej kolumnie pod opisem (dolna
>    krawędź = dół zdjęcia; celowy duplikat karty w DOM — warianty
>    `--side`/`--wide`, widoczny zawsze jeden), spece pełną szerokością
>    pod spodem, a wiersz zdjęcia ugina się z viewportem
>    (`grid-template-rows: 1fr auto`) aż do **min. 180 px** wysokości
>    zdjęcia — poniżej naturalny scroll (ogranicznikiem staje się
>    kolumna tekstu). Karta CTA dodatkowo rośnie w prawo przy dłuższej
>    etykiecie (`width: fit-content` + `nowrap`; dawny `max-width` =
>    dzisiejszy `min-width`) zamiast zawijać tekst.
> 2. Kafle KONKRETNYCH kategorii w karuzeli mobile /oferta/ dostały
>    deep-link `/kategorie/#<slug>` — wejście z hashem otwiera od razu
>    kartę tej kategorii (kategorie.ts czeka pętlą rAF na overlay.ts;
>    na desktopie hash ginie w redirectcie). „Zobacz pełną ofertę"
>    zostaje bez hasha (sama lista). To korekta D-OK3 („bez deep-linku")
>    — decyzja Mateusza po testach; deep-link FILTRA realizacji (D-OK6)
>    to nadal osobna sprawa części 4.4.

- **Karuzela oferty na dotyku**: snap kafli (`scroll-snap-stop:
  always` — kafel po kaflu), płynność paska postępu — do sprawdzenia
  na telefonie.
- **Karta kategorii (sheet 96svh)**: swipe-down za grab-handle,
  scroll treści wewnątrz sheeta (czy nie „ucieka" pod spód), stopka
  CTA nad zwijanym toolbarem iOS Safari (safe-area), otwarcie/
  zamknięcie bez klatkowania na Androidzie (warstwy GPU: blur tła
  `kt-cta` + sheet).
- **Zakładki desktop**: restart animacji CSS przy szybkim
  przeklikiwaniu (keyframes na `display` — sprawdzam w e2e, że
  treść zawsze osiąga stan końcowy; reduce wyłącza).
- **LHCI**: lighthouse mierzy stronę główną — /oferta/ nie wchodzi do
  pomiaru, ale weryfikuję konfigurację (`lighthouserc*`) przy
  implementacji; nowe assety nie dotykają strony głównej.
- Emulacja nie wykryje: dotykowy snap, swipe-down, limit warstw GPU —
  po implementacji wskażę listę do testu na telefonie.

## 7. Definition of done (kontekst wspólny)

Mini-analiza + wpis w `docs/README.md`; zielone `typecheck`, `lint`,
`test:unit`, `test:e2e` (6 profili), `test:visual`; oba komplety
baseline'ów w PR (święta kolejność); allowlista axe pusta; breakpoint
1024 (stała + `@media` w parze); sługi/kontrakt CMS nietknięte;
PR zielony na `quality`+`e2e`+`lighthouse`; po merge'u prod-smoke;
aktualizacja CLAUDE.md (4.3 + numer PR-a).
