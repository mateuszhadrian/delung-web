// Otwarcie i mechanika detalu realizacji (część 4.4) — JEDEN overlay
// #work-detail (WorkDetailOverlay.astro), współdzielony przez siatkę
// /realizacje/ i zajawkę strony głównej. Wariant modal↔sheet to czysty
// CSS przy WORK_DESKTOP_MIN_PX (dawny próg 760/sheetMQ znika — D-R3);
// zmiana progu przy otwartym detalu ZAMYKA go (reguła sections.md).
//
// Treść klonowana z <template data-work-detail="slug"> do hosta
// [data-work-host] (dt-body) i czyszczona po zamknięciu (zwalnia
// obrazy/DOM). Galeria: <1024 karuzela snap (licznik ze scrolla toru),
// ≥1024 przełączanie translateX (strzałki/dashes) — a sama galeria
// wędruje między dt-body (mobile, strumień scrolla) a panelem .dt
// (desktop, lewa kolumna): wzorzec placeGal z eksportu, wykonywany przy
// klonowaniu (próg nie zmieni się przy otwartym — patrz wyżej).
//
// Korekty Mateusza po testach 4.4:
//  • tap/klik w kadr galerii (zdjęcie i wideo) otwiera PODGLĄD
//    PEŁNOEKRANOWY ([data-lightbox] w chrome overlaya): mobile swipe
//    (snap) + chevron-wstecz, desktop strzałki/dashes (przejazd toru)
//    + X + Esc; wyjście wraca na kadr oglądany w podglądzie;
//  • wideo odtwarza się na tap w badge DOPIERO w podglądzie;
//  • projnav nie robi crossfade'u — bieżący modal odjeżdża za krawędź
//    ekranu, następny wjeżdża zza przeciwnej.
//
// `window.overlay` typowane w scripts/overlay.ts (declare global).
import { WORK_DESKTOP_MIN_PX } from "./work-config";

const OVERLAY_ID = "work-detail";
const desktopMQ = matchMedia(`(min-width: ${WORK_DESKTOP_MIN_PX}px)`);
const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
const pad = (n: number) => String(n).padStart(2, "0");

// Kontekst nawigacji projnav (poprzednia/następna realizacja) — lista
// slugów w kolejności bieżącego widoku: /realizacje/ podaje aktualnie
// PRZEFILTROWANY zbiór (aktualizuje przy zmianie filtra), strona główna
// swoje 3 zajawki. Licznik „REALIZACJA NN / NN" czyta z tej listy.
let context: { slug: string; name: string }[] = [];
let current = "";
let shot = 0;

export function setDetailContext(items: { slug: string; name: string }[]) {
  context = items;
}

function overlayEl() {
  return document.getElementById(OVERLAY_ID);
}

function q<T extends HTMLElement>(sel: string): T | null {
  return overlayEl()?.querySelector<T>(sel) ?? null;
}

function pauseVideos() {
  overlayEl()
    ?.querySelectorAll<HTMLVideoElement>("video")
    .forEach((v) => {
      v.pause();
    });
}

/* ── galeria ── */

function paintShot() {
  const track = q<HTMLElement>("[data-track]");
  if (!track) return;
  const n = track.children.length;
  shot = Math.max(0, Math.min(n - 1, shot));

  const count = q<HTMLElement>("[data-shotcount]");
  if (count) count.textContent = `${pad(shot + 1)} / ${pad(n)}`;
  overlayEl()
    ?.querySelectorAll<HTMLElement>("[data-dashes] [data-shot]")
    .forEach((d, i) => d.classList.toggle("on", i === shot));

  if (desktopMQ.matches) {
    track.style.transform = `translateX(${-shot * 100}%)`;
  } else {
    track.style.transform = "";
    const slide = track.children[shot] as HTMLElement | undefined;
    if (slide) {
      track.scrollTo({
        left: slide.offsetLeft - track.offsetLeft,
        behavior: reduceMQ.matches ? "auto" : "smooth",
      });
    }
  }

  const prev = q<HTMLButtonElement>("[data-prevshot]");
  const next = q<HTMLButtonElement>("[data-nextshot]");
  if (prev) prev.disabled = shot === 0;
  if (next) next.disabled = shot === n - 1;
}

/** Licznik nadąża za ręcznym przewijaniem karuzeli (mobile). */
function onTrackScroll(e: Event) {
  if (desktopMQ.matches) return;
  const track = e.currentTarget as HTMLElement;
  const first = track.children[0] as HTMLElement | undefined;
  if (!first) return;
  const w = first.offsetWidth + 10; // szerokość kafla + gap toru
  const n = Math.round(track.scrollLeft / w);
  if (n === shot) return;
  shot = Math.max(0, Math.min(track.children.length - 1, n));
  const count = q<HTMLElement>("[data-shotcount]");
  if (count)
    count.textContent = `${pad(shot + 1)} / ${pad(track.children.length)}`;
}

/* ── montaż treści projektu w hoście ── */

function mount(slug: string): boolean {
  const tpl = document.querySelector<HTMLTemplateElement>(
    `template[data-work-detail="${slug}"]`,
  );
  const el = overlayEl();
  const host = el?.querySelector<HTMLElement>("[data-work-host]");
  const panel = el?.querySelector<HTMLElement>("[data-overlay-panel]");
  if (!tpl || !el || !host || !panel) return false;

  pauseVideos();
  // sprzątnij ewentualną galerię przeniesioną do panelu (poprzedni projekt)
  panel.querySelector(":scope > .dt-gal, :scope > [data-gal]")?.remove();
  host.replaceChildren(tpl.content.cloneNode(true));

  // placeGal eksportu: desktop przenosi galerię do panelu (lewa kolumna);
  // scoped-klasy Astro wędrują z węzłem, style działają po przeniesieniu.
  const gal = host.querySelector<HTMLElement>("[data-gal]");
  if (gal && desktopMQ.matches) panel.insertBefore(gal, host);

  // licznik REALIZACJA NN / NN z kontekstu widoku
  const idx = context.findIndex((c) => c.slug === slug);
  const pc = host.querySelector<HTMLElement>("[data-projcount]");
  if (pc && idx >= 0 && context.length)
    pc.textContent = `REALIZACJA ${pad(idx + 1)} / ${pad(context.length)}`;

  host
    .querySelector<HTMLElement>("[data-track]")
    ?.addEventListener("scroll", onTrackScroll, { passive: true });

  current = slug;
  shot = 0;
  host.scrollTop = 0;
  paintShot();
  return true;
}

function cleanup() {
  closeLightbox();
  const el = overlayEl();
  if (!el) return;
  pauseVideos();
  el.querySelector<HTMLElement>(
    "[data-overlay-panel] > .dt-gal, [data-overlay-panel] > [data-gal]",
  )?.remove();
  el.querySelector<HTMLElement>("[data-work-host]")?.replaceChildren();
  current = "";
  exiting = false;
  swapSeq += 1; // unieważnij wiszące timeouty przejazdu projnav
}

export function openWorkDetail(slug: string, name: string) {
  if (!window.overlay || !mount(slug)) return;
  window.overlay.open(OVERLAY_ID, { label: name, onClose: cleanup });
}

/* ── projnav: poprzednia/następna realizacja (desktop, pętla) ── */

let exiting = false; // blokada tylko na czas ZJAZDU (wjazd można przerwać)
let swapSeq = 0; // unieważnia wiszące timeouty po close/kolejnym kroku

function stepProject(dir: 1 | -1) {
  if (exiting || !current || context.length < 2) return;
  const idx = context.findIndex((c) => c.slug === current);
  if (idx < 0) return;
  const nextItem = context[(idx + dir + context.length) % context.length];
  const el = overlayEl();
  const panel = el?.querySelector<HTMLElement>("[data-overlay-panel]");
  if (!el || !panel) return;

  const swap = () => {
    if (mount(nextItem.slug)) el.setAttribute("aria-label", nextItem.name);
  };
  if (reduceMQ.matches) {
    swap();
    return;
  }

  // Przejazd (korekta Mateusza): przy „następna" cały modal odjeżdża za
  // LEWĄ krawędź ekranu, nowy wjeżdża zza PRAWEJ (przy „poprzednia"
  // lustrzanie). 100vw ponad wyśrodkowanie gwarantuje pełne zejście
  // z ekranu (panel ma maks. 92vw szerokości).
  exiting = true;
  const seq = ++swapSeq;
  const MS = 420;
  panel.style.transition = `transform ${MS}ms cubic-bezier(0.45, 0, 0.55, 1)`;
  panel.style.transform = `translate(calc(-50% - ${dir * 100}vw), -50%) scale(1)`;
  window.setTimeout(() => {
    if (seq !== swapSeq) return; // przerwane (close) — nie montuj po fakcie
    swap();
    panel.style.transition = "none";
    panel.style.transform = `translate(calc(-50% + ${dir * 100}vw), -50%) scale(1)`;
    void panel.offsetWidth;
    panel.style.transition = `transform ${MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    panel.style.transform = ""; // wraca do transformu klasy is-open (środek)
    // wjazd można przerwać kolejnym krokiem — zwolnij blokadę od razu
    exiting = false;
    window.setTimeout(() => {
      if (seq !== swapSeq || exiting) return; // nowy krok w toku
      panel.style.transition = "";
    }, MS + 40);
  }, MS);
}

/* ── podgląd pełnoekranowy galerii (korekta Mateusza po testach 4.4) ── */

let lbOpen = false;
let lbIndex = 0;
let lbSwallowClick = false; // tap kończący gest swipe-down ≠ kliknięcie

function lbTrackEl() {
  return q<HTMLElement>("[data-lb-track]");
}

function lbEl() {
  return q<HTMLElement>("[data-lightbox]");
}

/* Wyraźny swipe-down zamyka podgląd (mobile — korekta Mateusza).
   Pion jest wolny (tor przewija tylko poziomo, touch-action: pan-x);
   podgląd podąża za palcem i wraca, gdy gest nie przekroczy progu. */
const LB_CLOSE_PX = 100;
let lbDrag: {
  startX: number;
  startY: number;
  dy: number;
  axis: "" | "v" | "h";
} | null = null;

function onLbPointerMove(e: PointerEvent) {
  const lb = lbEl();
  if (!lbDrag || !lb) return;
  const dx = e.clientX - lbDrag.startX;
  const dy = e.clientY - lbDrag.startY;
  if (!lbDrag.axis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    lbDrag.axis = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
  }
  if (lbDrag.axis !== "v") return;
  lbDrag.dy = Math.max(0, dy);
  lb.style.transform = `translateY(${lbDrag.dy}px)`;
}

function onLbPointerEnd(e: PointerEvent) {
  if (!lbDrag) return;
  const { dy, axis } = lbDrag;
  lbDrag = null;
  window.removeEventListener("pointermove", onLbPointerMove);
  window.removeEventListener("pointerup", onLbPointerEnd);
  window.removeEventListener("pointercancel", onLbPointerEnd);
  const lb = lbEl();
  if (lb) lb.style.transform = "";
  if (axis === "v" && dy > LB_CLOSE_PX && e.type !== "pointercancel") {
    lbSwallowClick = true;
    closeLightbox();
  }
}

function pauseLbVideos() {
  q<HTMLElement>("[data-lightbox]")
    ?.querySelectorAll<HTMLVideoElement>("video")
    .forEach((v) => {
      v.pause();
    });
}

/** Liczniki/dashes/przyciski podglądu — bez ruszania toru. */
function paintLbIndicators(n: number) {
  const el = overlayEl();
  if (!el) return;
  el.querySelectorAll<HTMLElement>("[data-lb-count]").forEach((c) => {
    c.textContent = `${pad(lbIndex + 1)} / ${pad(n)}`;
  });
  el.querySelectorAll<HTMLElement>("[data-lb-dashes] button").forEach((d, i) =>
    d.classList.toggle("on", i === lbIndex),
  );
  const prev = el.querySelector<HTMLButtonElement>("[data-lb-prev]");
  const next = el.querySelector<HTMLButtonElement>("[data-lb-next]");
  if (prev) prev.disabled = lbIndex === 0;
  if (next) next.disabled = lbIndex === n - 1;
}

function paintLb(instant = false) {
  const track = lbTrackEl();
  if (!track) return;
  const n = track.children.length;
  lbIndex = Math.max(0, Math.min(n - 1, lbIndex));
  paintLbIndicators(n);

  if (desktopMQ.matches) {
    // przejazd toru: bieżący kadr odjeżdża w lewo, następny wjeżdża
    // z prawej (i lustrzanie) — transition z bloku is:global
    if (instant) track.style.transition = "none";
    track.style.transform = `translateX(${-lbIndex * 100}%)`;
    if (instant) {
      void track.offsetWidth;
      track.style.transition = "";
    }
  } else {
    track.style.transform = "";
    const slide = track.children[lbIndex] as HTMLElement | undefined;
    if (slide) {
      track.scrollTo({
        left: slide.offsetLeft - track.offsetLeft,
        behavior: instant || reduceMQ.matches ? "auto" : "smooth",
      });
    }
  }
}

/** Licznik podglądu nadąża za swipe (mobile). */
function onLbScroll(e: Event) {
  if (desktopMQ.matches) return;
  const track = e.currentTarget as HTMLElement;
  const w = track.clientWidth || 1;
  const n = Math.round(track.scrollLeft / w);
  if (n === lbIndex) return;
  lbIndex = Math.max(0, Math.min(track.children.length - 1, n));
  pauseLbVideos();
  paintLbIndicators(track.children.length);
}

function openLightbox(startIdx: number, autoplay = false) {
  const el = overlayEl();
  const lb = el?.querySelector<HTMLElement>("[data-lightbox]");
  const lbTrack = lbTrackEl();
  const gTrack = q<HTMLElement>("[data-track]");
  if (!el || !lb || !lbTrack || !gTrack) return;

  pauseVideos();
  // slajdy = klony kadrów galerii (img/video + ikonka kamery + czas);
  // scoped-klasy WorkDetail wędrują z klonami, layout robi blok is:global
  lbTrack.replaceChildren(
    ...Array.from(gTrack.children).map((slideEl) => {
      const s = document.createElement("div");
      s.className = "lb-slide";
      const m = document.createElement("div");
      m.className = "lb-media";
      Array.from(slideEl.children).forEach((child) => {
        m.appendChild(child.cloneNode(true));
      });
      s.appendChild(m);
      // ikonka kamery żyje ze stanem odtwarzania (pauza = ikonka wraca)
      const v = m.querySelector<HTMLVideoElement>("video");
      v?.addEventListener("play", () => s.classList.add("is-playing"));
      v?.addEventListener("pause", () => s.classList.remove("is-playing"));
      return s;
    }),
  );
  const dashes = el.querySelector<HTMLElement>("[data-lb-dashes]");
  dashes?.replaceChildren(
    ...Array.from(gTrack.children).map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.lbShot = String(i);
      b.setAttribute("aria-label", `Zdjęcie ${i + 1}`);
      return b;
    }),
  );

  lb.hidden = false;
  lbOpen = true;
  lbIndex = startIdx;
  paintLb(true);
  // kolejność z korekty Mateusza: najpierw startuje film, potem widać
  // pełny ekran już GRAJĄCEGO klipu (wciąż w geście usera — autoplay OK)
  if (autoplay) {
    void (lbTrack.children[lbIndex] as HTMLElement | undefined)
      ?.querySelector<HTMLVideoElement>("video")
      ?.play();
  }
  // fokus na kontener, nie na chevron/X — iOS rysuje pierścień na
  // programowo fokusowanych przyciskach (korekta Mateusza)
  lb.focus({ preventScroll: true });
}

function closeLightbox() {
  const el = overlayEl();
  const lb = el?.querySelector<HTMLElement>("[data-lightbox]");
  if (!el || !lb || lb.hidden) return;
  pauseLbVideos();
  // wyjście wraca na kadr oglądany w podglądzie (korekta Mateusza)
  shot = lbIndex;
  lb.style.transform = "";
  lb.hidden = true;
  lbOpen = false;
  lbTrackEl()?.replaceChildren();
  el.querySelector<HTMLElement>("[data-lb-dashes]")?.replaceChildren();
  paintShot();
  el.querySelector<HTMLElement>("[data-overlay-panel]")?.focus({
    preventScroll: true,
  });
}

/* ── zdarzenia treści (delegacja na dokumencie — treść jest klonowana;
   wszystkie cele leżą WEWNĄTRZ panelu, więc overlay.ts ich nie zamyka) ── */

document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  const el = overlayEl();
  if (!el || el.hidden || !el.contains(t)) return;

  // tap zakończony gestem swipe-down podglądu — nie jest kliknięciem
  if (lbSwallowClick) {
    lbSwallowClick = false;
    return;
  }

  // W podglądzie pełnoekranowym: tap/klik w kadr WIDEO przełącza
  // play↔pauza (korekta Mateusza — bez własnego znaku play; stan
  // sygnalizuje ikonka kamery przez zdarzenia play/pause).
  if (t.closest("[data-lightbox]")) {
    const video = t
      .closest<HTMLElement>(".lb-slide")
      ?.querySelector<HTMLVideoElement>("video");
    if (video) {
      if (video.paused) void video.play();
      else video.pause();
    }
    return;
  }

  // Tap/klik w kadr galerii → podgląd pełnoekranowy od tego kadru;
  // kadr wideo od razu STARTUJE film (pełny ekran pokazuje grający klip).
  const slideEl = t.closest<HTMLElement>("[data-slide]");
  if (slideEl) {
    const gTrack = q<HTMLElement>("[data-track]");
    const idx = gTrack
      ? Array.prototype.indexOf.call(gTrack.children, slideEl)
      : -1;
    if (idx >= 0) openLightbox(idx, Boolean(slideEl.querySelector("video")));
    return;
  }

  if (t.closest("[data-prevshot]")) {
    shot -= 1;
    paintShot();
    return;
  }
  if (t.closest("[data-nextshot]")) {
    shot += 1;
    paintShot();
    return;
  }
  const dash = t.closest<HTMLElement>("[data-shot]");
  if (dash) {
    shot = Number(dash.dataset.shot) || 0;
    paintShot();
  }
});

/* ── projnav: przyciski to statyczny chrome POZA panelem — listenery
   elementowe (odpalają PRZED dokumentowymi), stopPropagation gwarantuje,
   że delegacja overlay.ts nie uzna kliknięcia za „klik w tło" ── */

function bindChrome() {
  const el = overlayEl();
  if (!el) return;
  el.querySelector("[data-prevproj]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    stepProject(-1);
  });
  el.querySelector("[data-nextproj]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    stepProject(1);
  });

  // chrome podglądu pełnoekranowego (statyczny — listenery elementowe)
  el.querySelectorAll("[data-lb-close]").forEach((b) =>
    b.addEventListener("click", () => closeLightbox()),
  );
  el.querySelector("[data-lb-prev]")?.addEventListener("click", () => {
    lbIndex -= 1;
    pauseLbVideos();
    paintLb();
  });
  el.querySelector("[data-lb-next]")?.addEventListener("click", () => {
    lbIndex += 1;
    pauseLbVideos();
    paintLb();
  });
  el.querySelector<HTMLElement>("[data-lb-dashes]")?.addEventListener(
    "click",
    (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-lb-shot]",
      );
      if (!b) return;
      lbIndex = Number(b.dataset.lbShot) || 0;
      pauseLbVideos();
      paintLb();
    },
  );
  el.querySelector<HTMLElement>("[data-lb-track]")?.addEventListener(
    "scroll",
    onLbScroll,
    { passive: true },
  );

  // swipe-down zamykający podgląd (mobile)
  el.querySelector<HTMLElement>("[data-lightbox]")?.addEventListener(
    "pointerdown",
    (e) => {
      if (desktopMQ.matches || !lbOpen || lbDrag) return;
      if ((e.target as HTMLElement).closest("[data-lb-close]")) return;
      lbDrag = { startX: e.clientX, startY: e.clientY, dy: 0, axis: "" };
      window.addEventListener("pointermove", onLbPointerMove, {
        passive: true,
      });
      window.addEventListener("pointerup", onLbPointerEnd);
      window.addEventListener("pointercancel", onLbPointerEnd);
    },
  );
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindChrome, { once: true });
} else {
  bindChrome();
}

// Esc w podglądzie pełnoekranowym zamyka TYLKO podgląd (capture — musi
// ubiec bąbelkowy keydown overlay.ts, który zamknąłby cały detal).
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Escape" || !lbOpen) return;
    e.preventDefault();
    e.stopPropagation();
    closeLightbox();
  },
  true,
);

// Zmiana progu (modal ↔ sheet CSS) przy otwartym detalu: zamknij — layout
// i miejsce galerii w DOM są per-próg (reguła sections.md).
desktopMQ.addEventListener("change", () => {
  if (current) window.overlay?.close(OVERLAY_ID);
});
