# Analiza — /proces-wspolpracy/ + /o-nas/ + /polityka-prywatnosci/ (Etap 4, część 4.5)

Ostatnia część widoków: port `/proces-wspolpracy/` (hero + 4 kroki +
efekt + CTA) i `/o-nas/` (manifest, zespół, precyzja, opinie) na design
delung oraz przejście `/polityka-prywatnosci/` z przejściowego ciemnego
motywu na docelowy jasny layout designu (treść RODO zostaje). Cel jak
w 4.1–4.4: wygląd i zachowanie **1:1 z eksportami**; szkielety
proces/o-nas z Etapu 0 znikają. Po merge'u trzech widoków — czwarty PR
porządkowy (domknięcie Etapu 4).

**Tryb tej części (z promptu): każdy widok = OSOBNY PR** — trzy małe
PR-y po kolei + porządkowy. Jedna wspólna mini-analiza (ten plik).

Referencje: `docs/design/proces.html`, `docs/design/o-nas.html`,
`docs/design/polityka-prywatnosci.html`, `docs/analiza-chrome-globalny.md`
(D-CH3 — wariant `over`, D-CH5 — antyscraping, D-CH9), pozostałe
`analiza-*` (wzorce motion-gate, kontrasty, duplikaty per-breakpoint),
`.claude/rules/sections.md`, `.claude/rules/testing.md`.

## 1. Co mówią eksporty (anatomia widoków)

### `/proces-wspolpracy/` (`proces.html`; navbar `hdr dark` / `data-nav="over"`)

| Blok | Mobile (<1024) — motyw JASNY | Desktop (≥1024) — motyw CIEMNY (`#12110f`) |
| --- | --- | --- |
| `hero` | tekstowy, bez zdjęcia: kicker „PROCES WSPÓŁPRACY", h1 „Od rozmowy do gotowego wnętrza", linia, lead | pełnoekranowy (`clamp(560,52.8vw,760)`): zdjęcie `wspolpraca-desktop-intro` + tint gradientowy, kicker „· 4 KROKI", h1 74–104 px biały, lead, pionowy cue „PRZEWIŃ" |
| `steps` | 4 sekcje: wielki numer (13% alpha), tag zielony, h2, linia, lead+rest, zdjęcie 39/35; **sticky chip licznika** „01 / 04" (prawy górny róg) | grid 45,8 % / 1fr: lewa kolumna **sticky 100vh** — zdjęcia kroków odsłaniane `clip-path` wg postępu + wielki licznik + pionowy pasek postępu; prawa — kroki po `min-height:100vh` (lead serifem Cormorant), hairline'y |
| `efekt` | **`display:none`** (nie istnieje w widoku mobile) | cream: h2 serif italic „Zostawiamy po sobie…" + lista 4 checków |
| `cta` | tło `#eae5dd`: kicker z zieloną kropką „DOSTĘPNI 24/7", h2, akapit, przyciski „Zadzwoń teraz" (`tel:`) + „Napisz wiadomość" → kontakt | pełnoekranowy finał: tło `proces-step4` blur(7) + tint, kropka **pulsuje**, h2 „Masz pytania? Zadzwoń.", duży przycisk „Skontaktuj się z nami" → kontakt + pigułki `tel:` / `mailto:` |

Zdjęcia kroków w eksporcie są JEDNYM źródłem — desktopowa kolumna
klonuje je JS-em z mobilnych `.step-photo`. Ruch: `data-rev`/parallax
(mobile), swap `clip-path` + liczniki z rAF-a (desktop), GSAP tylko dla
`data-rise/words` (jak w 4.2–4.4 — nie portujemy GSAP-a).

**Navbar — KOREKTA ustalenia z 4.1**: `proces.html` (jako jedyny
eksport) MA realny CSS `.hdr.dark` (blok „ciemny navbar tej strony",
≥1024): pasek po scrollu dostaje **ciemne tło** `rgba(18,17,15,.75)` +
`backdrop-filter: blur(14px)`, logo **zawsze białe** (`logo-l` opacity 1),
linki białe, pill telefonu transparentny z białą obwódką; scrim ukryty.
Mechanika `--p` bez zmian — to wariant `over` z ciemną kolorystyką
docelową (zamiast wjazdu białego tła). Analiza 4.1 pisała „klasa `dark`
bez CSS" — to prawda dla `o-nas.html`, ale nie dla `proces.html`
(patrz D-P2).

### `/o-nas/` (`o-nas.html`; navbar `hdr dark` / `data-nav="over"`, `data-navref` na hero)

| Blok | Mobile (<1024) — JASNY | Desktop (≥1024) — CIEMNY (`#15130f`) |
| --- | --- | --- |
| `hero` | zdjęcie `adam-hero` (300–440 px, parallax) + **biała karta** nachodząca −72 px: logo, certyfikat (róg), kicker „O FIRMIE DELUNG", h1-cytat „«U nas nie usłyszysz, że czegoś nie da się zrobić.»", zielona linia, **akapit manifestu** | grid tekst / zdjęcie (`min-height:100svh`): h1 serif italic 50–78 px biały, **akapit „Stolarstwo mamy we krwi…"**, bus firmowy (fiat) z halo; kolumna zdjęcia z certyfikatem (glow) u dołu |
| `manifest` | brak (akapit żyje w karcie hero) | ciemna sekcja: tło kaszmir blur(9) + tint, kicker „MANIFEST", akapit 24–38 px **rozjaśniany słowo po słowie** scrollem; tło powoli wychodzi ze zbliżenia |
| `team` | van (fiat) nad kickerem, „LUDZIE I PASJA", h2, intro (+ „Kto za tym stoi?"), **Adam duży** (karta ze zdjęciem, cytat serif z dopiskiem), Tomek+Marcin w siatce 2 kol. | **sekcja przypięta 300vh**: head (kicker/h2 + licznik „01 / 03"), poziomy tor 3 kart (zdjęcie+opis+cytat) przesuwany postępem scrolla |
| `prec` | jasna: kicker/h2/linia/lead, karta „3 FILARY" (cream, checki), pasek 6 logotypów dostawców | ciemna: tło kaszmir blur(9)+tint, grid 2 kol. — lewa kicker/h2/lead+logotypy, prawa filary z numerkami i hairline'ami |
| `rev` | cream: h2 „Nie musisz wierzyć nam na słowo.", lead, ocena „Google 5,0 ★★★★★", **karuzela 6 kart opinii** (snap) + CTA „Zobacz więcej opinii w Google" | jasna `#faf8f5`: h2 + lead z oceną inline, **dwa przeciwbieżne marquee** (3+3 opinii) + CTA Google |

Dane: `ZESPOL` (3 osoby — Adam/Tomek/Marcin, portrety) i `OPINIE`
(6 opinii Google) w tablicach JS eksportu. **`OPINIE` to dokładnie ten
sam zestaw, którego używa `HomeOpinie` z 4.2** (n/m/t identyczne;
eksport o-nas ma dodatkowo flagę `more` — dopisek „…więcej" na kartach).
Eksport przenosi akapity (manifest/intro) i busa między widokami JS-em
(`relocate()`); klasa `dark` navbara — patrz wyżej.

### `/polityka-prywatnosci/` (`polityka-prywatnosci.html`; navbar `hdr plain`)

| Blok | Mobile (<1024) | Desktop (≥1024) |
| --- | --- | --- |
| `pp-head` | cream: kicker „OCHRONA DANYCH OSOBOWYCH", h1 „Polityka prywatności", linia, data „OBOWIĄZUJE OD 11 LIPCA 2026 R.", lead | to samo, większe (h1 50–72 px), wyrównane do lewej kolumny |
| `pp-doc` | jedna kolumna: 9 sekcji z numerkami mono, hairline'y, listy z pauzami | grid: **sticky TOC** („W TYM DOKUMENCIE", 9 linków `#pp-NN` + „Masz pytanie o dane? Napisz" → kontakt) / kolumna sekcji (numer 64 px + treść) |
| `pp-cta` | `#eae5dd`: jeden przycisk „Wróć do kontaktu" | pasek: h2 „Napisz albo po prostu zadzwoń." + akapit / przyciski: pill `tel:` (ciemny) + „Wróć do kontaktu" (obwódka) |

Treść 9 sekcji designu = nasza obecna treść (design ma znaczniki
„[do uzupełnienia]", nasz `PolicyPage` ma je wypełnione realnym stackiem
Cloudflare/Resend/OVH — **treść obecna jest bogatsza i zostaje**,
zgodnie z promptem). Design ma jawne `mailto:`/`tel:` w treści §01 —
u nas antyscraping (niżej D-P8).

## 2. Decyzje portu

### D-P1. Trzy PR-y widoków + PR porządkowy; struktura komponentów

Kolejność: **proces → o-nas → polityka → domknięcie etapu**. Working
tree na main ma niezacommitowaną aktualizację CLAUDE.md (stan po 4.4) —
zabiera ją pierwszy commit PR-a procesu (wzorzec 4.3/4.4).

Struktura (wzorzec sekcji 4.2–4.4):

- `src/components/sections/proces/` — `ProcesHero/ProcesSteps/
  ProcesEfekt/ProcesCta.astro` (lub mniej plików, jeśli sekcje okażą
  się małe), `proces-config.ts` (**`PROCES_DESKTOP_MIN_PX = 1024`**,
  importują testy; `@media` w parze) i `proces-motion.ts` (ruch za
  bramką — niżej D-P5). `src/pages/proces-wspolpracy.astro` przechodzi
  ze `SkeletonPage` na nowy widok; tytuł/description ze szkieletu
  zostają (docelowe), h1 = z designu.
- `src/components/sections/o-nas/` — `OnasHero/OnasManifest/OnasTeam/
  OnasPrec/OnasOpinie.astro` + `onas-config.ts`
  (**`ONAS_DESKTOP_MIN_PX = 1024`**) + `onas-motion.ts`. Dane zespołu =
  lokalna tablica w sekcji (jedna strona-konsument, wzorzec D-SG1).
  **`SkeletonPage.astro` traci w tym PR ostatniego konsumenta → kasuję
  go tutaj** (typecheck pilnuje).
- Polityka: `PolicyPage.astro` przepisany na markup `pp-*` designu
  (treść zostaje w tym samym pliku — dokument prawny, D-P8); bez
  nowego katalogu sekcji i bez configu (widok nie ma logiki JS zależnej
  od progu; `@media` 1024 w CSS).

Lenis: oba nowe widoki na domyślnym `smoothScroll` (desktop — jak
/oferta/ i /realizacje/ po 4.4); polityka już ma `"desktop"` — zostaje.

### D-P2. Navbar: wariant `over` z ciemnym tonem (`hdr dark` z eksportów) — do decyzji

Korekta ustalenia z 4.1 (pisanego przed powstaniem finalnych eksportów
proces/o-nas): klasa `dark` NIE jest martwa — `proces.html` definiuje
dla niej pełny zestaw reguł (ciemne tło z blur po scrollu, logo i linki
zawsze białe, pill tel obwódkowy). `o-nas.html` ma w markupie tę samą
klasę `hdr dark`, ale bez CSS (wygląda na ubytek eksportu — obie strony
mają na desktopie ciemne hero i ciemne sekcje, na których biały pasek
`over` po scrollu byłby obcym elementem).

**Rekomendacja**: rozszerzyć `Navbar.astro` o modyfikator
`tone="dark"` dla wariantu `over` (mechanika `--p`, markup i mobile bez
zmian — reguły `.hdr.dark` żyją tylko w `@media ≥1024`) i użyć go na
**obu** stronach (proces + o-nas). Alternatywa ściśle wg CSS eksportów:
proces = `dark`, o-nas = zwykły `over` (biały pasek po scrollu).
Wariant `plain` i istniejące strony — nietknięte (zero zmian baseline'ów
chrome/home/oferta/work). `data-navref` dostaje hero obu stron
(kontrakt skryptu `over` z 4.1).

### D-P3. Duplikaty per-breakpoint zamiast relokacji JS-em (o-nas) i klonowania (proces)

Eksporty przenoszą treść JS-em (`relocate()` akapitów i busa w o-nas,
klonowanie zdjęć kroków do sticky kolumny w proces). My renderujemy
w SSR **oba egzemplarze** w gałęziach mobile/desktop (`mOnly`/`dOnly` —
wzorzec celowego duplikatu karty CTA `--side`/`--wide` z 4.3):

- o-nas: akapit manifestu (karta hero mobile ↔ sekcja manifest desktop),
  akapit intro (team mobile ↔ hero desktop), bus (team-van mobile ↔
  hero-bus desktop). Te same pliki obrazów w obu gałęziach = jeden fetch.
- proces: zdjęcia kroków w mobilnych `.step-photo` i desktopowej
  kolumnie swap — te same 4 pliki (jeden fetch; przeglądarka nie pobiera
  drugi raz tego samego URL-a).
- Obrazy występujące TYLKO w jednej gałęzi (hero proces — desktop;
  ewentualne tła sekcji ciemnych o-nas) — wzorzec `<picture>` +
  `<source media>` z 4.2 (lekcja: `display:none` nie zatrzymuje
  pobierania), żeby mobile nie ściągał desktopowych bajtów.

W drzewie dostępności zawsze jeden egzemplarz (drugi w gałęzi
`display:none`) — wzorzec h1 hero z 4.2.

### D-P4. Opinie: wspólny moduł danych, HomeOpinie bez zmian wizualnych

Dane 6 opinii wyciągam z `HomeOpinie.astro` do **`src/lib/opinie.ts`**
(obok `categories.ts` — dane współdzielone przez dwa widoki; tablica +
typ + flaga `more` z eksportu o-nas, której home nie używa). Kolory
awatarów zostają te PRZYCIEMNIONE z D-SG7 (AA), nie surowe z eksportu.
`HomeOpinie` tylko importuje moduł — markup/CSS bez zmian, **baseline'y
home nietknięte** (weryfikacja lokalnym `test:visual` przed PR-em).
Sekcja opinii o-nas ma własny markup `rev`/`rc` wg designu (inne
rozmiary, marquee 3+3 zamiast 6+6 — nie reużywam komponentu home, tylko
dane; ta sama decyzja co marquee logotypów w 4.3). Gwiazdki jako SVG
`aria-hidden` (wzorzec D-SG7), drugi obieg marquee `aria-hidden`,
karuzela mobile z gotchas sections.md (`data-lenis-prevent-horizontal`,
`scroll-snap-stop: always`).

### D-P5. Ruch: `proces-motion.ts` / `onas-motion.ts` za bramką, bez GSAP

Wzorzec 4.2–4.4 (dynamiczny import przy `no-preference`, stany startowe
uzbraja `js-motion`; bez JS / przy reduce strona w pełni statyczna):

- proces: reveale `[data-rev]` + parallax hero/CTA (mobile i desktop),
  desktop swap `clip-path` zdjęć kroków + licznik + pionowy pasek,
  mobile sticky chip licznika (scroll-driven). Bez JS na desktopie
  widoczny pierwszy kadr kolumny (SSR: pierwszy `swapimg` odsłonięty).
  Pulsująca kropka CTA = czysty CSS (`@keyframes`, reduce wyłącza).
- o-nas: reveale + parallax zdjęcia hero, manifest słowo-po-słowie
  (wzorzec cytatu HomeAbout z `home-scroll`), przypięty tor kart zespołu
  (postęp z `scrollY` → `translate3d`, licznik — mechanika scen
  przypiętych 4.2), powolny zoom-out teł manifest/prec. Fallback
  (no-JS/reduce, desktop): sekcja team w flow, tor jako
  `overflow-x: auto` (wzorzec fallbacku toru oferty z 4.2); manifest
  statycznie pełną jasnością.
- Animacji `data-words`/`data-rise` GSAP-a nie portuję — reveal zamiast
  word-split (spójnie z 4.2–4.4).

### D-P6. Assety (optimize-images.mjs; reuse gdzie się da)

Nowe (z pełnych PNG eksportów):

- `src/assets/proces/`: `hero.webp` (`wspolpraca-desktop-intro`,
  ~2000 px, desktop-only przez `<picture>`), `step-1..4.webp`
  (~1400 px — wspólne dla kadrów mobile 39/35 i sticky kolumny 100vh;
  warianty home `proces-1..4.webp` 1100×616 to poziome kropy zajawki —
  za niskie pod te kadry, zostają nietknięte), `cta-bg.webp`
  (`proces-step4` mocno skompresowany pod blur(7), wzorzec ko-bg).
- `src/assets/o-nas/`: `adam-hero.webp` (pion, ~1400 px — home
  `adam.webp` 1100×616 to inny krop), `adam-portrait.webp`,
  `tomek-portrait.webp`, `marcin-portrait.webp` (karty zespołu),
  `fiat-bus.webp` (bez tła).

Reuse bez nowych bajtów: `cert-firma-godna.webp` (hero o-nas),
`logo-*.webp` (pasek marek), `ko-bg.webp` jako tło kaszmirowe
manifest/prec (jest przygotowany pod blur — ta sama decyzja co
pr/kt-cta w 4.3). Wszystko poniżej foldu `loading="lazy"` +
`decoding="async"` + jawne wymiary; hero o-nas mobile (LCP podstrony)
bez lazy.

### D-P7. Kontrasty pod pustą allowlistę axe (wzorzec D-OK7/D-R8)

1. Jasne tła: kickery/drobiazgi `rgba(26,26,26,.5)` i zielenie `--gr`
   (~4.0:1) → `--accent-ink`; alpha .45–.55 (`cta-kick`, `rc-meta`,
   `rc-more`, `pp-kick`, `pp-date`, `brands-h`, `pillars-h`) → min.
   `--faint` 0.64.
2. Ciemne tła (desktop proces/o-nas): `.55–.6` białe → min.
   rgba(255,255,255,.7) (wzorzec sheet-call); `--stDim` .7 i `#7fd0a2`
   na `#12110f` — AA, zostają.
3. Elementy czysto dekoracyjne (numery sekcji `pp-num`, pauzy list,
   chip/liczniki, dashes) — `aria-hidden`, kontrast bez wymogu, wygląd
   1:1 z designem.
4. Gwiazdki `★` → inline SVG `aria-hidden` (D-SG7).

### D-P8. Polityka: pełny port layoutu `pp-*`, treść i kontrakty bez zmian

Port to nie tylko motyw — obecny layout (`.pp-art`, serif accent w h1)
to szablon hadrianm; wchodzi **markup designu 1:1**: `pp-head` (cream),
`pp-doc` z desktopowym sticky TOC (linki `#pp-NN`, przez
`scroll-margin-top` pod `--hdr-h`; „Masz pytanie o dane?" → `/kontakt/`)
i `pp-cta`. Zostaje bez zmian: struktura danych `sections` (9 sekcji,
treść z realnym stackiem — bogatsza niż znaczniki designu), tytuł/
description/canonical, klasa `.pp-sec` (asercje policy.spec), listy jako
semantyczne `<ul>` stylizowane na pauzy designu.

- **Import `legacy-dark.css` znika z PolicyPage** (lekcja 1). Plik
  zostaje — importuje go jeszcze `ContactPage` (KOREKTA planu domknięcia:
  kasacja pliku dopiero po porcie kontaktu w Etapie 5).
- **Antyscraping przechodzi na `contact-details.ts`** (przewidziane
  w D-CH5): sloty `[data-mail]`/`[data-tel]` w treści §01 i pill tel
  w `pp-cta`; własny skrypt składania w PolicyPage znika —
  `fillContactSlots()` z navbara pokrywa całą stronę. Kontrakt
  antyscrapingowy (surowy HTML przez `page.request.get` + grep dist)
  bez zmian — pełne ciągi dalej nie istnieją w statycznym źródle.
- **Rozszerzenie `contact-details.ts`**: przycisk „Zadzwoń teraz"
  (mobile CTA procesu) ma stałą etykietę — potrzebny wariant
  **href-only**: `data-tel="href"` wypełnia tylko `href`, nie ruszając
  treści (wstecznie zgodne; unit test w PR procesu, który pierwszy
  tego używa).

### D-P9. Sticky pod `--hdr-h` (dewiacja-fix, wzorzec D-R7)

Eksporty przyklejają sticky elementy do `top` liczonych bez naszego
paska: chip licznika procesu (`top:12px`) i TOC polityki
(`top:clamp(96…120)`). Jak w 4.4: `top: calc(var(--hdr-h, 74px) + …)` /
`scroll-margin-top` pod `--hdr-h`. Sticky kolumna swap procesu
(desktop, `top:0`) zostaje — ciemny navbar `over` nakłada się na nią
z definicji wariantu.

### D-P10. Meta i porządki

Tytuły/opisy proces i o-nas ze szkieletów zostają (docelowe; seo.spec
bez asercji per-strona dla tych tras). Sitemap/canonical bez zmian.
`AmbientBackground` – bez zmian (nie dotykam konsumentów). Stopka:
pozycja „Proces współpracy" w `ft-nav` ZOSTAJE mimo pojawienia się CTA
(pełna mapa strony — D-CH4 bez zmian). Nawigacja navbara — bez zmian
(4 pozycje).

## 3. Kontrakty selektorów i testów

| Kontrakt | Los |
| --- | --- |
| `main h1` (smoke, navigation — klik „O nas" w sheecie) | spełnia `hero h1` procesu i `hero-card h1` o-nas (widoczne na obu progach) |
| `.pp-sec` ×9 + NIP w pierwszej (policy.spec) | **bez zmian** — klasa i struktura sekcji zostają w nowym markupie |
| `mailto:` składane w JS (policy.spec) | zostaje — realizuje `fillContactSlots` (slot `[data-mail]` w §01) |
| `.ft-nav a[href=polityka]` (policy.spec) | bez zmian (stopka nietknięta) |
| kontrakt antyscrapingowy `contact.spec.ts` (surowy HTML + grep dist) | bez zmian speca — nowe widoki używają wyłącznie slotów D-CH5 |
| sticky pasek na `/realizacje/` (navigation.spec) | bez zmian |
| allowlista axe | pusta (D-P7) |
| nowe | `PROCES_DESKTOP_MIN_PX` / `ONAS_DESKTOP_MIN_PX` (importują testy), `[data-navref]` na hero proces/o-nas, `.step`/`[data-swapcount]`/`[data-swapbar]`/`[data-count]`, `.tc`/`[data-teamcount]`, `.rev-car`/`.rev-marq`, `.pp-toc a`, `data-tel="href"` |

## 4. Plan implementacji (per PR)

**PR 1 — `feat/etap-4-5-proces`** (pierwszy commit zabiera czekającą
aktualizację CLAUDE.md z 4.4):

1. Assety `src/assets/proces/` (D-P6).
2. `contact-details.ts` — wariant href-only + unit test (D-P8).
3. `Navbar.astro` — modyfikator `tone="dark"` wariantu `over` (D-P2).
4. Sekcje `sections/proces/*` + `proces-config.ts` + `proces-motion.ts`;
   strona przechodzi ze SkeletonPage.
5. Testy: nowy e2e `proces.spec.ts`, nowy visual `proces.spec.ts`;
   pełna bramka lokalnie; baseline'y w świętej kolejności.

**PR 2 — `feat/etap-4-5-o-nas`**:

1. Assety `src/assets/o-nas/`; `src/lib/opinie.ts` + przejście
   `HomeOpinie` na import (weryfikacja: baseline'y home bez diffu).
2. Sekcje `sections/o-nas/*` + `onas-config.ts` + `onas-motion.ts`;
   strona przechodzi ze SkeletonPage; **kasacja `SkeletonPage.astro`**.
3. Testy: nowy e2e `o-nas.spec.ts`, nowy visual `o-nas.spec.ts`;
   baseline'y w świętej kolejności.

**PR 3 — `feat/etap-4-5-polityka`**:

1. `PolicyPage.astro` → markup `pp-*` (D-P8/D-P9); import
   `legacy-dark.css` usunięty; skrypt składania → sloty
   `contact-details`.
2. Adaptacja `policy.spec.ts` (asercje TOC desktop, pill tel w cta;
   dotychczasowe asercje zostają). Nowy visual `polityka.spec.ts` —
   **propozycja: 2 profile** (chromium-1920 z TOC + chromium-pixel-5)
   zamiast 6: dokument statyczny, treść niezależna od profilu (wzorzec
   zawężenia jak `kategorie` = tylko mobile). Baseline'y w świętej
   kolejności.

**PR 4 — `chore/etap-4-domkniecie`** (po merge'u trzech):

1. Weryfikacja grepem: jedyny import `legacy-dark.css` = `ContactPage`
   (plik ZOSTAJE do Etapu 5 — korekta pierwotnego planu kasacji);
   adnotacja w CLAUDE.md.
2. Testy z lekcji 5: BackButton usunięty już w 4.1 (D-CH8), test paska
   biega na `/realizacje/` i jest aktualny — przegląd komentarzy speców
   (obecny grep nie znajduje odłożonych TODO; jeśli nic nie zostało —
   odnotować i nie ruszać).
3. **Zacieśnienie budżetów LHCI** do baseline'u pełnej strony: odczyt
   pomiaru z CI po merge'ach (mobile dziś: perf ≥0.75, LCP ≤6000 —
   zmierzone 4.2: 0.89 / 3695 ms; desktop 0.9 / 2000) → propozycja
   nowych progów z zapasem ratchetowym **do decyzji Mateusza, osobny
   commit** (np. mobile perf 0.85 / LCP 4500, wg realnego pomiaru).
4. CLAUDE.md: „Etap 4 — WYKONANY" (data, PR-y 4.1–4.5 + porządkowy),
   sekcja dziedzictwa szablonu zredukowana do kontaktu (legacy-dark
   przez ContactPage, breakpoint 861, `TODO_*` Turnstile — Etap 5);
   `docs/README.md` — wpis tej analizy (idzie już w PR 1).

## 5. Testy

- **Unit**: rozszerzenie `contact-details.test.ts` (wariant href-only).
  Nowych modułów danych z kontraktami brak (treści inline; opinie —
  czysta ekstrakcja istniejących danych).
- **E2E — nowy `proces.spec.ts`**: mobile — h1, 4 kroki z treścią,
  chip licznika rośnie po scrollu do kroku 3+, CTA: `[data-tel]`
  z `href^="tel:"` po JS i „Napisz wiadomość" → `/kontakt/`; desktop —
  hero, sekcja efekt widoczna (mobile: niewidoczna), swap kolumny:
  po scrollu do kroku N licznik `[data-swapcount]` = NN, przycisk
  „Skontaktuj się z nami" → `/kontakt/`, pigułki tel/mail wypełnione
  po JS (i nieobecne w surowym HTML — pokrywa kontrakt contact.spec).
- **E2E — nowy `o-nas.spec.ts`**: mobile — h1-cytat, karta hero
  z certyfikatem, zespół (1 lead + 2 karty), 3 filary, karuzela 6 kart
  opinii (atrybuty toru), link Google `rel="noopener"`; desktop —
  manifest widoczny, tor zespołu przesuwa się z postępem
  (`transform` zmienia się między dwoma pozycjami scrolla), licznik
  `[data-teamcount]`, marquee z duplikatem `aria-hidden`.
- **E2E — `policy.spec.ts` (adaptacja)**: dotychczasowe asercje bez
  zmian + TOC (9 linków, klik przewija do sekcji — `scroll-margin-top`),
  pill tel w `pp-cta` po JS.
- a11y/SEO/smoke/navigation — **bez zmian speców**; nowe widoki muszą
  przejść pustą allowlistę axe (D-P7).
- **Visual**: `proces.spec.ts` (6 profili: hero, krok 01, CTA; desktop
  dodatkowo efekt; sweep swap-kolumny 3 klatki tylko chromium-1920),
  `o-nas.spec.ts` (6 profili: hero, zespół, precyzja, opinie; desktop
  dodatkowo manifest; sweep toru zespołu 3 klatki chromium-1920),
  `polityka.spec.ts` (2 profile — D-P8 pkt 3: head+początek dokumentu,
  środek z TOC, cta). `prepareSweep`/freeze zamraża marquee, puls
  kropki i parallaxy. Baseline'y home/chrome/oferta/kategorie/work —
  NIETKNIĘTE (jedyne ryzyko: ekstrakcja danych opinii — weryfikowana
  lokalnie przed PR-em). Święta kolejność w każdym PR: kod → workflow
  linux z brancha PR → `git pull` → lokalny `pnpm test:visual:update` →
  commit darwin NA KOŃCU.

## 6. Ryzyka i weryfikacja na fizycznym telefonie

- **Sticky swap procesu (desktop)**: `clip-path` na 4 pełnoekranowych
  kadrach — płynność przy szybkim scrollu; sweep w visual łapie stany
  pośrednie.
- **Przypięty tor zespołu o-nas**: 300vh + `translate3d` — wzorzec scen
  z 4.2 (sprawdzony), ale karty mają zdjęcia — obserwować klatkowanie
  na słabszym GPU (fizyczny telefon nie dotyczy — sekcja desktop-only).
- **Karuzela opinii o-nas na dotyku**: snap kafel-po-kaflu — test na
  telefonie (jak karuzele 4.2/4.3).
- **Parallax hero o-nas na mobile** przy zwijanym toolbarze — wzorzec
  sondy svh z 4.2; sprawdzić brak szarpania na fizycznym urządzeniu.
- **Ciemny navbar `over` (D-P2)**: `backdrop-filter: blur(14px)` na
  pasku = warstwa GPU — desktop-only, niskie ryzyko; sprawdzić w PR
  na preview.
- **LHCI**: mierzy tylko stronę główną — jedyna zmiana na `/` to
  ekstrakcja danych opinii (zero wpływu); wynik `lighthouse` w PR-ach
  rutynowo, zacieśnienie progów w PR 4.
- Po implementacji wskażę listę rzeczy do sprawdzenia na telefonie
  (karuzela opinii, parallax hero o-nas, chip licznika procesu).

## 7. Definition of done (kontekst wspólny)

Per PR: zielone `typecheck`, `lint`, `test:unit`, `test:e2e`
(6 profili), `build` + `test:visual`; oba komplety baseline'ów
w świętej kolejności; allowlista axe pusta; breakpoint 1024 (stała +
`@media` w parze); import `legacy-dark.css` usunięty z polityki;
PR zielony na `quality`+`e2e`+`lighthouse`; po merge'u prod-smoke.
Po całości: CLAUDE.md „Etap 4 — WYKONANY" + zredukowane dziedzictwo,
wpis analizy w `docs/README.md`, propozycja progów LHCI dla Mateusza.
