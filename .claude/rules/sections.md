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
  konsumentem był `smooth-scroll.ts`, dziś na własnym `requestAnimationFrame`).
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

- Track karuzeli mobile wymaga `data-lenis-prevent-horizontal` (NIE
  `data-lenis-prevent` — zabija pionowy scroll na Androidzie) oraz
  `scroll-snap-stop: always`.
- Detal realizacji (od 4.4): JEDEN overlay `#work-detail` na szkielecie
  `overlay.ts` (`WorkDetailOverlay.astro`) — wariant modal (≥1024) ↔
  bottom sheet (<1024) to czysty CSS przy `WORK_DESKTOP_MIN_PX`;
  zmiana progu przy otwartej nakładce zamyka ją (miejsce galerii w DOM
  jest per-próg — `open-detail.ts`).
- Galeria detalu delung (4.4): zdjęcia przez `imgAt()`, wideo
  `<video preload="none" poster playsinline>` — BEZ `controls` i bez
  własnego znaku play (korekta Mateusza): ikonka kamery w rogu kadru,
  tap w kadr galerii startuje film i otwiera podgląd pełnoekranowy
  (`[data-lightbox]`), w podglądzie tap = pauza↔play; wideo na zrzutach
  visual ZAWSZE przez maskę, odtwarzanie testuj funkcjonalnie w e2e.

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
