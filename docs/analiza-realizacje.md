# Analiza — /realizacje/ (Etap 4, część 4.4)

Port podstrony realizacji na design delung: szyna filtrów kategorii,
siatka kafli z Content Collections, detal = Modal (desktop) / BottomSheet
(mobile) z galerią zdjęć i wideo. Cel jak w 4.1–4.3: wygląd i zachowanie
**1:1 z eksportem** `docs/design/realizacje.html`; przejściowy ciemny
widok (`WorkIndexPage` na `legacy-dark.css`) znika w całości.

Referencje: `docs/design/realizacje.html`, `docs/analiza-chrome-globalny.md`
(D-CH5, D-CH9), `docs/analiza-strona-glowna.md` (D-SG6 — świadome
odroczenie progu detalu), `docs/analiza-oferta-kategorie.md` (D-OK5 —
wzorzec sheetów na `overlay.ts`, D-OK6 — odroczony deep-link filtra),
`.claude/rules/cms-realizacje.md`, `.claude/rules/sections.md`,
`.claude/rules/testing.md`.

## 1. Co mówi eksport (anatomia widoku)

**Strona** (navbar `plain` — dzisiejszy wariant):

| Blok | Mobile (<1024) | Desktop (≥1024) |
| --- | --- | --- |
| `re` | head (kicker REALIZACJE / h1 „Nasze realizacje" / linia / lead) + **pozioma szyna filtrów** (sticky przy scrollu, hairline pod spodem) + siatka 1-kolumnowa kafli | dwie kolumny: lewa **sticky** (kicker zielony, h1, lead, **pionowa lista filtrów z licznikami** `NN`, karta „SZUKASZ CZEGOŚ PODOBNEGO?" z telefonem) / prawa: pasek `re-bar` („WSZYSTKIE KATEGORIE · 10 Z 24" + „NAJNOWSZE") i **siatka 2-kolumnowa** |
| kafel `tile` | ramka hairline, zdjęcie 1.034 z parallaxem ±70 px (rAF), tag kategorii na scrimie, tytuł, stopka „ZOBACZ SZCZEGÓŁY REALIZACJI" + kółko-lupka | bez ramki, zdjęcie 1.384 (hover: zoom 1.06 + lupka w rogu), tytuł, „Zobacz szczegóły" |
| `re-empty` | stan pusty filtra („BRAK REALIZACJI" + reset) — w makiecie osiągalny, u nas nie (niżej D-R1) | jak mobile |
| `re-more` | brak | „Pokaż więcej realizacji" (paginacja makiety — niżej D-R1) |
| `re-cta` | tło `#eae5dd`, h2 „Masz pomysł na własne wnętrze?", przycisk-pigułka → kontakt | tło cream, h2 + akapit obok przycisku |

**Detal `dt`** — w eksporcie to **JEDEN element**, restylowany per
breakpoint (nie dwa osobne):

- Mobile: bottom sheet 96dvh (grab-handle z przeciąganiem >90 px,
  scrim, Esc; **bez przycisku X** — `dt-head` ukryty, a `dt-xm`
  wyłączony inline'owo). Jeden strumień scrolla: meta (tag) → h2 →
  **galeria** (karuzela pozioma snap, kadry 330/412) → licznik
  „— 01 / 04" → O PROJEKCIE → specyfikacja → przyklejona stopka-gradient
  z CTA „Zapytaj o wycenę" → kontakt.
- Desktop: modal 1200×740 wyśrodkowany; lewa połowa = galeria
  (przełączanie `translateX`, strzałki, kreski-dashes, licznik,
  gradient dołem), prawa = scroll treści: pasek „REALIZACJA 01 / 10" +
  X, meta (tag zielony · rok), h2, opis, spece w wierszach
  (label zielony / wartość), CTA wyceny + link „Zobacz więcej
  z kategorii X" (ustawia filtr i zamyka). Po bokach viewportu
  **projnav**: strzałki poprzednia/następna realizacja (pętla po
  przefiltrowanej liście, crossfade).
- Wideo w galerii: kafel z posterem + **badge play** (kółko) +
  **czas trwania** (`dt-time` — tylko desktop; mobile ukryty).
- Galeria zmienia miejsce w DOM per breakpoint (`placeGal`):
  mobile — wewnątrz `dt-body` (scrolluje z treścią), desktop — dzieckiem
  `dt` (osobna kolumna).

Dane w makiecie to tablica `PROJEKTY` (tag/year/title/desc/shots/specs) —
1:1 z naszym schematem CMS z Etapu 2 (docelowym; **zmiana schematu NIE
jest potrzebna**, trzy miejsca nietknięte).

## 2. Decyzje portu

### D-R1. Filtry: SSR wszystkich kafli + filtrowanie klasą; puste kategorie ukryte; bez paginacji

Siatka renderuje w SSR **wszystkie** wpisy kolekcji (wg `order`);
filtrowanie = przełączanie `hidden` na kaflach w JS (funkcjonalny skrypt
ładowany zawsze). Szyna = „Wszystkie" + **wyłącznie kategorie mające
wpisy** (instrukcja: puste ukryte, żadnych „(0)") — lista i liczniki
policzone w build time; pure-helper `workRail(entries)` w
`work-data.ts` + unit test (kategoria bez wpisów znika, kolejność wg
`CATEGORIES`, liczniki się zgadzają). Filtry to `<button aria-pressed>`
(nie linki-atrapy `href="#"` z makiety). Bez JS: pełna siatka, szyna
bezczynna (jak w eksporcie, który bez JS nie renderuje niczego — my
lepiej: treść jest w SSR).

Konsekwencje świadome:

1. **`re-empty` nie wchodzi** — skoro puste kategorie nie mają przycisku
   filtra, stan „brak realizacji w kategorii" jest nieosiągalny
   (deep-link na pustą kategorię → fallback „Wszystkie", D-R2).
2. **`re-more` (paginacja makiety) nie wchodzi** — pokazujemy komplet
   wpisów (dziś 5). Paginacja to osobna decyzja, gdy portfolio urośnie;
   odnotowuję jako przyszły temat, nie buduję na zapas.
3. `re-bar`: etykieta „`KATEGORIA` · N Z M" gdzie N = widoczne,
   M = wszystkie wpisy (SSR: „WSZYSTKIE KATEGORIE · 05 Z 05");
   „NAJNOWSZE" zostaje statycznym napisem 1:1 z designem (sort i tak
   jest po `order` — chevron to dekoracja, `aria-hidden`).

### D-R2. Deep-link filtra: `#<slug>` — domknięcie D-OK6 (TAK dla deep-linku)

Wzorzec hasha z `/kategorie/` (4.3): **`/realizacje/#<slug>`** ustawia
filtr na wejściu. Hash czyta własny, zawsze ładowany skrypt strony (bez
pętli rAF — filtrowanie to nasz moduł, nie zależy od `overlay.ts`); slug
nie jest id żadnego elementu → przeglądarka nie scrolluje. Slug spoza
szyny (kategoria bez wpisów, literówka) → fallback „Wszystkie".

W tym samym PR podpinam nadawców (dokładnie jak zapowiadało D-OK6):

- karta CTA panelu `/oferta/` (`of-ctaCard`, oba warianty
  `--side`/`--wide`) → `/realizacje/#<slug>`,
- link `dt-more` w kartach kategorii `/kategorie/` →
  `/realizacje/#<slug>`,
- link „Zobacz więcej z kategorii X" w detalu realizacji (D-R5).

### D-R3. Detal: JEDEN overlay `#work-detail` (CSS modal↔sheet przy 1024) — `sheetMQ` znika

Eksport ma jeden element `dt` restylowany per breakpoint — portuję to
wprost: **jeden overlay** `#work-detail` na `overlay.ts`
(`data-overlay-kind="sheet"`, `data-overlay-panel`, `data-overlay-drag`
na grab-handle, `data-lenis-prevent`), poniżej 1024 wyglądający jak
bottom sheet, od 1024 jak modal. Mechanizm treści zostaje **szablonowy**
(`<template data-work-detail="slug">` + host + klon przy otwarciu —
kontrakt `openWorkDetail(slug, name)` bez zmian dla strony głównej):

- to domyka odroczenie D-SG6: **próg 760 znika razem ze stałą
  `sheetMQ`** — wybór modal↔sheet przestaje istnieć w JS, jest czystym
  CSS przy 1024 (stała `WORK_DESKTOP_MIN_PX = 1024` w `work-config.ts`
  + `@media` w parze; importują testy);
- klon per otwarcie (a nie 24 pre-renderowane overlaye jak w D-OK5),
  bo treść jest **dynamiczna z CMS i rośnie**, a projnav (D-R5)
  przełącza projekty w obrębie otwartej nakładki — z pre-renderem
  close+open migałoby animacjami; kategorie miały 6 statycznych kart
  bez nawigacji między nimi — inny przypadek;
- grab-handle: drag działa tylko na mobile jak w eksporcie
  (`dt-grab` ukryty od 1024 — `overlay.ts` nie ma czego łapać);
- zamykanie: mobile = swipe-down/scrim/Esc (**bez X — 1:1 z eksportem**;
  karta /kategorie/ ma X, bo ma go jej design), desktop = X w
  `dt-head`/scrim/Esc;
- zmiana progu przy otwartym detalu → **zamknięcie** (reguła
  sections.md; jeden `matchMedia` zamiast dzisiejszego podwójnego
  `close("work-modal")+close("work-sheet")`);
- galeria per breakpoint (`placeGal` eksportu): przy klonowaniu wstawiam
  ją we właściwe miejsce wg bieżącego progu — a że zmiana progu zamyka
  nakładkę, nie ma stanu pośredniego do przenoszenia „na żywo";
- `WorkDetail.astro` przepisany na markup `dt-*` designu;
  `ui/Modal.astro` + `ui/BottomSheet.astro` tracą ostatnich konsumentów
  (strona główna przechodzi na ten sam `#work-detail`) → **kasuję oba**
  (+ `CloseIcon`, jeśli osieroci się po kasacji — sprawdzi typecheck);
  hosty `#work-modal`/`#work-sheet` znikają z obu stron.

### D-R4. Galeria detalu: snap-karuzela (mobile) / translateX + strzałki (desktop); wideo na tap

- **Zdjęcia przez `imgAt(image, "full")`** (poster wideo tak samo —
  obraz z tej samej pozycji galerii, reguła cms-realizacje). `imgAt`
  zostaje NIETKNIĘTY (960 px na start wystarcza; ewentualny większy
  wariant pod modal DPR2 = osobna, świadoma decyzja po obejrzeniu
  produkcji — odnotowuję, nie zmieniam w tym PR). Wymiary jawne
  (aspect-ratio z designu), `loading="lazy"` + `decoding="async"` —
  szablon w `<template>` i tak nie pobiera niczego do klonowania.
- Mobile: tor `overflow-x` + `scroll-snap` z gotchas sections.md
  (`data-lenis-prevent-horizontal`, `scroll-snap-stop: always`);
  licznik „— 01 / 0N" aktualizowany ze scrolla toru (pasywnie).
- Desktop: `translateX(-si*100%)` + strzałki prev/next (wygaszane na
  krańcach jak w eksporcie) + dashes + licznik.
- **Wideo** (instrukcja, wzorzec spike'a):
  `<video preload="none" poster={imgAt(image,"full")} playsinline
  controls>` + `src` wprost z R2 (bez transformacji). Badge play
  (przycisk na kaflu) → `video.play()` i schowanie badge'a; dalej
  steruje natywny `controls`. `dt-time` (duration z CMS) na badge'u
  desktop, mobile ukryty — 1:1 z designem. Na zrzutach visual wideo
  ZAWSZE pod maską (testing.md); odtworzenie testuję funkcjonalnie
  w e2e (D-R9).

### D-R5. Projnav + „REALIZACJA NN / NN" + „Zobacz więcej z kategorii": kontekst listy

Detal zna **listę kontekstu** (sluggi w kolejności): na `/realizacje/`
to aktualnie przefiltrowany zbiór (aktualizowany przy zmianie filtra),
na stronie głównej — 3 wpisy zajawki. `open-detail.ts` dostaje
`setDetailContext(slugs)` — strzałki projnav (desktop, pętla z crossfade
jak w eksporcie) i licznik `dt-head` czytają z niego; podmiana projektu
= podmiana klonu w hoście (bez zamykania nakładki).

Link „Zobacz więcej z kategorii X" (`dt-more`, desktop): zawsze
`<a href="/realizacje/#<slug>">`; na `/realizacje/` skrypt strony
przechwytuje klik → ustawia filtr + zamyka detal (zachowanie eksportu),
na stronie głównej to zwykła nawigacja na przefiltrowaną podstronę
(deep-link D-R2 robi resztę). CTA `dt-ask` → `/kontakt/`.

### D-R6. Skrypty: funkcjonalne zawsze, ruch za bramką; 1024 w parze

- `work-config.ts`: **`WORK_DESKTOP_MIN_PX = 1024`** (importują testy);
  wszystkie `@media` nowych komponentów na 1024 — koniec progów 760/761
  w widoku (ostatni konsument breakpointu szablonu w work znika).
- Funkcjonalne (ładowane zawsze): filtry + deep-link + `re-bar`
  (skrypt strony), `open-detail.ts` (klon, galeria, wideo, projnav,
  domknięcie przy zmianie progu).
- Ruch (dynamiczny import przy `no-preference`, wzorzec 4.2/4.3 —
  `work-motion.ts`): reveale `[data-rev]` (IO) + parallax kadrów kafli
  ±70 px na mobile (rAF, 1:1 z eksportem; stan bez JS = statyczny kadr
  z offsetem CSS). Animacji `data-words`/GSAP nie portuję — spójnie
  z 4.2/4.3 (reveal zamiast word-split); bez JS/przy reduce strona
  w pełni statyczna.
- Nawigacja klawiaturą w galerii: strzałki to `<button>` z
  `aria-label` (eksportowe `<a href="#">` → przyciski, jak filtry).

### D-R7. Sticky: szyna mobile i head desktop POD paskiem (`--hdr-h`)

Eksport przykleja mobilną szynę na `top:0`, gdzie chowa się pod sticky
navbar (z-index 30 vs 3) — to wada makiety, nie wzorzec. Szyna dostaje
`top: var(--hdr-h, 74px)` (zmienną dostarcza navbar 4.1); desktopowy
`re-head` analogicznie (eksport używa tam zresztą wysokości paska
`clamp(70…92)` — czyli intencja jest jasna). Odnotowana dewiacja-fix.

### D-R8. Kontrasty pod pustą allowlistę axe (wzorzec D-OK7)

1. Kickery/drobiazgi na bieli: `re-kick` rgba(.5) i desktopowy
   `re-kick`/`dt-tag`/`dt-spec b` w `--gr` (~4.0:1) → `--accent-ink`;
   alpha .45–.55 (`re-bar`, `tile-cta`, `dt-tag` mobile, `dt-about-h`,
   liczniki, `dt-ask-k` na ciemnym — do odpowiednio min. `--faint` 0.64
   / rgba(255,255,255,.7)).
2. Teksty na zdjęciach (`tile-tag`): scrim gradientowy + text-shadow
   eksportu zostają (axe nie liczy na obrazach; czytelność).
3. Hierarchia rozmiarem/wagą, nie kontrastem — jak w 4.1–4.3.

### D-R9. Porządki

- `WorkIndexPage.astro` przepisany (markup `re-*`); **import
  `legacy-dark.css` usunięty** (lekcja 1 — zostaje tylko polityka
  i kontakt do 4.5/Etapu 5); `AmbientBackground` znika z realizacji
  (zostaje u pozostałych konsumentów); karta telefonu `re-phone`
  i tel w chrome — antyscraping D-CH5 (slot `[data-slot]`,
  `fillContactSlots` z navbara pokrywa całą stronę).
- `WorkIndexCard.astro` przepisany na `tile` (przycisk otwierający
  dialog — `aria-haspopup="dialog"`, kontrakty `data-work-slug`/`-name`
  zostają).
- `ui.ts`: `workPage.title`/`description` ZOSTAJĄ (meta docelowe,
  asertują je specy seo/work-index); osierocone klucze detalu
  (`work.gallery`/`work.specs`/`work.close`…) sprzątam wg typechecka.
- `sections.md` (reguła detalu) aktualizuję: jeden overlay, próg 1024,
  zamknięcie przy zmianie progu — bez zmiany ducha reguły.
- Sitemap/canonical/meta bez zmian. LHCI mierzy tylko stronę główną —
  bez wpływu; sprawdzam wynik `lighthouse` w PR rutynowo.
- Niezacommitowana aktualizacja CLAUDE.md (stan po 4.3) z working tree
  wchodzi do pierwszego commita na feature branchu
  `feat/etap-4-4-realizacje`.

## 3. Kontrakty selektorów i testów

| Kontrakt | Los |
| --- | --- |
| `main h1` (smoke, navigation) | spełnia `re-head h1` |
| `data-work-slug` / `data-work-name` na kaflach | **zostają** (siatka + zajawka home) |
| `#work-modal` / `#work-sheet` | **zastąpione** jednym `#work-detail` (`data-overlay`) — adaptacja work.spec/work-index.spec |
| `.wdx__title` itd. | **zastąpione** selektorami designu (`.dt-txt h2`, `.dt-tag`, `.dt-spec`) |
| `.wix-grid` / `.wix-*` | **zastąpione** `re-grid`/`tile` (adaptacja speców, w tym dojścia ze strony głównej) |
| `a[data-work-more]` na `/` | zostaje (bez zmian) |
| sticky pasek na `/realizacje/` (navigation.spec) | bez zmian speca |
| `WORK_DESKTOP_MIN_PX` | nowa stała importowana przez testy |
| nowe | `[data-rail]` + `button[aria-pressed]`, `[data-gridlabel]`, `#work-detail`, `[data-overlay-drag]`, `[data-track]`, `[data-prevshot]`/`[data-nextshot]`/`[data-dashes]`/`[data-shotcount]`, `[data-prevproj]`/`[data-nextproj]`, `[data-video-play]`, `.dt-ask`, `.dt-more` |

## 4. Plan implementacji

1. `work-config.ts` (stała 1024) + `workRail()` w `work-data.ts`
   + unit test (D-R1).
2. `WorkIndexCard.astro` → `tile`; `WorkDetail.astro` → markup `dt-*`;
   nowy `WorkDetailOverlay.astro` (chrome nakładki `#work-detail`:
   grab, galeria-rama, dt-head, projnav) współdzielony przez
   `/realizacje/` i home.
3. `WorkIndexPage.astro` przepisany (head+rail+bar+grid+cta, skrypt
   filtrów/deep-linku); `open-detail.ts` przepisany (D-R3/D-R4/D-R5);
   `work-motion.ts` (D-R6); kasacja `ui/Modal.astro`,
   `ui/BottomSheet.astro` (+`CloseIcon` jeśli osierocony).
4. `HomeRealizacje.astro`: hosty Modal/BottomSheet → `#work-detail`
   (sekcja `.re` strony głównej NIETKNIĘTA wizualnie — baseline'y home
   bez zmian).
5. Deep-linki nadawców: `of-ctaCard` (oba warianty) i `dt-more`
   kart `/kategorie/` → `/realizacje/#<slug>` (D-R2).
6. Adaptacja speców e2e + nowe testy (niżej); nowy spec visual;
   aktualizacja `sections.md`; lokalnie pełna bramka (`typecheck`,
   `lint`, `test:unit`, `test:e2e`, `build` + `test:visual`).
7. Baseline'y w świętej kolejności; PR `feat/etap-4-4-realizacje`
   (pierwszy commit zabiera czekającą aktualizację CLAUDE.md z 4.3).

## 5. Testy

- **Unit**: `workRail()` (kategorie z wpisami, kolejność, liczniki);
  kontrakt CMS bez zmian.
- **E2E — `work-index.spec.ts` (adaptacja + rozbudowa)**:
  - meta/canonical/tytuł — bez zmian logiki; siatka pokazuje wszystkie
    wpisy (`.re-grid [data-work-slug]`), scroll natywny, navbar/stopka —
    selektory designu;
  - filtry: szyna = „Wszystkie" + tylko kategorie z wpisami (liczność
    z plików JSON jak `ENTRY_COUNT`); klik filtra chowa obce kafle
    i aktualizuje `[data-gridlabel]`; „Wszystkie" przywraca; deep-link
    `/realizacje/#<slug>` startuje przefiltrowany; zły slug → pełna
    siatka;
  - detal desktop: klik kafla → `#work-detail` widoczny (układ modala),
    tytuł/tag/rok/opis/spece z wpisu; strzałki galerii przełączają
    (licznik, dashes); projnav przechodzi do następnej realizacji
    w obrębie filtra; `dt-more` ustawia filtr i zamyka; X i Esc
    zamykają, host czyszczony;
  - detal mobile: tap → sheet; licznik galerii po przewinięciu toru;
    swipe-down po `[data-overlay-drag]` zamyka (wzorzec z 4.1/4.3);
    scrim zamyka; atrybuty toru (`data-lenis-prevent-horizontal`,
    `scroll-snap-stop`);
  - **wideo funkcjonalnie**: wpis z `video` (czytany z JSON-ów jak
    `ENTRY_COUNT`); slajd ma `<video preload="none" playsinline
    controls>` z posterem `imgAt`; tap w badge → badge znika,
    `video.paused === false` (bez sieci — `play()` przestawia stan
    natychmiast; media R2 poza ścieżką PR zgodnie z testing.md);
    `dt-time` widoczny na desktopie;
  - dojście ze strony głównej (`data-work-more`) — asercja lądowania
    na `.re-grid` zamiast `.wix-grid`.
- **E2E — `work.spec.ts` (home, adaptacja)**: id `#work-detail`,
  selektory `dt-*`; mechanika (klik w stos/kartę, ×/Esc, czyszczenie
  hosta) bez zmian logiki.
- a11y/SEO/smoke/navigation — **bez zmian speców**; nowy widok musi
  przejść pustą allowlistę axe (stąd D-R8).
- **Visual — `tests/visual/work-index.spec.ts` przepisany**: po
  `prepareSweep` (freeze zatrzymuje przejścia): góra strony (head+szyna
  / kolumna sticky), siatka, `re-cta`, stopka; **detal otwarty**:
  profile mobile = sheet (galeria na pierwszym slajdzie), chromium-1920
  = modal; slajd wideo TYLKO na chromium-1920 z **maską na `<video>`**
  (klatka = loteria, testing.md). Baseline'y home/oferta/kategorie/
  chrome NIETKNIĘTE (zmiany w work nie dotykają ich markup'u; overlay
  strony głównej jest ukryty na zrzutach). Święta kolejność: kod →
  workflow linux z brancha PR → `git pull` → lokalny
  `pnpm test:visual:update` → commit darwin NA KOŃCU.

## 6. Ryzyka i weryfikacja na fizycznym telefonie

> **Korekty Mateusza po pierwszych testach 4.4 (2026-08-01, przed
> baseline'ami):**
>
> 1. **Projnav bez crossfade'u**: przy „następna realizacja" cały modal
>    ODJEŻDŻA za lewą krawędź ekranu, a nowy wjeżdża zza prawej (przy
>    „poprzednia" lustrzanie) — inline transition na panelu
>    w `stepProject` (`translate(calc(-50% ± 100vw), -50%)`), guard
>    `swapping` na szybkie przeklikiwanie, reduce = natychmiastowa
>    podmiana.
> 2. **X na sheecie detalu** (`.dt-xm` w chrome overlaya) — zamykanie
>    identyczne jak karty kategorii 4.3 (uchylenie decyzji „mobile bez X
>    z eksportu" z D-R3).
> 3. **Podgląd pełnoekranowy galerii** (`[data-lightbox]` w chrome
>    `#work-detail`, slajdy = klony kadrów budowane w `open-detail.ts`):
>    tap/klik w KAŻDY kadr (zdjęcie i wideo) otwiera pełny ekran od tego
>    kadru; kadr trzyma format galerii (330/412) na czarnym tle (pion →
>    pasy góra/dół, poziom → pasy po bokach). Mobile: swipe (snap-tor),
>    licznik na czarnym pasie (pion: pod dolną krawędzią kadru przy
>    lewej krawędzi ekranu — `min(50svh, 100vw·412/660)`; poziom: lewy
>    dolny róg), chevron-wstecz w lewym górnym rogu. Desktop: pasek jak
>    galbar modala (strzałki = przejazd toru w lewo/prawo, dashes,
>    licznik), X w prawym górnym rogu, Esc zamyka TYLKO podgląd
>    (listener capture ubiega overlay.ts). Wyjście wraca na kadr
>    oglądany w podglądzie (synchronizacja `shot`). Podgląd nosi
>    `data-overlay-panel`, żeby delegacja overlay.ts nie uznała kliknięć
>    za „klik w tło".
> 4. **Wideo bez własnego znaku play i bez `controls`** (druga korekta):
>    w rogu kadru mała ikonka kamery (`[data-cam]`); tap/klik w kadr
>    wideo w galerii NAJPIERW startuje film, a podgląd pełnoekranowy
>    pokazuje już grający klip; w podglądzie tap = pauza↔play (ikonka
>    kamery wraca przy pauzie — zdarzenia play/pause na klonie).
>    Ewentualny znak play może dorysować wyłącznie sama przeglądarka.
> 5. **Swipe-down zamyka podgląd** (mobile): pion jest wolny (tor
>    przewija tylko poziomo, `touch-action: pan-x`), podgląd podąża za
>    palcem, próg 100 px; tap kończący gest nie liczy się jako
>    kliknięcie.
> 6. Fokus przy otwarciu podglądu idzie na kontener (`tabindex="-1"`),
>    nie na chevron — iOS rysował pierścień na programowo fokusowanym
>    przycisku.
> 7. Pasek nad siatką (desktop) BEZ atrapy sortowania „NAJNOWSZE" +
>    chevron z makiety (uchylenie D-R1 pkt 3) — sortowania nie ma,
>    została sama etykieta „KATEGORIA · NN Z NN".

- **Sheet detalu na dotyku**: swipe-down za grab (próg/flick), scroll
  treści wewnątrz `dt-body` (czy nie „ucieka" pod spód / nie łapie go
  gest), stopka-gradient CTA nad zwijanym toolbarem iOS (safe-area).
- **Karuzela galerii**: snap kafel-po-kaflu (`scroll-snap-stop:
  always`), licznik nadąża, brak konfliktu ze swipe-down grab-handle'a
  (gest startuje TYLKO z grab — tor przewija się swobodnie).
- **Wideo na tap przy iOS Low Power Mode**: `play()` z gestu ma ruszyć
  (preload=none + poster; LPM blokuje autoplay, nie tap) — sprawdzić
  realny plik z R2 na telefonie.
- **Warstwy GPU Androida**: otwarcie/zamknięcie sheeta nad siatką
  z parallaxem kafli — czy nie klatkuje.
- **Modal desktop**: crossfade projnav przy szybkim przeklikiwaniu;
  strzałki na krańcach.
- Emulacja nie wykryje: dotykowego snapu, swipe-down, LPM, limitu
  warstw — po implementacji wskażę listę do testu na telefonie.

## 7. Definition of done (kontekst wspólny)

Mini-analiza + wpis w `docs/README.md`; zielone `typecheck`, `lint`,
`test:unit`, `test:e2e` (6 profili), `test:visual`; oba komplety
baseline'ów w PR (święta kolejność); allowlista axe pusta; breakpoint
1024 (stała + `@media` w parze) i `sheetMQ`/760 usunięte; import
`legacy-dark.css` usunięty z widoku; schemat CMS nietknięty; PR zielony
na `quality`+`e2e`+`lighthouse`; po merge'u prod-smoke; aktualizacja
CLAUDE.md (4.4 + numer PR-a).
