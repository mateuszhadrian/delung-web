// Konfiguracja sekcji strony głównej (część 4.2).
// Breakpoint projektu delung: <1024 mobile, ≥1024 desktop — stała W PARZE
// z progami @media w komponentach sections/home/* (reguła sections.md;
// CSS nie zaimportuje stałej). Konsumenci: home-scroll.ts, HomeHero.astro.
// Parę stała↔@media pilnuje test kontraktu w tests/e2e/index.spec.ts —
// mierzy układ po OBU stronach progu, więc rozjazd w każdą stronę = czerwony.
export const HOME_DESKTOP_MIN_PX = 1024;
