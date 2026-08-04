// Konfiguracja widoku realizacji (część 4.4).
// Breakpoint projektu delung: <1024 mobile (bottom sheet detalu),
// ≥1024 desktop (modal) — stała W PARZE z progami @media w komponentach
// sections/work/* (reguła sections.md; CSS nie zaimportuje stałej).
// Konsumenci: open-detail.ts, work-motion.ts, WorkIndexPage.astro.
// Parę stała↔@media pilnuje test kontraktu w tests/e2e/work-index.spec.ts —
// mierzy układ po OBU stronach progu, więc rozjazd w każdą stronę = czerwony.
// Zastępuje dawny próg 760 px
// (sheetMQ z szablonu) — świadome odroczenie D-SG6 domknięte w 4.4.
export const WORK_DESKTOP_MIN_PX = 1024;
