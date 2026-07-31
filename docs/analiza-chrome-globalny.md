# Analiza — chrome globalny (Etap 4, część 4.1)

Port chrome'u wspólnego wszystkich stron na design delung: navbar
(`hdr`/`hdr-nav`), menu mobilne jako bottom sheet (`sheet-*`), stopka
(`ft`). Cel nadrzędny (decyzja Mateusza przy akceptacji analizy,
2026-07-31): wygląd i zachowanie **1:1 z designami** — wizualne
pozostałości szablonu bez odwzorowania we wzorcu docelowo znikają.

Referencje: `docs/design/index.html` (chrome kompletny: hdr `over`,
sheet, ft), `docs/design/realizacje.html` / `oferta.html` /
`polityka-prywatnosci.html` / `kategorie.html` (wariant `hdr plain`),
`docs/design/o-nas.html` / `proces.html` (markup `hdr dark` — klasa
**bez żadnego CSS** w eksportach; realnie to ten sam wariant `over`).

## 1. Co mówią eksporty (anatomia chrome'u)

**Navbar mobile (<1024)** — identyczny na wszystkich stronach: biały
sticky pasek (logo ciemne po lewej, przycisk „MENU" z trzema kreskami po
prawej), zawsze widoczny (bez chowania przy scrollu). Otwarte menu:
kreski morfują w „X", pasek zostaje POD scrimem (przygaszony).

**Navbar desktop (≥1024)** — dwa warianty:

| Wariant | Strony w designach | Zachowanie |
| --- | --- | --- |
| `over` (`data-nav="over"`) | index, kontakt, o-nas, proces | pasek transparentny nad hero (ujemny margines), scrim-gradient od góry; linki i logo białe; scroll napędza `--p` 0→1: wjeżdża białe tło, logo krzyżuje się na ciemne, linki ciemnieją (`color-mix`) |
| `plain` (`data-nav="solid"`) | oferta, kategorie, realizacje, polityka | zwykły biały sticky pasek z hairline na dole, w flow (bez nakładania) |

Wspólne desktop: 4 linki (animacja „przewracanych liter" — mamy ją już
w obecnym Navbarze), pill telefoniczny `+48 690 291 143` (na `plain`
ciemny, na `over` biały→ciemny wg `--p`).

**Menu mobile = bottom sheet**: wysuwa się od dołu (radius 22px góra),
tło = rozmyte zdjęcie (`kaszmir-wood1.png`, blur 22px) + ciemny tint
0.44, grab-handle, 4 duże linki (stagger wejścia), sekcja „ZADZWOŃ DO
NAS" z numerem. Zamykanie: scrim, klik linku, Esc. Brak przycisku „X"
i brak gestu swipe-down w eksporcie — gest dodaje nasz `overlay.ts`.

**Stopka `ft`**: ciemna (#161616). Mobile: logo (wariant footer) → lista
linków z hairline'ami → „ZADZWOŃ DO NAS" (tel, mail, godziny) → pigułki
social → pasek prawny (©, dane firmy, „Realizacja: hadrianm"). Desktop:
grid 3 kolumny (logo+opis / STRONY / ZADZWOŃ DO NAS) + pasek prawny
w wierszu; `.ft-soc` na desktopie **ukryte**.

**Czego w designach NIE ma**: pozycji „Proces współpracy" w nawigacji
(navbar, sheet i stopka — proces linkują tylko CTA na index/oferta),
BackButtona, chowania paska przy scrollu, linku „Do góry", linku
polityki na mobile (klasa `dOnly`), Instagrama na desktopie.

## 2. Decyzje portu

### D-CH1. Pasek: sticky, bez hide-on-scroll (kasujemy `data-hidden`)

Obecny navbar szablonu jest `fixed` + chowa się przy scrollu w dół
(`data-hidden`). Design: `sticky`, zawsze widoczny — pasek jest niski
i biały, nie ma czego chować. **Portujemy zachowanie designu**:
`position: sticky` w flow (wariant `over` nakłada się na hero ujemnym
marginesem — mechanizm z eksportu). Cały aparat hide-on-scroll
(scroll-delta, hover-reveal przy górnej krawędzi, `data-hidden`) znika.
Test „pasek chowa się przy scrollu" w `navigation.spec.ts` zastępuję
testem odwrotnym: po scrollu na dno pasek **pozostaje widoczny**
(sticky) — w tym samym PR.

Konsekwencja przejściowa: strony nieportowane (work/contact/policy,
szkielety) mają padding-top liczony pod pasek `fixed` — ze sticky
dostaną trochę nadmiarowego światła u góry. Akceptujemy (znika z portem
każdego widoku, baseline'y i tak aktualizujemy w tym PR).

### D-CH2. Breakpoint 1024, koniec pomiarów JS

Obecne stany desktop/tablet/mobile liczone z pomiaru szerokości treści
znikają. Design ma prosty próg: **<1024 mobile, ≥1024 desktop**. Stała
`NAV_DESKTOP_MIN_PX = 1024` w nowym `src/components/navbar/nav-config.ts`
(importują ją testy) + ten sam próg w `@media` komponentu — W PARZE
(reguła sections.md). Stan `tablet` i cała maszyneria `measure()/apply()`
usunięte.

### D-CH3. Warianty `over`/`plain` — oba w 4.1, prop komponentu

`Navbar.astro` dostaje prop `variant: "plain" | "over"` (domyślnie
`plain`). W 4.1 implementuję pełną mechanikę obu (markup `hdr-bg` +
`hdr-scrim`, skrypt `--p` z progresu scrolla nad `[data-navref]`),
ale **wszystkie strony na razie renderują `plain`** — wariant `over`
potrzebuje hero pod spodem (białe logo na białym szkielecie byłoby
niewidoczne). Aktywacja `over`: strona główna w 4.2, o-nas/proces
w 4.5, kontakt w Etapie 5. Klasy `dark` z eksportów nie przenoszę
(martwa — zero CSS).

### D-CH4. Pozycje nawigacji: 4 wg designu, „Proces" schodzi do stopki

Design konsekwentnie (navbar + sheet) ma **Oferta / Realizacje / O nas /
Kontakt** — „Proces współpracy" jest linkowany wyłącznie z CTA sekcji.
Idę za designem: `nav.ts` zawęża pozycje navbara do 4 (slug/trasa
zostają — `routes.ts` bez zmian). Żeby trasa nie osierociała do czasu
4.2/4.3 (CTA), **dodaję „Proces współpracy" do nawigacji stopki**
(mała, świadoma dewiacja od designu — stopka to naturalne miejsce na
pełną mapę strony). Test „pozycja Proces współpracy w panelu" adaptuję
na klik linku w stopce.

### D-CH5. Telefon i mail w chrome: składane w JS (wzorzec polityki)

Design ma jawne `tel:`/`mailto:` w pasku, sheecie i stopce — to by
unieważniło antyscraping z polityki i sekcji kontaktu. Stosuję wzorzec
z `PolicyPage` (Etap 3): fragmenty numeru/adresu w stałych JS, tekst
i `href` składane po załadowaniu (`+48 690 291 143`,
`kontakt@delung.pl`). Sloty startują `hidden` z placeholderem
`href="/kontakt/"` (poprawny link semantycznie — lint a11y; bez JS
chrome nie pokazuje numeru, tak samo jak polityka; menu mobilne i tak
wymaga JS). Fragmenty w jednym module `src/lib/contact-details.ts` —
pasek, sheet i stopka czytają z jednego miejsca, polityka może przejść
na niego przy 4.5.

Konsekwencja testowa (ustalona przy implementacji): kontrakt
antyscrapingowy w `contact.spec.ts` sprawdzał `page.content()` — DOM
**po** wykonaniu JS. Chrome z designu pokazuje numer po załadowaniu,
więc DOM po JS z definicji zawiera pełne ciągi. Duch kontraktu to
„nic w statycznym źródle": asercja przechodzi na SUROWY HTML z sieci
(`page.request.get`), a grep całego `dist/` (HTML+JS+CSS) zostaje bez
zmian.

### D-CH6. Bottom sheet menu: markup w Navbarze na surowym `overlay.ts`

**Nie** reużywam `BottomSheet.astro` (ciemny motyw szablonu, przycisk
„X", `max-width: 520px` — design sheeta jest full-width, bez X, z własną
stylistyką). Sheet dostaje własny markup w `Navbar.astro` z kontraktem
overlaya: `data-overlay` + `data-overlay-kind="sheet"` +
`data-overlay-panel` + `data-overlay-drag` (grab-handle), `id="nav-sheet"`,
`role="dialog"` `aria-modal="true"`. Za darmo z `overlay.ts`: focus-trap,
Esc, klik w scrim, **swipe-down**, blokada scrolla (Lenis stop + body
fixed), portal do `<body>`.

Szczegóły:

- Burger (`data-burger`, tekst „MENU" + kreski→X jak w designie) woła
  `overlay.open("nav-sheet")`; stan `data-open` na `[data-nav]` +
  `aria-expanded` synchronizowane przez callback `onClose` (gest,
  Esc i scrim domykają stan navbara).
- Jak w designie: pasek zostaje pod scrimem (przygaszony). Zamykanie:
  scrim / link / Esc / swipe-down. Klik linku = zwykła nawigacja
  (strona i tak się przeładowuje).
- Przejście ≥1024 przy otwartym sheecie **zamyka go** (listener
  `matchMedia` — reguła sections.md o spójnym stanie nakładek).
- Tło sheeta: `docs/design/assets/img/kaszmir-wood1.png` →
  `scripts/optimize-images.mjs` → `src/assets/menu-sheet-bg.webp`
  (~960 px, mocniej skompresowany — i tak jest pod blur(22px));
  stagger linków i fade `sheet-call` 1:1 z eksportu;
  `prefers-reduced-motion` → bez animacji (obsługuje overlay + CSS).

### D-CH7. Stopka: port `ft` z celowymi dewiacjami

Port markupu i layoutu 1:1 (mobile stack / desktop grid 3 kolumny +
pasek prawny), z następującymi zmianami:

1. **Social: tylko Instagram** (`https://www.instagram.com/delung_meble/`,
   pigułka z ikoną jak w designie), Facebook usunięty (decyzja D4).
2. **Instagram widoczny też na desktopie** — design chowa `.ft-soc`
   na ≥1024, przez co IG znika z całej strony; pigułkę pokazuję
   w kolumnie „ZADZWOŃ DO NAS" pod godzinami. (Dewiacja — do Twojej
   akceptacji.)
3. **Link polityki widoczny też na mobile** (design daje mu `dOnly`;
   wymóg instrukcji — link polityki w stopce bez gwiazdek).
4. **+ „Proces współpracy"** w linkach stopki (D-CH4).
5. **Kontrasty podbite do AA** (pusta allowlista axe to ratchet):
   drobne teksty stopki z designu mają alpha .28–.45 na #161616 —
   podnoszę do min. rgba(255,255,255,.64) (wzorzec `--faint` z Etapu 3);
   hierarchia rozmiarów/wag zostaje, „szarość" uzyskuję rozmiarem,
   nie kontrastem.
6. Bez „Do góry ↑" z obecnej stopki (nie ma go w designie).

Treści z designu zostają: opis (desktop), godziny „Pod telefonem pn–pt
praktycznie całą dobę", © 2026 Delung Meble, dane firmy (Delung Meble
Adam Delung · Strażacka 27a, 98-300 Gaszyn · NIP 7312021984),
„Realizacja: hadrianm". Tel/mail wg D-CH5 (składane w JS). Logo:
istniejący `delung-logo-footer.webp`.

### D-CH8. BackButton: NIE wchodzi do chrome'u (decyzja Mateusza)

Designy nie mają BackButtona i **na razie go nie dodajemy** — jedyna
nawigacja to logo (brand), linki navbara/sheeta i linki w treści
stron. Ewentualny powrót przycisku = osobna decyzja PO wszystkich
etapach instrukcji.

Konsekwencje:

- Podstrony pokazują normalny pasek z logo (jak design) — prop
  `showBrand` i wzorzec „BackButton w slocie brandu" znikają; razem
  z nimi `brand-menu` i flaga `html[data-nav-open]`.
- Osadzenia `<BackButton>` w `WorkIndexPage`/`ContactPage`/`PolicyPage`
  usuwam w tym PR.
- **Logika zostaje uśpiona**: `scripts/back-link.ts` + delegacja
  `a[data-back]` w `BaseLayout` bez zmian (gotowe na powrót przycisku);
  komponent `ui/BackButton.astro` zostaje w repo bez retheme'u
  (nieużywany — retheme dopiero przy ewentualnym dodaniu).
- Testy `.bkb`/podmiany brand↔back w `navigation.spec.ts` (i test
  BackButtona na `/kontakt/` z lekcji 5) usuwam w tym samym PR.

### D-CH9. Chrome niezależny od `legacy-dark.css`

Strony przejściowe nadpisują tokeny (`--ink` jasny itd.) — chrome
czytający tokeny strony miałby na nich biały tekst na białym pasku.
Navbar i stopka dostają **własne, lokalne zmienne kolorów designu**
(pasek: #fff/#1a1a1a/hairline rgba(26,26,26,.08); stopka: #161616 +
biele) — chrome wygląda identycznie na każdej stronie, niezależnie od
motywu przejściowego. Importów `legacy-dark.css` w tym PR nie ruszam
(to robota portów widoków 4.4–4.5).

## 3. Kontrakty selektorów (stary → nowy)

| Kontrakt | Los |
| --- | --- |
| `[data-nav]` | zostaje (root chrome'u) |
| `[data-burger]` | zostaje (przycisk „MENU") |
| `.nav-link` | zostaje (linki desktop) |
| `.m-link` | zostaje (linki w sheecie) |
| `data-open` | zostaje (na `[data-nav]` przy otwartym sheecie) |
| `.bkb` + `data-back` | **poza chrome** (D-CH8) — mechanizm `data-back` uśpiony w `BaseLayout`, testy usunięte |
| `.brand-menu` | **usunięty** (D-CH8) — testy podmiany logo↔back usunięte |
| `data-hidden` | **usunięty** (D-CH1) — test zastąpiony testem sticky |
| nowe | `#nav-sheet` (`data-overlay`), grab-handle `data-overlay-drag` |

## 4. Plan implementacji

1. `src/components/navbar/nav-config.ts` — `NAV_DESKTOP_MIN_PX = 1024`.
2. `src/lib/contact-details.ts` — fragmenty tel/mail + helper składania
   (D-CH5); unit test składania.
3. Asset: `node scripts/optimize-images.mjs docs/design/assets/img/kaszmir-wood1.png src/assets/menu-sheet-bg.webp 960` (jakość pod blur).
4. `Navbar.astro` — przepisany: markup `hdr` (logo, `hdr-nav` z pillem
   tel, `mbtn`), sheet (`data-overlay`), warianty `plain`/`over`,
   skrypt: `--p` dla `over`, toggle sheeta, domknięcie przy ≥1024,
   składanie tel.
5. `Footer.astro` — przepisany na `ft` (D-CH7).
6. `src/i18n/nav.ts` — 4 pozycje navbara + osobna lista stopki
   (z procesem i polityką); `ui.ts` — etykiety (menu, zadzwoń itd.).
7. Strony: `Home/SkeletonPage/kategorie` — bez zmian poza propami;
   `WorkIndexPage/ContactPage/PolicyPage` — usunięcie osadzeń
   `<BackButton>` i propa `showBrand` (D-CH8).
8. Bez zmian: `overlay.ts` (kontrakt wystarcza), `back-link.ts` +
   delegacja w `BaseLayout` (uśpione), `ui/BackButton.astro`
   (nieużywany, zostaje w repo).

## 5. Testy

- **Unit**: składanie tel/mail z fragmentów (`contact-details`).
- **E2E** (`navigation.spec.ts`, adaptacja w tym PR):
  - desktop: linki nawigują (bez zmian), **sticky zamiast hide-on-scroll**
    (pasek widoczny po scrollu na dno na `/realizacje/`);
  - mobile: burger otwiera sheet (`data-open`, `aria-expanded`,
    fokus w sheecie), Esc zamyka i oddaje fokus burgerowi, linki
    sheeta nawigują (`main h1`), **nowy test swipe-down** (gest
    pointer na `[data-overlay-drag]` — `overlay.ts` słucha pointer
    events, więc `page.mouse` wystarczy), scrim zamyka;
  - testy `.bkb`/`brand-menu` (podmiana logo↔back, BackButton na
    `/kontakt/`) usunięte (D-CH8).
  - a11y/SEO/smoke: bez zmian speców — nowy chrome musi przejść pustą
    allowlistę axe (stąd D-CH7 pkt 5).
- **Visual**: aktualizacja istniejących baseline'ów `work-index`
  i `contact-index` (chrome zmienia oba komplety, 36+36) — święta
  kolejność: kod → workflow „Update linux visual baselines" z brancha
  PR → `git pull` → lokalny `pnpm test:visual:update` → commit darwin
  NA KOŃCU. **Propozycja**: nowy `tests/visual/chrome.spec.ts` —
  otwarty sheet na `/` (profile mobile) + pasek `plain` desktop na
  `/realizacje/`; baseline'y odświeżymy przy 4.2/4.4, ale sheet dostaje
  regres wizualny od razu.

## 6. Ryzyka i weryfikacja na fizycznym telefonie

- **Sheet na dotyku**: swipe-down (próg/flick), czy grab-handle łapie
  się wygodnie; blur(22px) nad zdjęciem = warstwa GPU — sprawdzić na
  Androidzie (limit warstw), czy otwarcie/zamknięcie nie klatkuje.
- **Zwijany toolbar iOS Safari**: sheet dokowany do dołu — czy
  `safe-area`/pasek nie ucinają sekcji „ZADZWOŃ DO NAS".
- Sticky pasek + strony przejściowe: nadmiarowe światło u góry
  (świadome, D-CH1) — nie zgłaszać jako bug.
- LHCI: chrome dodaje ~1 obrazek (tło sheeta, poza viewportem — lazy)
  i trochę CSS/JS; daleko od progów, ale patrzę na wynik `lighthouse`
  w PR.

## 7. Definition of done (kontekst wspólny)

Mini-analiza + wpis w `docs/README.md`; zielone `typecheck`, `lint`,
`test:unit`, `test:e2e` (6 profili), `test:visual`; oba komplety
baseline'ów w PR (święta kolejność); allowlista axe pusta; breakpoint
1024 w chrome; PR zielony na `quality`+`e2e`+`lighthouse`; po merge'u
prod-smoke; aktualizacja CLAUDE.md (część 4.1 + numer PR-a).
