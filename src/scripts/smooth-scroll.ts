import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Płynny scroll (Lenis) — WYŁĄCZNIE desktop (kółko). Na dotyku scroll
// NATYWNY (decyzja Mateusza przy 4.2 po teście na telefonach: syncTouch
// pędził scroll JS-em na main thread i klatkował przy pełnoekranowych
// sekcjach strony głównej; delung — inaczej niż hadrianm — nie ma na
// mobile żadnej mechaniki wymagającej Lenisa). Razem z gałęzią touch
// odeszły jej stałe i guardy pinch/zoom (broniły przed przechwytywaniem
// dotyku przez Lenisa — natywny scroll ich nie potrzebuje);
// .claude/rules/scroll-lenis.md opisuje stan po tej zmianie.
// Ładowany przy no-preference (bramka w BaseLayout). Navbar/anchors
// używają window.__lenis do scrollTo (z fallbackiem natywnym).

gsap.registerPlugin(ScrollTrigger);

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

function start() {
  if (lenis || isTouch) return;

  lenis = new Lenis({ lerp: WHEEL_LERP, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

function tick(time: number) {
  lenis?.raf(time * 1000); // ticker: sekundy → Lenis: milisekundy
}

function stop() {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  lenis.destroy();
  lenis = null;
  window.__lenis = null;
}

if (!reduceMQ.matches) start();
reduceMQ.addEventListener("change", (e) => (e.matches ? stop() : start()));

// Powrót przez bfcache (history.back z podstron): resize'y omijają
// zamrożoną stronę, a pasek Safari zmienia w międzyczasie wysokość
// viewportu — bez przeliczenia limit Lenisa i pozycje ScrollTriggerów
// zostają w STAREJ geometrii (iOS: dno strony „przesunięte o pasek").
// Na dotyku Lenisa nie ma, ale ScrollTrigger.refresh() dalej jest
// potrzebny sekcjom GSAP.
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  lenis?.resize();
  ScrollTrigger.refresh();
});
