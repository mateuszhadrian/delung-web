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

- Moduły `*-scroll.ts` ładowane DYNAMICZNIE tylko przy
  `prefers-reduced-motion: no-preference`; bez JS / przy reduce sekcja
  renderuje pełną, statyczną treść.
- Wspólne helpery już istnieją — nie kopiuj bloków między sekcjami:
  `src/scripts/section-helpers.ts` (`revealOnce`, `motionMedia`,
  `ghostParallax`, `makeProgress`, `scopedQueries`) oraz
  `src/scripts/anchors.ts` (`scrollToAnchor`, `handleAnchorClick`).
- Breakpoint projektu delung: **1024 px** (spójnie z designami — desktop
  ≥1024, mobile <1024). W kodzie odziedziczonym siedzą jeszcze progi
  760/768/861 z szablonu — przy porcie widoku na design delung ZAWSZE
  wyrównuj do 1024 (stała w configu sekcji + ten sam próg w `@media`
  pliku `.astro` — CSS nie zaimportuje stałej, utrzymuj W PARZE; testy
  importują stałą, nie hardkodują).
- Warstwy testów po zmianie: `.claude/rules/testing.md`; sekcje mają
  własne specy w `tests/visual/`.

## Work (`wk` / `wix`) — realizacje

- Track karuzeli mobile wymaga `data-lenis-prevent-horizontal` (NIE
  `data-lenis-prevent` — zabija pionowy scroll na Androidzie) oraz
  `scroll-snap-stop: always`.
- Detal realizacji: Modal (desktop) / BottomSheet (mobile) na szkielecie
  `overlay.ts` — zmiana progu przy otwartej nakładce zamyka ją (nie
  zostawiaj niespójnego stanu).
- Galeria detalu delung (Etap 4.4): zdjęcia przez `imgAt()`, wideo
  `<video preload="none" poster playsinline controls>` odtwarzane na tap;
  wideo na zrzutach visual ZAWSZE przez maskę, odtwarzanie testuj
  funkcjonalnie w e2e.

## Contact (`kt`)

- Adres e-mail i telefon składane z fragmentów dopiero po kliknięciu
  `[ POKAŻ ]` (antyscraping) — nie „upraszczaj" do zwykłego mailto
  w markupie.
- Honeypot jest `readonly` (autofill Chrome'a nie wypełnia readonly;
  focus zdejmuje atrybut w `contact-ui.ts`) — nie usuwaj atrybutu.
- Turnstile ładowany leniwie (pierwszy `focusin` w formularzu) — nie
  przenoś do eager loadu.
- Breakpoint: `CONTACT_DESKTOP_MIN_PX` z `contact-config.ts` (importują
  go też testy e2e) — 861 px z szablonu; wyrównanie do 1024 przy porcie
  widoku kontaktu (Etap 5).
- Pułapki klienckie mają serwerowy odpowiednik w `functions/api/kontakt.ts`
  (Pages Function: honeypot, czas wypełnienia, weryfikacja Turnstile) —
  zmiany po jednej stronie kontraktu wymagają przeglądu drugiej.
