// Ruch /realizacje/ (część 4.4) — ładowany DYNAMICZNIE wyłącznie przy
// prefers-reduced-motion: no-preference (wzorzec D-SG9/D-OK8, bez GSAP).
// Stany startowe revealów uzbraja klasa html.js-motion (inline skrypt
// przed paintem w WorkIndexPage) — bez JS / przy reduce strona jest
// w pełni statyczna.
//
// Zakres: reveale [data-rev] (mobile — desktop eksportu używał GSAP
// data-rise/words, których nie portujemy, spójnie z 4.2/4.3) + parallax
// kadrów kafli [data-tilepar] ±70 px (mobile; desktop = hover zoom CSS).
import { WORK_DESKTOP_MIN_PX } from "./work-config";

const desktopMQ = matchMedia(`(min-width: ${WORK_DESKTOP_MIN_PX}px)`);
const qa = <T extends HTMLElement = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));

/* ── reveale [data-rev] (stan startowy: styl is:global strony) ── */
const revIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
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

/* ── parallax kadrów kafli (PAR 70 px jak w eksporcie; tylko mobile) ── */
const PAR = 70;
const imgs = qa("[data-tilepar]");
let raf = 0;

function paint() {
  raf = 0;
  if (desktopMQ.matches) {
    // desktop: transformem rządzi CSS (hover zoom) — zdejmij inline
    imgs.forEach((im) => {
      if (im.style.transform) im.style.transform = "";
    });
    return;
  }
  const H = window.innerHeight;
  for (const im of imgs) {
    const host = im.parentElement;
    if (!host) continue;
    const r = host.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) continue;
    const c = r.top + r.height / 2;
    const prog = Math.max(-1, Math.min(1, (c - H / 2) / ((H + r.height) / 2)));
    const dy = ((-PAR * (1 + prog)) / 2).toFixed(1);
    im.style.transform = `translate3d(0,${dy}px,0)`;
  }
}

function tick() {
  if (!raf) raf = requestAnimationFrame(paint);
}

if (imgs.length) {
  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("resize", tick);
  desktopMQ.addEventListener("change", tick);
  paint();
}

export {};
