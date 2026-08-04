// Konfiguracja widoku /proces-wspolpracy/ (część 4.5) — stała progu
// desktop W PARZE z @media w komponentach sekcji (CSS nie zaimportuje
// stałej — utrzymuj razem; reguła sections.md).
//
// UWAGA: ta stała nie ma dziś ANI JEDNEGO konsumenta w kodzie — widok
// procesu jest czystym CSS-em, a komponenty Proces*.astro odsyłają do niej
// wyłącznie komentarzem „para: PROCES_DESKTOP_MIN_PX" przy @media. Zostaje
// jako jedno miejsce zapisu progu tego widoku (R5: rozdzielność stałych
// wymusza świadomą decyzję per widok), ale zmiana samej liczby NIE zmienia
// niczego w wyniku — próg trzeba poprawić w czterech @media.
export const PROCES_DESKTOP_MIN_PX = 1024;
