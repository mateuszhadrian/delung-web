# Analiza — strona główna (Etap 4, część 4.2)

Port strony głównej na design delung: hero (mobile zdjęcie + desktop
cztery kadry z typografią SVG), pasek zaufania + logotypy, zajawki
oferta/proces/realizacje/o-nas, opinie, banner CTA kontaktu. Cel jak
w 4.1: wygląd i zachowanie **1:1 z eksportem** `docs/design/index.html`;
szkielet `Home.astro` z Etapu 0 znika w całości.

Referencje: `docs/design/index.html` (jedyna strona tej części),
`docs/analiza-chrome-globalny.md` (chrome 4.1 — wariant `over`, `--hdr-h`,
antyscraping D-CH5), `.claude/rules/sections.md` (gotchas karuzel,
motion-gate), `.claude/rules/testing.md`.

## 1. Co mówi eksport (anatomia strony)

Kolejność sekcji (wspólne drzewo HTML, breakpoint 1024):

| Sekcja | Mobile (<1024) | Desktop (≥1024) |
| --- | --- | --- |
| `hero` / `hero-d` | zdjęcie pełnoekranowe (`100dvh - pasek`), h1 „Twoja przestrzeń, twoje zasady", linijka, lead, przycisk „Skontaktuj się z nami" → kontakt; parallax zdjęcia | **osobny markup**: cztery pełnoekranowe kadry (kuchnia/łazienka/komercja/garderoba) w pętli crossfade 26 s + Ken Burns; nad nimi SVG — nazwy kategorii wypełnione tym samym zdjęciem (clip-path po tekście, glow, pan); brak nagłówka tekstowego |
| `trust` + `logos` | pasek „★ 5,0 W GOOGLE · OD 2014 · SETKI REALIZACJI" (cream) + marquee 6 logotypów dostawców (grayscale) | to samo, większe odstępy |
| `of` (oferta) | kicker/h2/lead + **karuzela pozioma** 3 kafli kategorii (scroll-snap) + CTA „Zobacz pełną ofertę" → /oferta/ | **sekcja przypięta 300vh**: lewa kolumna tekst + licznik „01 / 06", prawa — poziomy tor 6 kafli przesuwany postępem scrolla; CTA „Sprawdź ofertę" w pasie pod kaflami |
| `pr` (proces) | kicker/h2 + pionowa oś: 4 kroki (numer/tytuł/opis) + linia postępu scaleY + CTA „Zobacz proces współpracy" → /proces-wspolpracy/ | **naprzemienna oś czasu**: kroki tekst↔zdjęcie po dwóch stronach linii, reveal `st.rev` (wipe zdjęcia + wjazd tekstu), wielka cyfra w tle; **CTA ukryte** (`display:none`) |
| `re` (realizacje) | kicker/h2 + 3 karty w kolumnie (zdjęcie, tag, tytuł, parallax) + CTA „Przeglądaj nasze realizacje" → /realizacje/ | **sekcja przypięta 300vh**: lewa kolumna teksty (meta/tytuł/opis/„Więcej") przełączane postępem, prawa — stos zdjęć odsłaniany `clip-path`; pasek postępu, pill kategorii, lupa |
| `abt` (o nas) | zdjęcie Adama + kicker/h2/lead + cytat serif + CTA „Więcej o nas" → /o-nas/ | **tylko cytat** (Cormorant italic) rozjaśniany słowo po słowie scrollem + CTA |
| `op` (opinie) | certyfikat + h2 + ocena „Google 5,0 ★★★★★" + karuzela 3 kart opinii + link „Zobacz więcej opinii w Google" | dwa **marquee** (6 opinii, przeciwbieżne, pętla) |
| `ko` (kontakt) | tło kaszmir blur(7px) + tint, kicker/h2/lead + wiersze TELEFON / E-MAIL (jawne `tel:`/`mailto:` w eksporcie) | wyśrodkowany finał: h2/lead + duży przycisk „Skontaktuj się z nami" → /kontakt/ + pigułki tel/mail; powolne odzoomowanie tła scrollem |

Mechanika eksportu: reveale `[data-rev]` (IO, tylko mobile), parallax
`[data-par]` (rAF), sekcje przypięte = zwykłe `position:sticky` + postęp
liczony z `scrollY` w rAF (bez GSAP — GSAP w eksporcie obsługuje tylko
atrybuty `data-rise/wipe/words`, których strona główna nie używa).
Navbar: `data-nav="over"`, postęp `--p` mierzony z `[data-navref]`
na `hero-d` — dokładnie wariant zaimplementowany w 4.1.

**Czego w designie NIE ma**: globalnego crossfade'u tła (sekcje mają
własne, statyczne tła — biel/cream/ciemne) → `bg-crossfade.ts` /
`AmbientBackground` **nie wchodzą** na stronę główną; sceny urządzeń
z szablonu (instrukcja: „BEZ sceny urządzeń"); linku „Proces współpracy"
w desktopowym viewporcie poza stopką (świadome — D-CH4).

## 2. Decyzje portu

### D-SG1. Struktura: nowe `sections/home/*`, szkielet znika

`Home.astro` zostaje kompozytorem: `Navbar variant="over"` + sekcje +
`Footer`. Sekcje jako komponenty `src/components/sections/home/`:
`HomeHero.astro` (oba warianty hero), `HomeTrust.astro` (trust+logos),
`HomeOferta.astro`, `HomeProces.astro`, `HomeRealizacje.astro`,
`HomeAbout.astro`, `HomeOpinie.astro`, `HomeKontakt.astro` + wspólne
`home-config.ts` (stała `HOME_DESKTOP_MIN_PX = 1024` importowana przez
testy — para z `@media`, reguła sections.md) i `home-scroll.ts` (całość
ruchu, patrz D-SG9). Teksty sekcji **inline w komponentach** (PL-only,
jedna strona-konsument; `ui.ts` tylko tam, gdzie treść współdzielą testy
lub inne widoki — jak dziś WorkDetail).

### D-SG2. Hero: dwa warianty jak w eksporcie; h1 widoczny na każdym progu

Port 1:1: mobile `section.hero` (zdjęcie + tekst + CTA → `/kontakt/`,
wysokość `calc(100dvh - var(--hdr-h, 74px))` — zmienną dostarcza navbar
4.1), desktop `div.hero-d` z czterema kadrami i typografią SVG
(clip-path po tekście `<text>` + glow + pan — czysty CSS/SVG, zero JS).
`data-navref` na `hero-d` (mierzy go skrypt `over` z 4.1; na mobile
wariant `over` i tak nie stylizuje paska — pasek biały jak wszędzie).

**h1 (smoke asertuje `main h1` widoczny na wszystkich 6 profilach)**:
h1 żyje w hero mobile (widoczny nagłówek designu); `hero-d` dostaje ten
sam tekst jako `h1` wizualnie ukryty wzorcem sr-only (clip 1×1 px — dla
Playwrighta „widoczny": niepusty box bez `visibility:hidden`; dla
czytelnika ekranu to nagłówek strony, bo desktopowy hero nagłówka
tekstowego nie ma). Na każdym progu dokładnie jeden h1 w drzewie
dostępności (drugi siedzi w gałęzi `display:none`).

Animacje hero = „umiarkowane" z instrukcji: crossfade/Ken Burns to
czasowe animacje CSS (visual testy zamraża `freeze.css`), parallax
mobile w `home-scroll` (motion-gate). `prefers-reduced-motion: reduce`:
kadry 2–4 i ich grupy SVG dostają `animation:none` + `opacity:0`
(zostaje statyczny pierwszy kadr), parallax nie startuje.

### D-SG3. Priorytety ładowania (hero = nowy LCP)

Wszystkie obrazy sekcji statycznie przez `scripts/optimize-images.mjs`
→ WebP w `src/assets/` (media realizacji — wyjątek, R2 + `imgAt()`).
Hero mobile: ~1080 px, `fetchpriority="high"`, bez lazy. Hero desktop:
kadr 1 `fetchpriority="high"`, kadry 2–4 `loading="lazy"`
(w viewporcie — i tak się pobiorą, ale po LCP); obrazy w SVG używają
**tych samych URL-i** co kadry (jeden fetch na plik, jak w eksporcie).
Wszystko poniżej foldu `loading="lazy"` + `decoding="async"`; każdemu
`<img>` jawne wymiary (CLS ≤ 0.02). Tło `ko` i kafle: mniejsze/mocniej
skompresowane warianty (tło jest pod blur — wzorzec `menu-sheet-bg`).
Budżety: mobile LCP 2563/3500 przed hero, total 2 MB — po implementacji
**mierzę w CI i raportuję wynik Mateuszowi przed uznaniem części za
skończoną**; jak blisko progu → decyzja Mateusza (osobny commit progów).

### D-SG4. Oferta: dane zajawki lokalne, sługi z designu bez zmian w `categories.ts`

Kafle zajawki = treści marketingowe eksportu 1:1 (6 pozycji, własne
podpisy „Zabudowa + AGD" itd., mobile pokazuje 3 oznaczone `m:1`) —
lokalna tablica w `HomeOferta.astro`, linki całych kafli i CTA →
`/oferta/` (kotwice per kategoria to sprawa 4.3). `categories.ts`
(D2, kontrakt CMS) **nietknięte**. Karuzela mobile: gotchas sections.md
— `data-lenis-prevent-horizontal` + `scroll-snap-stop: always`.
Desktop: sekcja przypięta (300vh) — mechanika w D-SG9; licznik
„01 / 06" i CTA w pasie pod kaflami (port skryptu `fitCta` z eksportu).

### D-SG5. Proces: 4 kroki z eksportu, CTA tylko mobile

Treści kroków (tag/tytuł/opisy/zdjęcia) 1:1; zdjęcia kroków renderowane
tylko w gałęzi desktop. Linia postępu i reveale w `home-scroll`.
Za designem: desktop **bez** CTA do procesu (trasa żyje w stopce —
D-CH4); mobile z CTA `btn-out`.

### D-SG6. Realizacje: dane z kolekcji, kafle otwierają Modal/BottomSheet

Dane: top 3 wpisy `getCollection("realizacje")` wg `order` →
`viewProject` (wzorzec Work.astro); mapowanie na design: meta/pill =
`categoryLabel`, tytuł, opis, zdjęcie = `cover` przez `imgAt()`.
Kafle **nie nawigują** (jak w eksporcie) tylko otwierają detal
(instrukcja): `<template data-work-detail>` + hosty `Modal`/`BottomSheet`
+ `openWorkDetail` — komplet współdzielony z `/realizacje/` bez zmian.
Karty niosą kontrakt `data-work-slug`/`data-work-name` (minimalna
adaptacja speców). Desktop (scena przypięta): klik w stos zdjęć otwiera
detal **bieżącej** realizacji (indeks z postępu); mobile: tap w kartę.
Linki „Więcej" (w tekstach desktop) i CTA „Przeglądaj nasze realizacje"
→ `/realizacje/` z `data-work-more` (testy dojścia).

Próg modal↔sheet zostaje wspólny (`open-detail.ts`, 760 px) — jego
wyrównanie do 1024 to plan części 4.4 (razem z `/realizacje/`); między
760 a 1023 px otworzy się Modal, co jest spójne z dzisiejszym
zachowaniem podstrony i nie ma pokrycia profilem testowym. Świadome
odroczenie, nie przeoczenie.

### D-SG7. O nas + opinie: port z korektami kontrastu (pusta allowlista axe)

`abt` 1:1 (zdjęcie `adam-hero` tylko mobile; desktop cytat słowo po
słowie). `op`: dane 6 opinii z eksportu (prawdziwe opinie Google) jako
lokalna tablica; mobile karuzela (te same gotchas co oferta) + link do
Google (`rel="noopener"`), desktop dwa marquee — **drugi obieg kart
(duplikat pętli) `aria-hidden`**, przy reduce marquee stoi (statyczny
pierwszy obieg). Korekty pod ratchet axe (wzorzec D-CH7.5 — hierarchia
rozmiarem, nie kontrastem):

1. **Gwiazdki `★` jako inline SVG `aria-hidden`** (znak `★` to tekst —
   `#f2a90c` na bieli/cream ma ~2:1 i wywala color-contrast; ocena
   liczbowa „5,0" zostaje tekstem AA).
2. Inicjały awatarów: kolory z eksportu (`#7d8a94`, `#e8710a`…) mają
   <4.5:1 z białym inicjałem — przyciemniam tła do AA z zachowaniem
   odcieni.
3. Drobne teksty `.62/.5/.55` na jasnych tłach → min. 0.64 (`--faint`);
   `trust` span, `oc-meta`, `ko-lbl`/`kick` na ciemnym tle → jasność
   min. rgba(255,255,255,.7) (jak sheet-call 4.1).

### D-SG8. Banner kontaktu `ko`: kotwica `#contact`, tel/mail wg D-CH5

Sekcja `ko` dostaje `id="contact"` (stare linki `/#contact` i kontrakt
testów lądują na bannerze). CTA → `/kontakt/`. Wiersze/pigułki
TELEFON / E-MAIL: eksport ma jawne `tel:`/`mailto:` — stosuję
antyscraping D-CH5. Wiersz jest całym linkiem z ikoną i etykietą,
a `fillContactSlots` podmienia dziś `textContent` całej kotwicy —
**rozszerzam `contact-details.ts`**: gdy kotwica `[data-tel]`/
`[data-mail]` zawiera wewnętrzny slot `[data-slot]`, tekst trafia do
slotu, `href` na kotwicę (zmiana wstecznie zgodna; unit test w tym PR).
Sloty startują `hidden` z placeholderem `href="/kontakt/"` — bez JS
banner pokazuje CTA, bez numerów (spójnie z chrome). Navbar woła
`fillContactSlots()` na całym dokumencie — wiersze `ko` wypełniają się
bez nowego JS. Desktopowe odzoomowanie tła w `home-scroll`.

Szablonowy `KontaktBaner.astro` + `kontakt-baner-scroll.ts` (dotychczas
nieużywane — szkielet ich nie renderował) **kasuję** w tym PR razem
z adaptacją testów bannera. Tak samo szablonowa rodzina sekcji work
strony głównej: `Work.astro`, `WorkCard`, `WorkCarousel`,
`WorkCarouselCard` (+ `WorkMoreButton`, jeśli po porcie nikt go nie
importuje — weryfikacja typecheckiem); zostają komponenty podstrony
i detalu (`WorkIndexCard`, `WorkDetail`, `open-detail`). Osierocone
klucze `ui.ts` sprzątam przy okazji (typecheck pilnuje).

### D-SG9. Ruch: `home-scroll.ts` bez GSAP (port mechaniki eksportu), motion-gate

Cała mechanika scrolla strony głównej to w eksporcie ~150 linii vanilla
(IO + rAF + sticky). Portuję ją wprost w `home-scroll.ts` **bez GSAP**:

- `[data-rev]` (mobile) — jeden IntersectionObserver;
- parallax `[data-par]` — wspólna pętla rAF;
- sceny przypięte oferta/realizacje — postęp z `scrollY` → transform
  toru / clip-path stosu / licznik / pasek / pill;
- linia procesu, reveale kroków, cytat słowo-po-słowie, zoom tła `ko`.

Uzasadnienie: GSAP+ScrollTrigger to ~27 KB gzip — budżet skryptu
(59,6/100 KB) wolę zostawić na Etap 5, a helpery `section-helpers.ts`
(gsap-owe) nie dają tu nic ponad to, co eksport już ma zaimplementowane
(sticky+rAF współpracuje z Lenisem tak samo). To nie kopiowanie bloków
między sekcjami (reguła sections.md) — to jeden moduł jednej strony.

Bramka jak w regułach: `home-scroll` ładowany **dynamicznie tylko przy
`prefers-reduced-motion: no-preference`**; stany startowe animacji
(np. `opacity:0` revealów) uzbraja dopiero klasa `.js-motion` dodawana
przy załadowaniu modułu — bez JS i przy reduce strona renderuje pełną,
statyczną treść. Sceny przypięte analogicznie: wysokość 300vh/sticky
uzbraja klasa; fallback (reduce/no-JS, desktop) = sekcja w flow,
tor kategorii jako zwykły `overflow-x: auto`, stos realizacji jako
kolumna kart (wariant mobilny układu).

### D-SG10. Meta strony głównej

Tytuł zostaje domyślny z BaseLayout („Delung Meble — meble na wymiar").
Dokładam `description` (dotąd strona główna była bez — szkielet):
skrót leadu hero, spójny z opisami podstron. Sitemap/canonical bez
zmian.

## 3. Kontrakty selektorów i testów

| Kontrakt | Los |
| --- | --- |
| `main h1` (smoke, navigation) | spełnia hero (D-SG2) — specy bez zmian |
| `#contact` na `/` | banner `ko` (D-SG8) |
| `#contact .kt-form` = 0 na `/` | dalej prawda (formularz tylko na podstronie) |
| `.kt-cta__*`, `.ktb-foot .ft`, zoom scrub (contact-index) | **usunięte** — elementy szablonu bez odpowiednika w designie; w to miejsce asercje designu (CTA href, sloty tel/mail po JS) |
| `data-work-slug` / `data-work-name` | zostają na kartach zajawki realizacji |
| `#work-modal` / `#work-sheet` / `.wdx__title` / `[data-overlay-close]` | bez zmian (współdzielone z `/realizacje/`) |
| `.work__gallery`, `.wk-car`, `.work__more-wrap` | **zastąpione** klasami designu (`re-cards`, karty `rc`) — adaptacja w specach |
| `a[data-work-more]` | zostaje (CTA + „Więcej" → `/realizacje/`) |
| `[data-navref]` | `hero-d` (kontrakt navbara `over` z 4.1) |
| nowe | `HOME_DESKTOP_MIN_PX` (import w testach), `[data-slot]` w kotwicach tel/mail |

## 4. Plan implementacji

1. Assety: `optimize-images.mjs` — hero mobile + 4 kadry desktop,
   6 kafli kategorii, 4 zdjęcia kroków, `adam-hero`, certyfikat,
   6 logotypów, tło `ko` (mocna kompresja pod blur) → `src/assets/home/`.
2. `contact-details.ts` — wariant slotu wewnętrznego (D-SG8) + unit test.
3. Komponenty `sections/home/*` + `home-config.ts` (markup + CSS 1:1
   z eksportu, tokeny global.css, breakpoint 1024, korekty kontrastu
   D-SG7).
4. `home-scroll.ts` + bramka motion w `Home.astro`; `Home.astro`
   złożony na nowo (`Navbar variant="over"`, meta description).
5. Kasacja martwych komponentów szablonu (D-SG8) + sprzątnięcie kluczy
   `ui.ts` (typecheck).
6. Adaptacja + odskipowanie testów (niżej), nowy spec visual.
7. Baseline'y w świętej kolejności; PR `feat/etap-4-2-strona-glowna`.

## 5. Testy

- **Unit**: rozszerzenie `contact-details.test.ts` (slot wewnętrzny).
- **E2E**:
  - `work.spec.ts` — odskip, selektory designu: desktop klik w stos →
    Modal bieżącej realizacji; mobile tap w kartę → BottomSheet; licznik
    kart = min(3, liczba wpisów).
  - `work-index.spec.ts` describe „dojście ze strony głównej" — odskip,
    **przepisany PL-only** (bez pętli `/en/`): wszystkie `a[data-work-more]`
    na `/` mają href `/realizacje/`; desktop CTA i mobile CTA nawigują
    na podstronę (`.wix-grid` widoczna).
  - `contact-index.spec.ts` describe „banner na stronie głównej" —
    odskip i adaptacja: `#contact` attached, bez `.kt-form`, CTA →
    `/kontakt/`, sloty tel/mail wypełnione po JS (i nieobecne w surowym
    HTML — kontrakt antyscrapingowy `contact.spec.ts` kryje `dist/`
    globalnie, bez zmian).
  - smoke / navigation / seo / a11y — **bez zmian speców**; nowa strona
    musi przejść (w tym pustą allowlistę axe — stąd D-SG7).
- **Visual**: nowy `tests/visual/index.spec.ts` — element-zrzuty sekcji
  po `prepareSweep` (freeze zamraża crossfade hero i marquee) na
  6 profilach: hero, trust+logos, oferta, proces, realizacje (stan
  spoczynkowy), o-nas, opinie, `#contact`; dodatkowo mini-sweep scen
  przypiętych (oferta, realizacje — 3 klatki postępu) tylko na
  `chromium-1920` (wzorzec `SWEEP_PROJECTS`, bez mnożenia baseline'ów).
  Odświeżą się baseline'y `chrome-sheet` (zrzut całej strony `/` pod
  sheetem — tło się zmienia); `chrome-bar` (na `/realizacje/`)
  i komplety podstron zostają. Święta kolejność: kod → workflow linux
  z brancha PR → `git pull` → lokalny `pnpm test:visual:update` →
  commit darwin NA KOŃCU.

## 6. Ryzyka i weryfikacja na fizycznym telefonie

> **Korekta po testach 4.2 na smartfonach (2026-07-31):**
>
> 1. Scroll na dotyku klatkował — winna gałąź touch Lenisa (`syncTouch`
>    = preventDefault + scroll pędzony JS-em na main thread, drogi przy
>    pełnoekranowych sekcjach). Decyzja Mateusza: **dotyk = scroll
>    natywny, Lenis tylko desktop** (delung — inaczej niż hadrianm — nie
>    ma na mobile mechaniki wymagającej Lenisa). Gałąź touch + guardy
>    pinch/zoom usunięte ze `smooth-scroll.ts`; reguły zaktualizowane
>    (`.claude/rules/scroll-lenis.md`). Konsumenci `window.__lenis` mają
>    fallbacki natywne — zero zmian kontraktów.
 > 2. Nagłówek hero mobile renderował się 16 px zamiast ~36 px: po
>    zamianie na `<p class="hero-head">` (D-SG2/strict mode) selektor
>    leada `.hero p` wygrywał specyficznością z `.hero-head` i zgniatał
>    font-size. Lead dostał klasę `.hero-lead` — koniec selektorów
>    elementowych na tekstach hero.
> 3. Kadr zdjęcia hero mobile podniesiony o 130 px względem eksportu
>    (wysokość elementu +130 / margines −130 — pokrycie dołu sekcji bez
>    zmian): na niskich ekranach (iPhone SE/12 mini) nagłówek lądował NA
>    jasnej krawędzi blatu ze zdjęcia — ma być zawsze POD nią z
>    marginesem (czytelność).
> 4. Reveal `[data-rev]`: elementy pierwszego ekranu odsłaniane od razu
>    przy inicie — `rootMargin -10%` obserwera (1:1 z eksportu) nie
>    uznawał dolnego pasa viewportu za „w kadrze" i CTA hero czekało
>    z opacity 0 na pierwszy ruch palcem.
> 5. Chowany pasek URL przeglądarek mobilnych szarpał tekstem hero po
>    zdjęciu: wysokość hero przeszła z `100dvh` (żyje z paskiem) na
>    `100svh` (stała; po schowaniu paska pod hero wcześniej widać pasek
>    zaufania — akceptowalny standard), a `home-scroll` liczy parallax
>    i postępy ze STAŁEJ wysokości viewportu (sonda `100svh` zamiast
>    `innerHeight`, który skacze przy zwijaniu paska).
> 6. Jakość zdjęcia hero mobile + transfer (decyzja Mateusza: wariant
>    „B + fix transferu"): kadr mobile pokazuje tylko lewy pas zdjęcia,
>    więc `hero-mobile.webp` to teraz PRZYCIĘTY wycinek źródła w pełnej
>    rozdzielczości (1984×1648, q78, 496 KB; krop [L=96, W=1984] wyliczony
>    regułą R=2944−9·L, żeby `object-position: 10%` dawał identyczny kadr
>    na każdym viewporcie — komenda regeneracji w komentarzu HomeHero).
>    Fix transferu: `display:none` nie zatrzymuje pobierania obrazów —
>    telefon ściągał 672 KB kadrów desktopowych (w tym przez `<image>`
>    w SVG), desktop zdjęcie mobilne. Oba hero spięte w `<picture>`
>    z realnym URL-em w `<source media>` i blankiem w `img src`
>    (speculative preload scanner Chromium pobiera `img@src` niezależnie
>    od source'ów — w tym układzie podąża za media); kadry w masce SVG
>    dostają `href` skryptem tylko przy ≥1024 (bez JS: tekst z ciemnym
>    wypełnieniem + glow). Zmierzone: mobile pobiera wyłącznie swój plik,
>    desktop wyłącznie 4 kadry.
> 7. Kadr hero mobile sparametryzowany i SKALIBROWANY przez Mateusza na
>    fizycznym telefonie (strojenie na pełnym źródle przez `pnpm dev
>    --host`): `--hero-zoom: 0.9` / `--hero-x: 25%` / `--hero-up: 270px`
>    (zmienne w `HomeHero.astro` — zoom 1 = zdjęcie na wysokość sekcji,
>    x = kotwica pozioma, up = podniesienie; +240px stałego zapasu na
>    parallax, formuła nie pozwala odsłonić dołu sekcji). Po kalibracji
>    plik przycięty ponownie pod nową kotwicę (L=240, W=1984, q78,
>    500 KB; reguła R = 2944 − L·(1−P)/P). Zmiana kalibracji w
>    przyszłości = przelicz krop na pełnym źródle (komentarz w
>    komponencie).
> 8. LHCI mobile po 4.2: LCP = zdjęcie hero — pierwszy pomiar CI 6.4 s
>    (rozbicie: start pobierania +1.9 s w kolejce za fontami, render
>    ~3 s na CPU ×4). Optymalizacje: wariant gęstości `srcset`
>    (DPR ≤1.8 — klasa Moto G/emulacja LH — dostaje 174 KB; DPR ≥2
>    pełną, skalibrowaną jakość) + `<link rel=preload as=image
>    imagesrcset media>` w head (obraz startuje ~80 ms po TTFB) →
>    ~5.1 s. Piksele profili testowych bez zmian (DPR ≥2) — baseline'y
>    nietknięte. Progi mobile podniesione decyzją Mateusza (osobny
>    commit): LCP 3500→6000, perf 0.9→0.75, fonty warn 5→6 (italic
>    cytatu); desktop bez zmian (lokalnie 1.6 s / 0.92). Zacieśnienie
>    do baseline'u CI = domknięcie 4.5.

> **KOREKTA po testach klienckich (2026-08-02, runda poprawek — PR A;
> uzasadnienie: `docs/analiza-poprawki-wizualne.md`, D-P1/D-P2):**
>
> 1. **D-SG4 — kafle zajawki przestały linkować gołą `/oferta/`.** Każdy
>    kafel niesie SLUG kategorii (dane wyjechały do
>    `home-oferta-content.ts` pod unit test kontraktu): na desktopie
>    linkuje `/oferta/#<slug>` i otwiera TĘ zakładkę (wcześniej zawsze
>    lądowała pierwsza — „Kuchnie i sprzęt AGD"), poniżej progu desktop
>    tap otwiera kartę kategorii `#kat-<slug>` W MIEJSCU, bez opuszczania
>    strony głównej (współdzielony `KategorieSheets.astro` renderowany
>    obok `<Footer />`). `categories.ts` i treści marketingowe kafli —
>    bez zmian. CTA „Zobacz pełną ofertę" dalej nawiguje na `/oferta/`.
> 2. **D-SG5 — desktop DOSTAJE CTA do procesu** (PR B tej samej rundy).
>    „Za designem: desktop bez CTA" przestaje obowiązywać — eksport tego
>    przycisku nie ma, ale bez niego z sekcji nie dało się wejść na
>    `/proces-wspolpracy/` inaczej niż stopką (świadoma dewiacja od
>    designu na życzenie Mateusza). `.pr-cta` widoczne także ≥1024:
>    wariant `out`, wyśrodkowany pod osią kroków (nagłówek sekcji na
>    desktopie też jest wyśrodkowany), odstęp `clamp(26px, 2.78vw, 40px)`.
>    **D-CH4 zostaje nietknięte** — „Proces współpracy" dalej NIE wchodzi
>    do navbara, żyje w stopce i teraz w CTA tej sekcji.
> 3. **Hover CTA nigdy półprzezroczysty** (D-P4): `.of-cta .btn-dark:hover`
>    zamieniało białe tło na `rgba(26,26,26,.05)`, więc przez przycisk
>    prześwitywały kafle toru (widoczne zwłaszcza na niskim ekranie, gdzie
>    CTA sceny przypiętej leży na zdjęciach) — teraz `#f2f2f2`, czyli te
>    same 5 % czerni wypełnieniem.

- **LCP mobile** (hero pełnoekranowe): najpoważniejszy budżet —
  2563/3500 ms przed hero. Mitigacje D-SG3; wynik z CI raportuję przed
  domknięciem części.
- **Total 2 MB desktop**: 4 kadry hero — trzymam kompresję; w razie
  potrzeby zejdę z jakością kadrów 2–4 (za crossfadem lekka strata
  niezauważalna).
- **Axe**: gwiazdki/awatary/kontrasty — rozwiązane w D-SG7; zero nowych
  wpisów allowlisty.
- **Dwa h1 w DOM** (D-SG2): na każdym progu jeden w drzewie
  dostępności; sr-only przechodzi `toBeVisible` Playwrighta (niepusty
  box) — gdyby smoke na tym poległ, alternatywą jest widoczny h1
  w rogu hero-d stylizowany jak kicker (decyzja wtedy u Mateusza).
- **Fizyczny telefon** (emulacja nie wykryje): snap karuzel oferty
  i opinii (dotyk), hero `100dvh` przy zwijanym toolbarze iOS Safari
  (czy CTA nie chowa się pod paskiem), płynność parallaxu i crossfade'u
  hero na Androidzie (warstwy GPU), marquee opinii (klatkowanie),
  otwarcie BottomSheet realizacji z karty. Wskażę listę po implementacji.

## 7. Definition of done (kontekst wspólny)

Mini-analiza + wpis w `docs/README.md`; zielone `typecheck`, `lint`,
`test:unit`, `test:e2e` (6 profili), `test:visual`; oba komplety
baseline'ów w PR (święta kolejność); allowlista axe pusta; breakpoint
1024 w sekcjach; strona główna nie importowała `legacy-dark.css` (nic
do usunięcia); PR zielony na `quality`+`e2e`+`lighthouse` + raport LCP
dla Mateusza; po merge'u prod-smoke; aktualizacja CLAUDE.md (4.2 + PR).
