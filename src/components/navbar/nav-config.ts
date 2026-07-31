// Breakpoint chrome'u (i całego projektu delung): desktop ≥1024, mobile <1024.
// Stała importowana przez testy e2e; ten sam próg siedzi w @media
// komponentów chrome'u oraz w :root global.css (--pad/--col) — utrzymywać
// W PARZE (CSS nie zaimportuje stałej).
export const NAV_DESKTOP_MIN_PX = 1024;
