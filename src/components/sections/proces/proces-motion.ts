// Ruch /proces-wspolpracy/ (część 4.5) — ładowany DYNAMICZNIE wyłącznie
// przy prefers-reduced-motion: no-preference (wzorzec D-SG9, bez GSAP).
// Stany startowe revealów uzbraja klasa html.js-motion (inline skrypt
// przed paintem w ProcesPage) — bez JS / przy reduce strona jest w pełni
// statyczna (desktop pokazuje pierwszy kadr kolumny swap; liczniki stoją).
//
// Zakres: reveale [data-rev] (mobile) + parallax [data-par] (hero/CTA)
// + desktopowy swap zdjęć kroków (clip-path + licznik + pionowy pasek)
// + mobilny chip licznika kroków — port pętli rysowania z proces.html.

const qa = <T extends HTMLElement = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pad = (n: number) => String(n).padStart(2, "0");

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

/* ── kroki: swap kolumny (desktop) + chip licznika (mobile) ──
   Port pętli z proces.html: aktywny krok = ostatni, którego górna krawędź
   minęła połowę viewportu; zdjęcia odsłania clip-path (transition w CSS). */
const steps = qa(".step");
const swapImgs = qa(".swapimg");
const swapCnt = document.querySelector<HTMLElement>("[data-swapcount]");
const swapBar = document.querySelector<HTMLElement>("[data-swapbar]");
const chip = document.querySelector<HTMLElement>("[data-count]");

function stepsPaint() {
  if (!steps.length) return;
  const H = window.innerHeight;
  let active = 0;
  let chipIdx = 0;
  steps.forEach((s, i) => {
    const top = s.getBoundingClientRect().top;
    if (top < H * 0.5) active = i;
    if (top < H * 0.55) chipIdx = i;
  });
  swapImgs.forEach((el, k) => {
    el.style.zIndex = String(k);
    el.style.clipPath =
      k <= active ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)";
  });
  const cntTxt = pad(active + 1);
  if (swapCnt && swapCnt.textContent !== cntTxt) swapCnt.textContent = cntTxt;
  if (swapBar) {
    swapBar.style.transform = `scaleY(${((active + 1) / steps.length).toFixed(3)})`;
  }
  const chipTxt = pad(chipIdx + 1);
  if (chip && chip.textContent !== chipTxt) chip.textContent = chipTxt;
}

/* ── pętla rysowania ── */
let raf = 0;
function tick() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    parPaint();
    stepsPaint();
  });
}
addEventListener("scroll", tick, { passive: true });
addEventListener("resize", tick);
parPaint();
stepsPaint();

export {};
