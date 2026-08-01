// Ruch /o-nas/ (część 4.5) — ładowany DYNAMICZNIE wyłącznie przy
// prefers-reduced-motion: no-preference (wzorzec D-SG9, bez GSAP).
// Stany startowe uzbraja html.js-motion (inline przed paintem w OnasPage)
// — bez JS / przy reduce strona w pełni statyczna (tor zespołu = zwykły
// overflow-x: auto, manifest pełną jasnością).
//
// Zakres: reveale [data-rev] (mobile) + parallax [data-par] (zdjęcie
// hero) + desktop: manifest słowo-po-słowie (wzorzec cytatu HomeAbout),
// zoom-out teł [data-bgzoom] (manifest/prec), przypięty tor kart zespołu
// (postęp scrolla → translate3d + licznik) — port pętli z o-nas.html.
import { ONAS_DESKTOP_MIN_PX } from "./onas-config";

const mqMobile = matchMedia(`(max-width:${ONAS_DESKTOP_MIN_PX - 1}px)`);
const qa = <T extends HTMLElement = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));
const q = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

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

/* ── parallax [data-par] (wzorzec oferta-motion; host = rodzic) ── */
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

/* ── manifest: rozjaśnianie słowo po słowie (desktop) ──
   Spany przez style.opacity (NIE color z alfą) — jak cytat HomeAbout. */
const manifest = q("[data-manifest]") as
  | (HTMLElement & { __w?: HTMLElement[] })
  | null;
function manifestWords(el: NonNullable<typeof manifest>) {
  if (el.__w) return el.__w;
  const words = (el.textContent || "").trim().split(/\s+/);
  el.textContent = "";
  el.__w = words.map((w) => {
    const s = document.createElement("span");
    s.textContent = w + " ";
    s.style.opacity = "0.16";
    el.appendChild(s);
    return s;
  });
  return el.__w;
}
const docTop = (el: HTMLElement) => {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return y;
};
function manifestPaint() {
  if (!manifest) return;
  if (mqMobile.matches) {
    manifest.__w?.forEach((s) => (s.style.opacity = "1"));
    return;
  }
  const H = window.innerHeight;
  const Y = window.scrollY;
  const spans = manifestWords(manifest);
  const total = spans.length + 3;
  const p = clamp01(
    (Y - (docTop(manifest) - H * 0.82)) / Math.max(1, H * 0.62),
  );
  spans.forEach((s, i) => {
    const o = (0.16 + 0.84 * clamp01((p * total - i) / 3)).toFixed(3);
    if (s.style.opacity !== o) s.style.opacity = o;
  });
}

/* ── zoom-out teł [data-bgzoom] (manifest/prec, desktop) ── */
const bgs = qa("[data-bgzoom]");
function bgPaint() {
  if (mqMobile.matches) return;
  const H = window.innerHeight;
  const Y = window.scrollY;
  for (const bg of bgs) {
    const sec = bg.parentElement;
    if (!sec) continue;
    const t = docTop(sec as HTMLElement);
    const p = clamp01((Y - (t - H)) / Math.max(1, H + 680));
    bg.style.transform = `scale(${(1.25 - 0.2 * p).toFixed(3)})`;
  }
}

/* ── przypięty tor kart zespołu (desktop; scena uzbrojona js-motion) ── */
const teamWrap = q(".team");
const teamTrack = q("[data-teamtrack]");
const teamHold = q(".team-hold");
const teamCnt = q("[data-teamcount]");
const TEAM_LEN = 3;
function teamPaint() {
  if (!teamWrap || !teamTrack || !teamHold) return;
  if (mqMobile.matches) {
    teamTrack.style.transform = "none";
    return;
  }
  const r = teamWrap.getBoundingClientRect();
  const H = window.innerHeight;
  const span = teamWrap.offsetHeight - H;
  const p = clamp01(-r.top / Math.max(1, span));
  const max = Math.max(0, teamTrack.scrollWidth - teamHold.clientWidth);
  teamTrack.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
  const n = Math.min(TEAM_LEN, Math.floor(p * TEAM_LEN) + 1);
  const txt = String(n).padStart(2, "0");
  if (teamCnt && teamCnt.textContent !== txt) teamCnt.textContent = txt;
}

/* ── pętla rysowania ── */
let raf = 0;
function tick() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    parPaint();
    manifestPaint();
    bgPaint();
    teamPaint();
  });
}
addEventListener("scroll", tick, { passive: true });
addEventListener("resize", tick);
mqMobile.addEventListener("change", tick);
parPaint();
manifestPaint();
bgPaint();
teamPaint();

export {};
