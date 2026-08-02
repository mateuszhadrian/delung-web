// Karty kategorii — mechanika otwierania sheetów `#kat-<slug>`
// (KategorieSheets.astro), WSPÓŁDZIELONA przez /kategorie/, / i /oferta/
// (D-P2/D-P3, docs/analiza-poprawki-wizualne.md). Importuje ją sam
// komponent sheetów, więc każda strona z kartami dostaje ją zawsze —
// to funkcja, nie dekoracja ruchu.
//
// Cztery zadania:
//  1. `[data-kat]` — kafle listy /kategorie/ (przyciski) otwierają kartę;
//  2. `a[data-kat-link]` — kafle kategorii na / i /oferta/: PONIŻEJ progu
//     desktop przechwytujemy klik i otwieramy kartę W MIEJSCU (korekta
//     D-OK3 po testach klienckich: tap w kafel nie przenosi na inną
//     stronę). Href zostaje w markupie jako fallback bez JS, a na
//     desktopie link nawiguje normalnie — tam kanoniczny deep-link
//     `/oferta/#<slug>` zaznacza zakładkę (D-P1, oferta.ts);
//  3. hash `#<slug>` na wejściu (poniżej progu) otwiera kartę — adres
//     skopiowany z desktopu działa na telefonie;
//  4. przejście na próg desktop przy otwartej karcie ZAMYKA ją (reguła
//     sections.md o spójnym stanie nakładek; redirect /kategorie/ działa
//     tylko na load, resize go nie odpala).
import { OFERTA_DESKTOP_MIN_PX } from "./oferta-config";

const desktopMQ = matchMedia(`(min-width:${OFERTA_DESKTOP_MIN_PX}px)`);
let openId: string | null = null;

function openKat(id: string) {
  openId = id;
  window.overlay?.open(id, {
    onClose: () => {
      if (openId === id) openId = null;
    },
  });
}

/** Sheet danej kategorii — null, gdy strona go nie wyrenderowała. */
function sheetFor(slug: string | undefined | null) {
  return slug ? document.getElementById(`kat-${slug}`) : null;
}

/* ── 1. kafle listy /kategorie/ (przyciski) ── */
document.querySelectorAll<HTMLButtonElement>("[data-kat]").forEach((card) => {
  const id = card.getAttribute("aria-controls");
  if (!id) return;
  card.addEventListener("click", () => openKat(id));
});

/* ── 2. kafle-linki kategorii (/ i /oferta/) ── */
document
  .querySelectorAll<HTMLAnchorElement>("a[data-kat-link]")
  .forEach((link) => {
    link.addEventListener("click", (e) => {
      // Desktop: link jedzie normalnie (deep-link zakładki — D-P1).
      if (desktopMQ.matches) return;
      // Otwarcie w nowej karcie / środkowym przyciskiem zostaje linkiem.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const sheet = sheetFor(link.dataset.katLink);
      if (!sheet) return; // brak karty na tej stronie → nawigacja jak dotąd
      e.preventDefault();
      openKat(sheet.id);
    });
  });

/* ── 3. deep-link: #<slug> w adresie = karta otwarta na wejściu ──
   Hash niesie goły slug (nie id nakładki) — nie koliduje z żadnym id
   w dokumencie, więc przeglądarka niczego nie scrolluje. Nakładkę
   otwieramy, gdy tylko overlay.ts się zgłosi (kolejność modułów bundla
   nie jest gwarantowana — krótka pętla rAF zamiast założenia). */
const hashTarget = sheetFor(decodeURIComponent(location.hash.slice(1)));
if (hashTarget && !desktopMQ.matches) {
  const tryOpen = () => {
    if (window.overlay) openKat(hashTarget.id);
    else requestAnimationFrame(tryOpen);
  };
  tryOpen();
}

/* ── 4. zmiana progu przy otwartej karcie ── */
desktopMQ.addEventListener("change", (e) => {
  if (e.matches && openId) window.overlay?.close(openId);
});

export {};
