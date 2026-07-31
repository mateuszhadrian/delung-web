// Interakcje funkcjonalne /kategorie/ (część 4.3) — ładowane ZAWSZE:
// kafle listy otwierają kartę kategorii (bottom sheet #kat-<slug> na
// overlay.ts — D-OK5); wejście z hashem /kategorie/#<slug> otwiera kartę
// od razu (deep-link z kafli karuzeli /oferta/ — korekta Mateusza po
// testach 4.3). Przejście na próg desktop przy otwartej karcie zamyka ją
// (reguła sections.md o spójnym stanie nakładek; redirect z Etapu 0
// działa tylko na load — resize go nie odpala).
import { OFERTA_DESKTOP_MIN_PX } from "./oferta-config";

const cards = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-kat]"),
);
let openId: string | null = null;

function openKat(id: string) {
  openId = id;
  window.overlay?.open(id, {
    onClose: () => {
      if (openId === id) openId = null;
    },
  });
}

cards.forEach((card) => {
  const id = card.getAttribute("aria-controls");
  if (!id) return;
  card.addEventListener("click", () => openKat(id));
});

const desktopMQ = matchMedia(`(min-width:${OFERTA_DESKTOP_MIN_PX}px)`);
desktopMQ.addEventListener("change", (e) => {
  if (e.matches && openId) window.overlay?.close(openId);
});

/* ── deep-link: #<slug> w adresie = karta otwarta na wejściu ──
   Hash niesie goły slug (nie id nakładki) — nie koliduje z żadnym id
   w dokumencie, więc przeglądarka niczego nie scrolluje. Nakładkę
   otwieramy, gdy tylko overlay.ts się zgłosi (kolejność modułów bundla
   nie jest gwarantowana — krótka pętla rAF zamiast założenia). */
const slug = decodeURIComponent(location.hash.slice(1));
const hashTarget = slug ? document.getElementById(`kat-${slug}`) : null;
if (hashTarget && !desktopMQ.matches) {
  const tryOpen = () => {
    if (window.overlay) openKat(hashTarget.id);
    else requestAnimationFrame(tryOpen);
  };
  tryOpen();
}

export {};
