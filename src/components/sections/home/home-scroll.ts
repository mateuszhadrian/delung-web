// Ruch strony głównej (część 4.2, decyzja D-SG9) — wierny port wspólnego
// skryptu eksportu docs/design/index.html BEZ GSAP (sticky + rAF + IO).
// Moduł ładowany DYNAMICZNIE z Home.astro
// wyłącznie przy prefers-reduced-motion: no-preference; stany startowe
// animacji uzbraja klasa html.js-motion (inline skrypt przed paintem —
// zero CLS), więc bez tego modułu strona stoi w pełni statyczna.
//
// Zakres: reveale [data-rev] (mobile), parallax [data-par], scena oferty
// (poziomy tor + licznik + dopasowanie CTA), scena realizacji (teksty,
// clip-path stosu, pasek, pill), linia i kroki procesu, cytat o-nas
// (słowo po słowie), zoom tła bannera kontaktu.
import { HOME_DESKTOP_MIN_PX } from "./home-config";

const qa = <T extends HTMLElement = HTMLElement>(
  s: string,
  r: ParentNode = document,
) => Array.from(r.querySelectorAll<T>(s));
const q = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s);

const mqMobile = matchMedia(`(max-width:${HOME_DESKTOP_MIN_PX - 1}px)`);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ── reveale [data-rev] (stan startowy: global.css pod html.js-motion) ── */
const revIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      // odsłaniamy też to, co przy skoku (np. kotwica #contact) znalazło
      // się już nad ekranem — wzorzec eksportu
      if (!e.isIntersecting && e.boundingClientRect.bottom > 0) continue;
      e.target.classList.add("rv-in");
      revIO.unobserve(e.target);
    }
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
);
qa("[data-rev]").forEach((el) => {
  // Pierwszy ekran odsłaniamy od razu (animacja wejścia i tak gra od
  // stanu uzbrojonego): rootMargin -10% nie uznaje dolnego pasa viewportu
  // za „w kadrze", więc CTA hero czekałoby z opacity 0 na pierwszy ruch
  // palcem (quirk odziedziczony z eksportu — tu naprawiony).
  if (el.getBoundingClientRect().top < window.innerHeight) {
    el.classList.add("rv-in");
  } else {
    revIO.observe(el);
  }
});

/* ── stała wysokość viewportu (sonda 100svh) ──
   innerHeight na mobile skacze przy chowaniu/pokazywaniu paska URL —
   parallax liczony z niego szarpał obrazem pod tekstem hero dokładnie
   w momencie zwijania paska. svh = wysokość „małego" viewportu (pasek
   widoczny), stała w trakcie scrolla; na desktopie równa innerHeight.

   window.__vph (D-Q2) pojawia się WYŁĄCZNIE w przeglądarkach, w których
   svh mimo wszystko drga — bo chowany pasek zmienia rozmiar webview
   (DuckDuckGo, Firefox, Opera, Edge na iOS). Tam sonda kłamie w trakcie
   scrolla, więc bierzemy zamrożoną wartość sprzed drgnięcia; wszędzie
   indziej (Safari, Chrome, desktop, testy) zmiennej nie ma i zostaje
   dotychczasowy odczyt sondy — co do piksela. Ustawia ją skrypt hero. */
const svhProbe = document.createElement("div");
svhProbe.style.cssText =
  "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
document.body.appendChild(svhProbe);
const vpH = () => window.__vph || svhProbe.offsetHeight || window.innerHeight;

/* ── parallax [data-par] (zapas w wymiarach obrazów — komponenty) ── */
const pars = qa("[data-par]");
function parPaint() {
  const H = vpH();
  for (const el of pars) {
    // Host = najbliższy [data-par-host] (hero mobile — <img> siedzi
    // w <picture>, a punktem odniesienia ma być sekcja), inaczej rodzic.
    const host = el.closest<HTMLElement>("[data-par-host]") ?? el.parentElement;
    if (!host || host === el) continue;
    const r = host.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) continue;
    const p = clamp01((H - r.top) / (H + r.height));
    const amt = parseFloat(el.getAttribute("data-par") || "0.1");
    el.style.transform =
      `translate3d(0,${((0.5 - p) * 2 * amt * r.height).toFixed(1)}px,0)` +
      ` scale(${el.getAttribute("data-par-scale") || 1})`;
  }
}

/* ── postęp sekcji przypiętej: 0 (start pinu) → 1 (koniec) ── */
function prog(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return clamp01(-r.top / Math.max(1, el.offsetHeight - vpH()));
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

/* ── oferta: poziomy tor + licznik ── */
const ofSec = q("[data-home-of]");
const ofTrack = q("[data-oftrack]");
const ofHold = q("[data-ofhold]");
const ofCount = q("[data-ofcount]");
const ofCats = ofTrack ? qa(".cat", ofTrack) : [];

/* ── realizacje: teksty + stos clip-path + pasek + pill ── */
const reSec = q("[data-home-re]");
const reTxts = qa("[data-retx]");
const reCards = q("[data-recards]");
const reRcs = reCards ? qa("[data-work-slug]", reCards) : [];
const reBar = q("[data-rebar]");
const rePill = q("[data-repill]");
const reTags = reRcs.map(
  (rc) => rc.querySelector(".rc-tag")?.textContent?.trim() ?? "",
);

/* ── proces: linia + reveal kroków ── */
const prBody = q("[data-prbody]");
const prLine = q("[data-prline]");
const steps = qa("[data-home-pr] .st") as (HTMLElement & {
  __rv?: boolean;
})[];

/* ── o nas: cytat słowo po słowie ── */
const quote = q("[data-abtquote]") as
  | (HTMLElement & { __w?: HTMLElement[] })
  | null;
function quoteWords(el: NonNullable<typeof quote>) {
  if (el.__w) return el.__w;
  const words = (el.textContent || "").trim().split(/\s+/);
  el.textContent = "";
  el.__w = words.map((w) => {
    const s = document.createElement("span");
    s.textContent = w + " ";
    s.style.opacity = "0.13";
    el.appendChild(s);
    return s;
  });
  return el.__w;
}

/* ── kontakt: powolne odzoomowanie tła ── */
const koBg = q<HTMLImageElement>("[data-home-ko] .ko-bg");

const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

function paint() {
  const mobile = mqMobile.matches;
  const H = vpH();
  parPaint();

  // oferta
  if (ofSec && ofTrack && ofHold) {
    if (mobile) {
      ofTrack.style.transform = "";
    } else {
      const p = prog(ofSec);
      const max = Math.max(0, ofTrack.scrollWidth - ofHold.clientWidth);
      ofTrack.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
      if (ofCount && ofCats.length) {
        const n = Math.min(
          ofCats.length,
          Math.floor(p * ofCats.length * 0.999) + 1,
        );
        const tx = `${pad2(n)} / ${pad2(ofCats.length)}`;
        if (ofCount.textContent !== tx) ofCount.textContent = tx;
      }
    }
  }

  // realizacje
  if (reSec && reRcs.length) {
    if (mobile) {
      for (const rc of reRcs) {
        rc.style.clipPath = "";
        rc.style.zIndex = "";
      }
    } else {
      const p = prog(reSec);
      const i = Math.min(
        reRcs.length - 1,
        Math.floor(p * reRcs.length * 0.999),
      );
      reTxts.forEach((el, k) => {
        el.style.opacity = k === i ? "1" : "0";
        el.style.transform = k === i ? "translateY(0)" : "translateY(14px)";
        // karty leżą jedna na drugiej — nieaktywna nie może przechwytywać
        // kliknięć w link „Więcej" karty widocznej (D-Q6)
        el.style.pointerEvents = k === i ? "auto" : "none";
      });
      reRcs.forEach((rc, k) => {
        rc.style.zIndex = String(k);
        rc.style.clipPath =
          k <= i ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)";
      });
      if (reBar)
        reBar.style.transform = `scaleX(${((i + 1) / reRcs.length).toFixed(3)})`;
      if (rePill && rePill.textContent !== reTags[i])
        rePill.textContent = reTags[i];
    }
  }

  // linia procesu
  if (prLine && prBody) {
    const r = prBody.getBoundingClientRect();
    const p = clamp01(
      (H * (mobile ? 0.7 : 0.55) - r.top) / Math.max(1, r.height),
    );
    prLine.style.transform = `scaleY(${p.toFixed(4)})`;
  }

  // desktop: reveal kroków, cytat, zoom tła kontaktu
  if (!mobile) {
    const Y = window.scrollY || 0;
    for (const st of steps) {
      const on = Y > docTop(st) - H * 0.68;
      if (st.__rv === on) continue;
      st.__rv = on;
      st.classList.toggle("rev", on);
    }
    if (quote) {
      const a = docTop(quote) - H * 0.85;
      const b = docTop(quote) - H * 0.15;
      // Podział na przygaszone słowa dopiero, gdy cytat zbliża się do
      // viewportu (~2 ekrany) — wcześniej stoi pełny, czytelny tekst
      // (skan axe u szczytu strony nie łapie przejściowych opacity .13).
      if (quote.__w || Y >= a - H) {
        const w = quoteWords(quote);
        const pq = clamp01((Y - a) / Math.max(1, b - a));
        const total = w.length + 2;
        w.forEach((el, i) => {
          const o = (0.13 + 0.87 * clamp01((pq * total - i) / 3)).toFixed(3);
          if (el.style.opacity !== o) el.style.opacity = o;
        });
      }
    }
    if (koBg) {
      const sec = koBg.parentElement!;
      const a = docTop(sec) - H;
      const b = docTop(sec) + 680;
      const pk = clamp01((Y - a) / Math.max(1, b - a));
      koBg.style.transform = `scale(${(1.25 - 0.2 * pk).toFixed(3)})`;
    }
  }
}

/* ── CTA oferty: wyśrodkowanie w pasie pod kaflami (port fitCta) ── */
const ofCta = q("[data-ofcta]");
const ofBtn = ofCta?.querySelector<HTMLElement>("a") ?? null;
const BAND_REF = 125; // wolny pas pod kartami we wzorcu 1440×900
function fitCta() {
  if (!ofCta || !ofBtn || !ofHold) return;
  if (mqMobile.matches) {
    ofCta.style.transform = "";
    ofCta.style.bottom = "";
    return;
  }
  const card = ofCats[0];
  if (!card) return;
  ofCta.style.transform = "none";
  const bh = ofBtn.offsetHeight || 47;
  const band =
    ofHold.getBoundingClientRect().bottom - card.getBoundingClientRect().bottom;
  let s = 1;
  let gap: number;
  if (band >= BAND_REF) {
    // karty już nie rosną — stały odstęp, przycisk skaluje się w pasie
    gap = (BAND_REF - bh) / 2;
    s = Math.max(1, Math.min(1.6, (band - 2 * gap) / bh));
    gap = (band - s * bh) / 2;
  } else {
    gap = (band - bh) / 2;
    if (gap < 14) {
      s = Math.max(0.78, (band - 28) / bh);
      gap = (band - s * bh) / 2;
    }
  }
  ofCta.style.transformOrigin = "right bottom";
  ofCta.style.transform = `scale(${s.toFixed(3)})`;
  ofCta.style.bottom = `${Math.max(0, gap).toFixed(1)}px`;
}

/* ── pętla rysowania ── */
let raf = 0;
function tick() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    paint();
  });
}
const refresh = () => {
  fitCta();
  tick();
};
addEventListener("scroll", tick, { passive: true });
addEventListener("resize", refresh);
mqMobile.addEventListener("change", refresh);
// Layout stabilizuje się PO inicie modułu (fonty, obrazy, --hdr-h z RO
// navbara zmienia wysokość hero) — bez scrolla nikt by nie przemalował
// transformów (parallax „zamarzały" w geometrii sprzed stabilizacji;
// flaki zrzutów). Przemalowanie na każdą zmianę rozmiaru body + fonty +
// domknięcie load (moduł potrafi wystartować już po zdarzeniu).
new ResizeObserver(refresh).observe(document.body);
document.fonts?.ready.then(refresh);
if (document.readyState === "complete") refresh();
else addEventListener("load", refresh);
fitCta();
paint();
