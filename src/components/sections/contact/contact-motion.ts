// Ruch /kontakt/ (Etap 5) — ładowany DYNAMICZNIE wyłącznie przy
// prefers-reduced-motion: no-preference (wzorzec D-SG9, bez GSAP).
// Stany startowe revealów uzbraja klasa html.js-motion (inline skrypt
// przed paintem w ContactPage) — bez JS / przy reduce widok jest w pełni
// statyczny. Funkcje formularza żyją osobno w contact-ui.ts (zawsze).
//
// Zakres: reveale [data-rev] (mobile) + parallax rozmytego tła hero
// (desktop; na mobile <picture> nie renderuje obrazu, więc pętla nie ma
// czego liczyć).

const qa = <T extends HTMLElement = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ── reveale [data-rev] (stan startowy: styl is:global strony) ── */
const revIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      // odsłaniamy też to, co przy skoku znalazło się już nad ekranem
      if (!e.isIntersecting && e.boundingClientRect.bottom > 0) continue;
      e.target.classList.add("rv-in");
      revIO.unobserve(e.target);
    }
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
);
qa("[data-rev]").forEach((el) => {
  // pierwszy ekran od razu (quirk rootMargin naprawiony w 4.2)
  if (el.getBoundingClientRect().top < window.innerHeight) {
    el.classList.add("rv-in");
  } else {
    revIO.observe(el);
  }
});

/* ── parallax [data-par] (wzorzec proces-motion; host = rodzic) ── */
const pars = qa("[data-par]");
function parPaint() {
  const H = window.innerHeight;
  for (const el of pars) {
    const host = el.parentElement;
    if (!host) continue;
    const r = host.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) continue;
    const p = clamp01((H - r.top) / (H + r.height));
    const amt = parseFloat(el.getAttribute("data-par") || "0.1");
    el.style.transform =
      `translate3d(0,${((0.5 - p) * 2 * amt * r.height).toFixed(1)}px,0)` +
      ` scale(${el.getAttribute("data-par-scale") || 1})`;
  }
}

let raf = 0;
function tick() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    parPaint();
  });
}
addEventListener("scroll", tick, { passive: true });
addEventListener("resize", tick);
parPaint();

export {};
