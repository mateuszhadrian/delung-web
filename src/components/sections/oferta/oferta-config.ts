// Konfiguracja widoków oferty (część 4.3).
// Breakpoint projektu delung: <1024 mobile, ≥1024 desktop — stała W PARZE
// z progami @media w komponentach sections/oferta/* (reguła sections.md;
// CSS nie zaimportuje stałej). Konsument: kat-sheets.ts.
// Ten sam próg siedzi w inline skrypcie redirectu /kategorie/ → /oferta/
// (src/pages/kategorie.astro — mechanizm Etapu 0, nie ruszać).
export const OFERTA_DESKTOP_MIN_PX = 1024;
