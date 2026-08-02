// Interakcje funkcjonalne /oferta/ (część 4.3) — ładowane ZAWSZE
// (to nie dekoracja ruchu): zakładki kategorii (wzorzec ARIA tabs,
// automatyczna aktywacja strzałkami — D-OK2) + pasek postępu karuzeli
// mobile (feedback przewijania toru — D-OK3). Animacje przełączenia
// panelu to keyframes CSS w OfertaSection.astro — tu tylko klasy;
// .anim dozbrajamy od pierwszej interakcji (pierwszy render bez
// animacji, jak w eksporcie).

const qa = <T extends HTMLElement = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));
const q = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s);

/* ── zakładki + panele ── */
const tabs = qa<HTMLButtonElement>("[data-oftab]");
const panels = qa("[data-ofpanel]");

function select(i: number, focus = false, anim = true) {
  tabs.forEach((t, k) => {
    const on = k === i;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  panels.forEach((p, k) => {
    // .anim od pierwszej interakcji; restart animacji robi sam browser
    // (display: none → grid przy każdym przełączeniu). Deep-link na
    // wejściu wybiera panel BEZ animacji — pierwszy render zostaje
    // statyczny jak w eksporcie (D-P1).
    if (anim) p.classList.add("anim");
    p.classList.toggle("on", k === i);
  });
  if (focus) tabs[i]?.focus();
}

/* ── deep-link zakładki: /oferta/#<slug> (D-P1) ──
   Kanoniczny adres kategorii: na desktopie zaznacza zakładkę, poniżej
   progu otwiera kartę-sheet (kat-sheets.ts). Hash niesie goły slug —
   id zakładek/paneli mają prefiksy, więc przeglądarka nie scrolluje.
   Zły/pusty slug = panel 01 z SSR, bez ruchu. Zaznaczamy niezależnie od
   progu: po obrocie telefonu w widok desktop panel jest już właściwy. */
const hashSlug = decodeURIComponent(location.hash.slice(1));
if (hashSlug) {
  const i = tabs.findIndex((t) => t.id === `of-tab-${hashSlug}`);
  if (i > 0) select(i, false, false);
}

tabs.forEach((t, i) => {
  t.addEventListener("click", () => select(i));
  t.addEventListener("keydown", (e) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(next, true);
  });
});

/* ── pasek postępu karuzeli (mobile) ── */
const rail = q("[data-rail]");
const fill = q("[data-barfill]");
if (rail && fill) {
  const n = rail.children.length;
  fill.style.width = `${100 / n}%`;
  const paintBar = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const f = max > 0 ? Math.min(1, Math.max(0, rail.scrollLeft / max)) : 0;
    fill.style.transform = `translateX(${f * (n - 1) * 100}%)`;
  };
  rail.addEventListener("scroll", paintBar, { passive: true });
  addEventListener("resize", paintBar);
  paintBar();
}

export {};
