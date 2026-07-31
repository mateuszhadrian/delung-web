// Konfiguracja widoku realizacji (część 4.4).
// Breakpoint projektu delung: <1024 mobile (bottom sheet detalu),
// ≥1024 desktop (modal) — stała W PARZE z progami @media w komponentach
// sections/work/* (reguła sections.md; CSS nie zaimportuje stałej).
// Importują ją też testy e2e/visual. Zastępuje dawny próg 760 px
// (sheetMQ z szablonu) — świadome odroczenie D-SG6 domknięte w 4.4.
export const WORK_DESKTOP_MIN_PX = 1024;
