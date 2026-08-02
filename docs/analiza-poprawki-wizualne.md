# Runda poprawek po testach klienckich (przed Etapem 6)

Status: **plan zaakceptowany do implementacji** (data: 2026-08-02).
Zakres: 6 poprawek zgłoszonych przez Mateusza po przeklikaniu gotowej
strony (wszystkie 8 widoków stoi na designie delung, Etapy 0–5 zamknięte).
Poprawki są **generalne** — dotykają strony głównej, `/oferta/`,
`/kategorie/` i `/o-nas/` naraz, dlatego trafiają do wspólnego dokumentu
zamiast do analiz per widok. Decyzje, które zmieniają wcześniejsze
ustalenia Etapu 4, są tu opisane jako **KOREKTA D-…** i zdublowane
dopiskiem w odpowiedniej analizie.

Numeracja decyzji: **D-P1 … D-P6** (P = poprawki).

---

## 1. Co zgłosił Mateusz (lista wejściowa)

| # | Zgłoszenie | Widok / próg |
| - | ---------- | ------------ |
| 1 | Klik w kafel konkretnej kategorii na stronie głównej wchodzi na `/oferta/`, ale zawsze z pierwszą zakładką („Kuchnie i sprzęt AGD") | home, desktop |
| 2 | Tap w kafel kategorii na stronie głównej przenosi na `/oferta/` — ma otwierać bottom sheet **w miejscu** | home, mobile |
| 3 | Tap w kafel kategorii na `/oferta/` przenosi na `/kategorie/` — ma otwierać bottom sheet **w miejscu** | `/oferta/`, mobile |
| 4 | Button „Sprawdź ofertę" na hoverze robi się przezroczysty (widać kafle pod spodem — najbardziej na niskich ekranach, gdzie CTA nachodzi na tor) | home, desktop |
| 5 | Brak przycisku do `/proces-wspolpracy/` w sekcji procesu | home, desktop |
| 6 | Linki „Zobacz więcej opinii w Google" prowadzą pod zwykłe wyszukiwanie, nie pod panel opinii firmy | home + `/o-nas/`, oba progi |

Reguła nadrzędna zgłoszenia 2+3 (słowa Mateusza): **tap w jakikolwiek
kafel symbolizujący kategorię oferty na mobile nie przekierowuje —
otwiera kartę kategorii na stronie, na której użytkownik właśnie jest.**

## 2. Stan zastany (co pokazał kod)

- `HomeOferta.astro` — 6 kafli z lokalnej tablicy `KAFLE` (treści
  marketingowe eksportu, D-SG4), **wszystkie** linkują gołe
  `OFERTA_PATH`, bez sluga. Kafle nie znają slugów `categories.ts`.
- `OfertaSection.astro:161` — kafel karuzeli mobile linkuje
  `/kategorie/#<slug>` (korekta D-OK3 po testach 4.3); hash otwiera
  kartę już na `/kategorie/` (`kategorie.ts`).
- Karty kategorii = 6 pre-renderowanych sheetów `#kat-<slug>` (D-OK5)
  żyją **wyłącznie** w `KategorieSection.astro` (markup + ~300 linii
  stylów `.dt-*`, wyraźnie odseparowanych od stylów listy `.kt-*`).
- `HomeOferta.astro:403` — `.of-cta :global(.btn-dark:hover)
  { background: rgba(26,26,26,.05) }`. Baza kafla CTA na desktopie to
  `#fff`; hover **zastępuje** białe tło 5-procentową czernią, czyli
  półprzezroczystym wypełnieniem — stąd prześwitujące kafle. To nie jest
  efekt „niskiego ekranu", tylko zawsze; na niskim ekranie CTA
  (`position: absolute`, prawy dolny róg sceny przypiętej) po prostu
  nachodzi na tor kafli i widać to gołym okiem.
- `HomeProces.astro:382` — `.pr-cta { display: none }` na desktopie:
  świadoma decyzja D-SG5 („za designem: desktop bez CTA, trasa żyje
  w stopce — D-CH4").
- `src/lib/opinie.ts:62` — jedna stała `OPINIE_GOOGLE_URL`
  (`https://www.google.com/search?q=Delung+Meble`), konsumenci:
  `HomeOpinie.astro:123` i `OnasOpinie.astro:129`. Link mapowy
  w kaflach `/kontakt/` prowadzi do adresu firmy — to inny cel, zostaje
  bez zmian.

---

## 3. Decyzje

### D-P1. Kanoniczny deep-link kategorii = `/oferta/#<slug>`

Jeden adres na kategorię, działający na obu progach:

- **desktop** (≥1024): `oferta.ts` czyta hash na starcie i zaznacza
  odpowiednią zakładkę **bez** klasy `.anim` (pierwszy render zostaje
  statyczny — kontrakt D-OK2: animacja przełączenia dopiero od
  pierwszej interakcji). Zły/pusty slug → panel 01, jak dziś. Strona
  **nie przewija** do zakładek (decyzja Mateusza) — nagłówek „Co
  tworzymy?" zostaje w kadrze, panel jest gotowy niżej. Wzorzec 1:1 jak
  deep-link filtra `/realizacje/#<slug>` (D-R2).
- **mobile** (<1024): ten sam hash otwiera kartę kategorii jako sheet
  (patrz D-P2), więc adres skopiowany z desktopu działa na telefonie.

Hash niesie goły slug — w dokumencie nie ma elementu o takim `id`
(zakładki to `of-tab-<slug>`, panele `of-panel-<slug>`), więc
przeglądarka niczego nie scrolluje. Ta sama zasada co w `kategorie.ts`.

**KOREKTA D-SG4**: kafle zajawki oferty przestają linkować gołą
`/oferta/` — każdy dostaje `href="/oferta/#<slug>"`. Marketingowe treści
kafli (podpisy „Zabudowa + AGD" itd.) i `categories.ts` bez zmian.

Żeby kafel wiedział, którą kategorię reprezentuje, tablica `KAFLE`
wyjeżdża z frontmatteru do `home-oferta-content.ts` (czyste dane +
`slug`), a mapowanie slug → obraz zostaje w `.astro` (wzorzec
`oferta-content.ts` + `oferta-images.ts` z 4.3). Zysk: **unit test
kontraktu** — każdy slug kafla istnieje w `categories.ts` i ma treść
w `OFERTA_CATEGORIES` (czyli deep-link zawsze trafia w istniejącą
zakładkę i istniejący sheet).

### D-P2. Karty kategorii dostępne na trzech stronach (sheet w miejscu)

Sheety `#kat-<slug>` przestają być własnością `/kategorie/`. Markup
i style `.dt-*` wyjeżdżają z `KategorieSection.astro` do nowego
`KategorieSheets.astro` (czysty blok 6 overlayów, zero treści listy),
który renderują **trzy** strony: `KategoriePage`, `Home`, `OfertaPage`.

Na mobile klik w kafel kategorii jest przechwytywany
(`preventDefault`) i otwiera sheet lokalnie; na desktopie handler nie
robi nic i link nawiguje normalnie (D-P1). Zapisany w markupie `href`
zostaje **fallbackiem** na wypadek braku/awarii JS — nic nie ląduje
w `onclick`-owej próżni.

Koszt: HTML + CSS sheetów na dwóch dodatkowych stronach. Zdjęcia w
środku są `loading="lazy"` w kontenerze `hidden`, więc **bajtów obrazów
nie dokładają** (przeglądarka pobiera je dopiero przy otwarciu karty).
Przyrost HTML/CSS mierzę po implementacji i raportuję Mateuszowi razem
z liczbami LHCI (budżet mobile: script 80 kB, total 1,2 MB).

**Bez wpisu w historii** (decyzja Mateusza): sheet zamykają X, scrim,
swipe-down i Esc — dokładnie jak dziś na `/kategorie/` i w detalu
realizacji. Sprzętowy „wstecz" Androida przy otwartym sheecie opuszcza
stronę; zmiana tego zachowania musiałaby objąć **wszystkie** nakładki
projektu (menu, detal realizacji, podgląd pełnoekranowy) i jest osobną
decyzją na przyszłość.

**ROZSZERZENIE D-OK5**: „6 pre-renderowanych sheetów" nie jest już
mechanizmem wyłącznie `/kategorie/` — to komponent współdzielony.
Wszystkie kontrakty `overlay.ts` (focus-trap, Esc, scrim, swipe-down,
`data-overlay-*`) i domknięcie przy przejściu na ≥1024 zostają bez zmian.

### D-P3. Kafle `/oferta/` otwierają kartę w miejscu

`OfertaSection.astro` — kafle karuzeli mobile zachowują `href`
`/kategorie/#<slug>` (fallback bez JS + niezmieniony kontrakt
`oferta.spec.ts:149`), ale skrypt przechwytuje tap i otwiera sheet na
`/oferta/`. Kafel „zobacz pełną ofertę" **nie jest kaflem kategorii** —
dalej nawiguje na `/kategorie/` (pełna lista 6 kategorii; karuzela
pokazuje 3). Tak samo CTA „Zobacz pełną ofertę" pod karuzelą na stronie
głównej dalej prowadzi na `/oferta/`.

**KOREKTA D-OK3 (korekty po testach 4.3)**: deep-link kafla przestaje
być nawigacją na `/kategorie/`, staje się otwarciem karty w miejscu.
`/kategorie/` zostaje bez zmian jako pełna lista (wejście z menu-CTA,
redirect desktopowy i canonical NIETKNIĘTE).

Wspólna mechanika trzech stron ląduje w jednym module: `kategorie.ts`
→ **`kat-sheets.ts`** (ładowany zawsze — to funkcja, nie dekoracja):

1. `[data-kat]` (przyciski listy `/kategorie/`) → otwarcie,
2. `a[data-kat-link]` (kafle home i `/oferta/`) → na mobile
   `preventDefault` + otwarcie, na desktopie nawigacja,
3. hash `#<slug>` na wejściu + na mobile → otwarcie karty,
4. przejście na ≥1024 przy otwartej karcie → zamknięcie (jak dziś).

### D-P4. Hover CTA nigdy półprzezroczysty

`.of-cta .btn-dark:hover` dostaje **nieprzezroczysty** odpowiednik
dzisiejszego przyciemnienia (5 % czerni na bieli = `#f2f2f2`), więc
przycisk zachowuje się jak zwykły button niezależnie od tego, co leży
pod nim. Przegląd reszty CTA wskazał **cztery białe pigułki leżące na
zdjęciach** — wszystkie dostają to samo wypełnienie:

| Przycisk | Było | Jest |
| -------- | ---- | ---- |
| `.of-cta .btn-dark:hover` (home, scena oferty) | `rgba(26,26,26,.05)` | `#f2f2f2` |
| `.kt-cta a:hover` (/kategorie/, CTA na rozmytym tle) | `opacity: .94` | `#f2f2f2` |
| `.pr-btn:hover` (/oferta/, CTA procesu na zdjęciu) | `opacity: .94` | `#f2f2f2` |
| `.cta-white:hover` (/proces-wspolpracy/, desktop) | `opacity: .92` | `#f2f2f2` |

**Nie ruszamy** przycisków szklanych z designu (`.hero-btn`,
`.cta-ghost`): tam półprzezroczyste tło + `backdrop-filter` to
zamierzona stylistyka, a hover je DOMYKA (0.08 → 0.18), nie rozrzedza.
Przyciski z obrysem na płaskich tłach (`.btn-out`, `.cta-out`) też
zostają — na jednolitym kolorze półprzezroczystości nie widać.

Zmiana jest niewidoczna na baseline'ach (zrzuty nie łapią hovera) i nie
rusza geometrii.

To **nie** jest zmiana układu: nachodzenie CTA na tor kafli przy niskim
ekranie zostaje (tak wygląda scena przypięta w designie) — znika tylko
prześwitywanie.

### D-P5. Desktopowe CTA w sekcji procesu na stronie głównej

`.pr-cta` przestaje być `display: none` na desktopie: przycisk
`HomeCta variant="out"` („Zobacz proces współpracy" + strzałka ↗),
**wyśrodkowany** pod ostatnim krokiem osi — nagłówek sekcji na
desktopie też jest wyśrodkowany, więc trzyma tę samą oś symetrii.
Reveal jak reszta sekcji (`data-rev`, motion-gate).

**KOREKTA D-SG5**: „desktop bez CTA do procesu" przestaje obowiązywać —
to świadoma dewiacja od eksportu na życzenie Mateusza (design nie ma
tego przycisku). **D-CH4 zostaje nietknięte**: „Proces współpracy" dalej
NIE wchodzi do nawigacji navbara, żyje w stopce i teraz dodatkowo
w CTA sekcji.

### D-P7. CTA zajawki oferty: duplikat per-breakpoint (dorzucone po PR B)

Jeden link z dwiema etykietami (`lbl-d`/`lbl-m`) prowadził na obu
progach na `/oferta/` — na mobile użytkownik po tapnięciu „Zobacz pełną
ofertę" trafiał na tę samą karuzelę 3 kafli, z której wyszedł. Komplet
6 kategorii mieszka na mobile w `/kategorie/`, więc CTA rozjeżdża się
na duplikat per-breakpoint (wzorzec 4.3/4.5): `of-ctaD` → `/oferta/`
(desktop, zakładki) i `of-ctaM` → `/kategorie/` (mobile, lista);
widoczny zawsze JEDEN egzemplarz, drugi na `display: none` (drzewo
dostępności bez duplikatu). Kafle KATEGORII zostają na deep-linku
`/oferta/#<slug>` z D-P1 — zmiana dotyczy wyłącznie CTA sekcji.

### D-P6. Link „Zobacz więcej opinii w Google" → panel opinii firmy

Stała `OPINIE_GOOGLE_URL` (`src/lib/opinie.ts`) dostaje adres, który
Mateusz zweryfikował klikiem — panel lokalny firmy z otwartą zakładką
opinii. Wersja pełna z paska adresu niesie ~10 parametrów sesyjnych
(`sca_esv`, `sxsrf`, `ved`, `biw`/`bih`/`dpr`, `stick`, …), które są
kontekstem TAMTEJ sesji wyszukiwania, nie identyfikatorem firmy —
w kodzie zostaje wariant obcięty do części niosącej znaczenie:

- identyfikator firmy: `rldimm=10496135886078434411` (CID profilu),
- tryb lokalny: `tbm=lcl`, zapytanie: `q=`, język: `hl=pl`,
- zakładka opinii: `#lkt=LocalPoiReviews`.

Wariant **zweryfikowany klikiem przez Mateusza** (2026-08-02) i wpisany
do kodu:

```
https://www.google.com/search?q=Delung+Meble&tbm=lcl&rldimm=10496135886078434411&hl=pl#lkt=LocalPoiReviews
```

Podmiana w jednym miejscu obsługuje oba konsumenty (`HomeOpinie`,
`OnasOpinie`). `rel="noopener"` i `target="_blank"` bez zmian (kontrakt
`o-nas.spec.ts:28` sprawdza `/google\.com/` — nowy adres go spełnia).

---

## 4. Implementacja — pliki

**PR A (funkcjonalny: deep-linki + sheety w miejscu) — D-P1/D-P2/D-P3**

| Plik | Zmiana |
| ---- | ------ |
| `sections/home/home-oferta-content.ts` | **nowy** — tablica kafli zajawki (slug + treści eksportu), czyste dane pod unit test |
| `sections/home/HomeOferta.astro` | konsumpcja danych + mapa slug→obraz; `href="/oferta/#<slug>"` + `data-kat-link` na kaflach |
| `sections/oferta/KategorieSheets.astro` | **nowy** — 6 sheetów `#kat-<slug>` + style `.dt-*` (przeniesione 1:1 z `KategorieSection`) |
| `sections/oferta/KategorieSection.astro` | traci blok sheetów i style `.dt-*` (zostaje lista `.kt-*` + CTA) |
| `sections/oferta/OfertaSection.astro` | `data-kat-link` na kaflach karuzeli (href bez zmian) |
| `sections/oferta/kategorie.ts` → `kat-sheets.ts` | uogólnienie: przyciski listy + kafle-linki (mobile: `preventDefault`) + hash + guard progu |
| `sections/oferta/oferta.ts` | hash → zaznaczenie zakładki na desktopie (bez `.anim`) |
| `components/Home.astro` | `<KategorieSheets />` + import `kat-sheets` (zawsze) |
| `components/OfertaPage.astro` | `<KategorieSheets />` + import `kat-sheets` (zawsze) |
| `components/KategoriePage.astro` | `<KategorieSheets />` + import pod nową nazwą |

**PR B (drobne wizualne + link) — D-P4/D-P5/D-P6**

| Plik | Zmiana |
| ---- | ------ |
| `sections/home/HomeOferta.astro` | nieprzezroczysty hover CTA |
| `sections/home/HomeCta.astro` | przegląd hoverów wariantów (jeśli trzeba — nieprzezroczyste odpowiedniki) |
| `sections/home/HomeProces.astro` | `.pr-cta` widoczne na desktopie, wyśrodkowane |
| `src/lib/opinie.ts` | nowy `OPINIE_GOOGLE_URL` |

## 5. Testy

**PR A**

- `tests/unit/home-oferta.test.ts` (**nowy**): każdy slug kafla zajawki
  istnieje w `categories.ts` i ma wpis w `OFERTA_CATEGORIES`; kolejność
  i liczba kafli (6, w tym 3 mobilne) zgodne z dzisiejszym stanem.
- `tests/e2e/index.spec.ts` / `oferta.spec.ts` (rozszerzenia):
  - desktop: klik w kafel zajawki → URL `/oferta/#<slug>` i **ta**
    zakładka `aria-selected="true"`, jej panel widoczny;
  - desktop: wejście wprost na `/oferta/#<slug>` → jw.; zły slug →
    panel 01;
  - mobile: tap w kafel zajawki (home) → URL bez zmian, sheet
    `#kat-<slug>` otwarty, nagłówek zgodny z `OFERTA_CATEGORIES`;
  - mobile: tap w kafel karuzeli `/oferta/` → jw. (bez nawigacji);
  - mobile: „zobacz pełną ofertę" dalej nawiguje na `/kategorie/`
    (test istnieje — `oferta.spec.ts:205`, ma zostać zielony);
  - `kategorie.spec.ts` bez zmian merytorycznych (ta sama mechanika,
    inna lokalizacja markupu) — sprawdzam, że przechodzi.
- `a11y.spec.ts`: `/` i `/oferta/` skanowane po dołożeniu sheetów —
  **zero nowych wpisów w allowliście** (sheety są `hidden`, więc poza
  drzewem dostępności; weryfikuję realnym przebiegiem).
- `seo.spec.ts`: test „wszystkie wewnętrzne linki < 400" zbiera nowe
  hrefy z hashem — musi zostać zielony.

**PR B**

- `o-nas.spec.ts` (istniejący) — link Google dalej pasuje do kontraktu.
- e2e dojścia do `/proces-wspolpracy/`: nowy przycisk desktop dostaje
  asercję (klik → trasa), spójnie z testami dojść z 4.2.
- Reszta warstw wg `.claude/rules/testing.md`.

## 6. Baseline'y wizualne

Liczby policzone z drzewa `tests/visual/__screenshots__` (434 pliki):

| PR | Co się zmienia wizualnie | Pliki do regeneracji |
| -- | ------------------------ | -------------------- |
| A | nic — sheety są `hidden`, hrefy nie zmieniają pikseli | **0** — POTWIERDZONE przebiegiem (`pnpm test:visual`: 203 zielone, zero diffów) |
| B | sekcja procesu na home rośnie o przycisk (tylko desktop); hover nie jest łapany przez zrzuty | **8** (plan zakładał 6): `index-proces` × `chromium-1366`, `chromium-1920`, `firefox-desktop` **+ `index-opinie` × `chromium-1366`**, każdy w wariancie `-darwin` i `-linux` |

**Ósmy i siódmy plik — skąd `index-opinie`:** treść sekcji opinii jest
identyczna, przesunęła się o **1 px w pionie**. Zrzut sekcji robimy po
przewinięciu do niej, a wyższa strona (przycisk procesu) daje ułamkową
pozycję scrolla, którą przeglądarka zaokrągla w drugą stronę niż
wcześniej; na `chromium-1920` i `firefox-desktop` zaokrągliło się tak
samo jak w baseline'ie, stąd tam zielono. Zachowanie powtarzalne, nie
losowe. Diff pokazany Mateuszowi i zaakceptowany (2026-08-02) —
strojenie odstępu pod parzystą wysokość sekcji odrzucone (to strojenie
pod test, nie pod wygląd).

Mobilne `index-proces` zostają nietknięte (CTA na mobile istnieje od
4.2). Sweepy scen (`index-of-sweep`, `index-re-sweep`) liczą pozycje
z `offsetTop`/`offsetHeight` własnej sekcji, więc wzrost sekcji procesu
ich nie rusza — gdyby jednak drgnęły, pokazuję diff i pytam.

Kolejność regeneracji NA ZAWSZE: kod → workflow „Update linux visual
baselines" z brancha PR-a → `git pull` → lokalny `pnpm test:visual:update`
→ commit darwin na końcu.

## 7. Podział na PR-y

1. **PR A — `fix/kategorie-w-miejscu`** (D-P1/D-P2/D-P3): jedna spójna
   zmiana zachowania kafli kategorii na obu progach + refaktor sheetów
   do współdzielonego komponentu. Bez baseline'ów → szybka ścieżka.
2. **PR B — `fix/home-cta-i-link-opinii`** (D-P4/D-P5/D-P6): trzy drobne
   poprawki wyglądu/treści + 6 baseline'ów. Wchodzi **po** A (oba
   dotykają `HomeOferta.astro` — sekwencyjnie, żeby nie było konfliktu).
3. **PR C — `fix/home-cta-pelna-oferta`** (D-P7, dorzucony po testach
   PR-a B): CTA sekcji oferty na stronie głównej rozdzielone na duplikat
   per-breakpoint — mobile „Zobacz pełną ofertę" → `/kategorie/`,
   desktop „Sprawdź ofertę" → `/oferta/`. Zero baseline'ów (każdy próg
   widzi to samo co wcześniej), zero nowych plików.

Oba PR-y aktualizują ten dokument (status) i CLAUDE.md dopiero na
końcu rundy (jeden wpis „Runda poprawek wizualnych" z datą i numerami
PR-ów).

## 8. Ryzyka i weryfikacja na fizycznym urządzeniu

- **Waga stron** (D-P2) — ZMIERZONE (build `main` vs build PR A):

  | Dokument | raw przed → po | gzip przed → po |
  | -------- | -------------- | --------------- |
  | `/` | 99 390 → 126 539 B | 13 672 → **17 189 B** (+3 517) |
  | `/oferta/` | 44 561 → 71 511 B | 8 480 → **10 606 B** (+2 126) |
  | `/kategorie/` | 50 896 → 51 329 B | 8 545 → 8 849 B (+304) |

  Bundle JS: 52 534 → 52 118 B (−416 B — `kat-sheets.ts` zastąpił
  `kategorie.ts`, a moduł ładuje się teraz z komponentu). CSS bundli:
  bez zmian (+29 B). Zdjęcia kart NIE są pobierane do czasu otwarcia
  (`lazy` w `hidden`), więc transfer wejściowy rośnie o ~3,5 kB na `/`.
  Budżety LHCI (mobile total 1,2 MB, script 80 kB) **nietknięte** —
  zapas pozostaje duży; progów nie ruszam.
- **Android, limit warstw GPU**: otwarcie sheeta ze strony głównej —
  strona ma więcej warstw (hero, marquee) niż `/kategorie/`. Do
  sprawdzenia na telefonie: czy sheet wjeżdża płynnie i czy po
  zamknięciu strona wraca w to samo miejsce toru karuzeli.
- **iOS Safari**: swipe-down sheeta uruchomionego z karuzeli (gest w dół
  vs poziomy scroll toru — `touch-action`), stopka CTA sheeta nad
  zwijanym toolbarem.
- **Zachowanie „wstecz"**: przy otwartym sheecie sprzętowy back opuszcza
  stronę (świadoma decyzja D-P2) — Mateusz potwierdza, że to mu pasuje
  w realnym użyciu.
- **Link Google** (D-P6): weryfikacja klikiem przez Mateusza przed
  wpisaniem skróconego wariantu; adresy Google bywają nietrwałe —
  jeśli skrót zawiedzie, wchodzi pełny adres 1:1.

## 9. Definition of done rundy

Ten dokument + wpis w `docs/README.md`; dopiski „KOREKTA po testach"
w `analiza-strona-glowna.md` (D-SG4, D-SG5) i `analiza-oferta-kategorie.md`
(D-OK3, D-OK5); zielone lokalnie `format:check`, `lint`, `typecheck`,
`test:unit`, `test:e2e` (6 profili), `build` + `test:visual`; oba
komplety baseline'ów w PR B; zero nowych wpisów w allowliście axe;
budżety LHCI nietknięte (liczby zgłoszone Mateuszowi); PR-y zielone na
`quality`+`e2e`+`lighthouse`; po merge'u prod-smoke zielony; CLAUDE.md
zaktualizowane o rundę poprawek (data + numery PR-ów).
