import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Płynny scroll (Lenis) — WYŁĄCZNIE desktop (kółko). Na dotyku scroll
// NATYWNY (decyzja Mateusza przy 4.2 po teście na fizycznych telefonach:
// syncTouch pędził scroll JS-em na main thread i klatkował przy
// pełnoekranowych sekcjach strony głównej; delung — inaczej niż hadrianm —
// nie ma na mobile żadnej mechaniki wymagającej Lenisa). Razem z gałęzią
// touch odeszły jej stałe i guardy pinch/zoom (broniły przed
// przechwytywaniem dotyku przez Lenisa — natywny scroll ich nie
// potrzebuje); .claude/rules/scroll-lenis.md opisuje stan po tej zmianie.
// Ładowany przy no-preference (bramka w BaseLayout). Navbar/anchors
// używają window.__lenis do scrollTo (z fallbackiem natywnym).
//
// Pętla rysowania: WŁASNY requestAnimationFrame. Do Etapu 5 napędzał ją
// gsap.ticker, a `lenis.on("scroll", ScrollTrigger.update)` odświeżał
// ScrollTriggery — po porcie /kontakt/ w projekcie nie został ani jeden
// ScrollTrigger (sekcje 4.2–4.5 animują się własnymi pętlami rAF), więc
// GSAP wypadł z zależności. Zysk: chunk gsap+ScrollTrigger to było
// ~44,8 kB gz z ~68 kB skryptów strony głównej.

declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

// Wygładzanie kółka na desktopie: 0.1 = klasyczny Lenis; niżej = dłuższy
// wybieg (macOS-owe szybowanie); 1 = brak wygładzania (wraca skokowy scroll
// na rolkach z zapadkami).
const WHEEL_LERP = 0.05;

// Dotyk = scroll natywny (NIE media queries hover/pointer — laptopy
// z dotykiem kłamią; reguła scroll-lenis.md).
const isTouch = navigator.maxTouchPoints > 0;

const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

let lenis: Lenis | null = null;
let raf = 0;

function frame(time: number) {
  lenis?.raf(time); // rAF podaje ms — Lenis oczekuje ms
  raf = requestAnimationFrame(frame);
}

function start() {
  if (lenis || isTouch) return;

  lenis = new Lenis({ lerp: WHEEL_LERP, smoothWheel: true, syncTouch: false });
  window.__lenis = lenis;
  raf = requestAnimationFrame(frame);
}

function stop() {
  if (!lenis) return;
  cancelAnimationFrame(raf);
  raf = 0;
  lenis.destroy();
  lenis = null;
  window.__lenis = null;
}

if (!reduceMQ.matches) start();
reduceMQ.addEventListener("change", (e) => (e.matches ? stop() : start()));

// Powrót przez bfcache (history.back z podstron): resize'y omijają
// zamrożoną stronę, a pasek Safari zmienia w międzyczasie wysokość
// viewportu — bez przeliczenia limit Lenisa zostaje w STAREJ geometrii
// (iOS: dno strony „przesunięte o pasek"). Na dotyku Lenisa nie ma, więc
// handler jest wtedy no-opem.
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  lenis?.resize();
});
