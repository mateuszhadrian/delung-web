---
paths:
  - "src/scripts/smooth-scroll.ts"
  - "src/layouts/BaseLayout.astro"
---

# Smooth scroll (Lenis) — reguły

- **Lenis TYLKO desktop; dotyk = scroll NATYWNY** (decyzja Mateusza przy
  4.2, po teście na fizycznych telefonach: `syncTouch` pędził scroll
  JS-em na main thread i klatkował przy pełnoekranowych sekcjach strony
  głównej; delung — inaczej niż hadrianm — nie ma na mobile mechaniki
  wymagającej Lenisa). Gałąź touch (stałe `syncTouch`/`SYNC_TOUCH_LERP`/
  `TOUCH_INERTIA_EXPONENT` i guardy pinch/zoom `multiTouch`/`isZoomed`)
  usunięta z kodu — historia i uzasadnienie guardów w hadrianm
  (analiza §2.1 `first-bigger-improvement-refactor-analysis.md`);
  przy EWENTUALNYM powrocie Lenisa na dotyk trzeba je przywrócić W KOMPLECIE.
- `WHEEL_LERP = 0.05` — fix na skokowe rolki z zapadkami; zmiana stałej =
  test na fizycznym macOS (gładkie kółko) i myszy z zapadkami.
- Detekcja dotyku: `navigator.maxTouchPoints > 0` — NIE media queries
  `hover`/`pointer` (laptopy z dotykiem kłamią).
- Lenis ładowany tylko przy `prefers-reduced-motion: no-preference`
  (bramka w `BaseLayout`); instancja wystawiona jako `window.__lenis`
  (używa jej navbar do `scrollTo`). Wszyscy konsumenci (`anchors.ts`,
  `overlay.ts`, helpery testów) mają fallback natywny — na dotyku
  `window.__lenis` po prostu nie istnieje.
- Handler `pageshow` z `e.persisted` (`lenis.resize()` +
  `ScrollTrigger.refresh()`) to NAPRAWIONY BUG powrotów przez bfcache
  (`history.back()` z podstron): stronę przywróconą z zamrożenia omijają
  resize'y, a pasek Safari zmienia w międzyczasie wysokość viewportu —
  bez przeliczenia dno strony/stopka są „przesunięte o pasek" na iOS.
  NIE usuwać (`ScrollTrigger.refresh()` potrzebny też przy natywnym
  scrollu); weryfikacja tylko na fizycznym iPhonie (emulacja nie
  odtwarza bfcache ani paska).
