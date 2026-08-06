---
paths:
  - "src/components/sections/**"
---

# Sekcje strony — gotchas

Sekcje delung powstają w Etapie 4 (po jednej, pętla analiza → implementacja
→ testy → PR) — mini-analizy per widok lądują w `docs/`. Poniżej reguły
wspólne odziedziczone z szablonu + gotchas sekcji, które przeżyły kopię
(work, contact).

## Wspólne

- Moduły ruchu (`*-motion.ts`, `home-scroll.ts`) ładowane DYNAMICZNIE tylko
  przy `prefers-reduced-motion: no-preference`; bez JS / przy reduce sekcja
  renderuje pełną, statyczną treść.
- **BEZ GSAP** — biblioteka wypadła z projektu w Etapie 5 (ostatnim
  konsumentem był `smooth-scroll.ts`, skasowany razem z Lenisem — D-Q1).
  Ruch sekcji to własne pętle rAF + `IntersectionObserver` (wzorce:
  `proces-motion.ts`, `onas-motion.ts`, `contact-motion.ts`) — kopiuj wzorzec
  z sąsiedniej sekcji, nie przywracaj GSAP-a ani helperów
  `section-helpers.ts`/`anchors.ts` (skasowane razem z nim).
- Breakpoint projektu delung: **1024 px** (spójnie z designami — desktop
  ≥1024, mobile <1024). Testy importują stałą `*_DESKTOP_MIN_PX` z configu
  sekcji, a `@media` w `.astro` trzymamy z nią W PARZE (CSS nie zaimportuje
  stałej). Progów 760/768/861 z szablonu już w kodzie nie ma.
- Warstwy testów po zmianie: `.claude/rules/testing.md`; sekcje mają
  własne specy w `tests/visual/`.

## Work (`wk` / `wix`) — realizacje

- Track karuzeli mobile wymaga `scroll-snap-stop: always` (bez tego szybki
  swipe przeskakuje kilka kafli naraz). Atrybuty `data-lenis-prevent*`
  odeszły razem z biblioteką (D-Q1, `.claude/rules/scroll.md`).
- **Parallax musi mieć zapas ≥ ruch** (D-U1,
  `docs/analiza-parallax-realizacje.md`): element z `data-par` przesuwa się
  o `data-par × wysokość hosta`, więc obraz musi wystawać poza kadr co
  najmniej o tyle — zapasem jest albo skala (`s ≥ 1 + 2 × data-par`), albo
  wysokość (`top: -amt%` / `height: (100+2·amt)%`). Zmieniasz wysokość
  kafla albo override zdjęcia? Przelicz zapas. Na desktopie ruch bywa
  osobny (`data-par-d`), bo ten sam ułamek znaczy tam inną liczbę pikseli.
  **Testy wizualne tego NIE pilnują** — kafle realizacji są na preview
  pustymi ramkami; strażnikiem jest sonda układu w `tests/e2e/index.spec.ts`.
- Detal realizacji (od 4.4): JEDEN overlay `#work-detail` na szkielecie
  `overlay.ts` (`WorkDetailOverlay.astro`) — wariant modal (≥1024) ↔
  bottom sheet (<1024) to czysty CSS przy `WORK_DESKTOP_MIN_PX`;
  zmiana progu przy otwartej nakładce zamyka ją (miejsce galerii w DOM
  jest per-próg — `open-detail.ts`).
- Pozycja galerii to WARIANT: albo zdjęcie, albo film (remont panelu,
  `.claude/rules/cms-realizacje.md`). Pierwsza pozycja jest KAFLEM
  realizacji, więc musi być zdjęciem — `viewProject()` liczy z niej `cover`,
  dzięki czemu `WorkIndexCard`/`HomeRealizacje` nie wiedzą o zmianie.
- Galeria detalu delung (4.4): zdjęcia przez `imgAt()`, wideo
  `<video preload="none" poster playsinline>` — poster to **klatka ze środka
  filmu** (`videoFrameAt()`), nie osobne zdjęcie. BEZ `controls` i bez
  własnego znaku play (korekta Mateusza): ikonka kamery w rogu kadru,
  tap w kadr galerii startuje film i otwiera podgląd pełnoekranowy
  (`[data-lightbox]`), w podglądzie tap = pauza↔play; wideo na zrzutach
  visual ZAWSZE przez maskę, odtwarzanie testuj funkcjonalnie w e2e.

## Oferta (`of` / `kt-card` / `dt`) — kategorie

- Karty kategorii to 6 pre-renderowanych bottom sheetów `#kat-<slug>`
  w `KategorieSheets.astro` (D-OK5 + D-P2) — komponent WSPÓŁDZIELONY
  przez `/kategorie/`, `/` i `/oferta/`, renderowany obok `<Footer />`
  (nakładki są `position: fixed`, a scena oferty ma pod motion-gate
  przodka z `transform`). Komponent niesie własny import `kat-sheets.ts`,
  więc strona nie musi pamiętać o skrypcie.
- **Tap w kafel kategorii poniżej progu desktop NIE nawiguje** — otwiera
  kartę w miejscu (`a[data-kat-link]` + `preventDefault` w
  `kat-sheets.ts`). `href` zostaje w markupie jako fallback bez JS —
  nie zamieniaj kafli na `<button>`.
- Kanoniczny deep-link kategorii: **`/oferta/#<slug>`** — desktop
  zaznacza zakładkę (`oferta.ts`, BEZ klasy `.anim`: pierwszy render
  zostaje statyczny), mobile otwiera kartę. `/kategorie/#<slug>` działa
  jak dotąd. Hash niesie goły slug (id w dokumencie mają prefiksy
  `of-tab-`/`of-panel-`/`kat-`), więc przeglądarka niczego nie scrolluje.

## Contact (`kt`) — /kontakt/ (Etap 5)

- Sekcje: `ContactHero/ContactCards/ContactForm/ContactSoc.astro`;
  mechanika formularza w `contact-ui.ts` (ładowana ZAWSZE — to funkcja,
  nie dekoracja), ruch w `contact-motion.ts` (za bramką `js-motion`).
- Telefon i e-mail w kaflach: sloty `[data-tel]`/`[data-mail]`
  - `[data-slot]` wypełniane przez `fillContactSlots`
    (`src/lib/contact-details.ts`, wołane przez skrypt Navbara) — nie
    „upraszczaj" do jawnego `tel:`/`mailto:` w markupie (D-CH5).
    Kafle celowo NIE startują `hidden` (skok layoutu) — maskę trzyma
    placeholder `+48 ••• ••• •••`.
- Pola wg designu: imię, telefon (OPCJONALNY, bez walidacji klienckiej),
  e-mail, wiadomość. Chipsy tematu z szablonu nie istnieją; serwer dalej
  toleruje puste `temat`.
- Honeypot jest `readonly` (autofill Chrome'a nie wypełnia readonly;
  focus zdejmuje atrybut w `contact-ui.ts`) — nie usuwaj atrybutu.
- Turnstile ładowany leniwie (pierwszy `focusin` w formularzu) — nie
  przenoś do eager loadu.
- Pola mobile mają PODŁOGĘ `font-size: 16px` (Safari iOS zoomuje stronę
  przy focusie mniejszego pola i zostawia ją zoomniętą).
- Breakpoint: `CONTACT_DESKTOP_MIN_PX = 1024` z `contact-config.ts`
  (importują go testy e2e; `@media` w parze).
- Pułapki klienckie mają serwerowy odpowiednik w `functions/api/kontakt.ts`
  (Pages Function: honeypot, czas wypełnienia, weryfikacja Turnstile) —
  zmiany po jednej stronie kontraktu wymagają przeglądu drugiej.
