// Jedyne miejsce, które wie „skąd brać obrazek w danym rozmiarze" — a od
// remontu panelu także „skąd brać miniaturę filmu".
// Etap 5: skalowanie w locie przez Cloudflare Image Transformations —
// jeden oryginał w R2, każdy rozmiar powstaje z adresu URL.
export function imgAt(src: string, width: "full" | "mobile"): string {
  // Lokalnie (dev/preview) endpoint /cdn-cgi/image nie istnieje — pokaż oryginał.
  if (import.meta.env.DEV) return src;
  const w = width === "mobile" ? 320 : 960; // szerokości pod telefon / desktop
  // format=auto → przeglądarka dostaje AVIF/WebP automatycznie.
  // replace: źródło bez wiodącego "/" (stare ścieżki z repo typu /realizacje/…);
  // pełne URL-e https://media.delung.pl/… przechodzą bez zmian.
  return `/cdn-cgi/image/width=${w},format=auto/${src.replace(/^\//, "")}`;
}

// Sekunda, z której bierzemy klatkę: ŚRODEK filmu, policzony z opisowego pola
// „Długość wideo" panelu ("0:24" → 12). Klient wpisuje je odręcznie, więc
// przyjmujemy i "m:ss", i same sekundy, a wszystko inne (brak, literówka,
// "ok. pół minuty") spada na 1 s — klatka gorsza, ale zawsze jakaś.
// Krótkie klipy też zostają na 1 s: środek 2-sekundowego filmu to nadal
// pierwsza sekunda, a `time=0s` bywa czarną klatką przejścia.
function frameSecond(duration?: string): number {
  const raw = duration?.trim() ?? "";
  const mmss = /^(\d+):([0-5]\d)$/.exec(raw);
  const seconds = mmss
    ? Number(mmss[1]) * 60 + Number(mmss[2])
    : /^\d+$/.test(raw)
      ? Number(raw)
      : 0;
  return seconds > 2 ? Math.floor(seconds / 2) : 1;
}

// Miniatura filmu = klatka wycięta z pliku w R2 przez Cloudflare Media
// Transformations (`/cdn-cgi/media`, zwraca JPEG-a i cache'uje go na 20 dni).
// Od remontu panelu pozycja galerii z filmem NIE MA własnego zdjęcia, więc to
// jedyne źródło plakatu — stąd ta funkcja mieszka obok imgAt(), a nie w
// komponencie.
// UWAGA: `time` poza długością klipu to po stronie Cloudflare błąd 400 (pusty
// plakat, nic poza tym) — dlatego długość podana przez klienta ma być prawdziwa.
export function videoFrameAt(
  src: string,
  duration?: string,
): string | undefined {
  // Lokalnie (dev) endpoint /cdn-cgi/media nie istnieje — lepiej BRAK postera
  // niż atrybut wskazujący na 404. Nie debuguj miniatur wideo na localhoście.
  if (import.meta.env.DEV) return undefined;
  return `/cdn-cgi/media/mode=frame,time=${frameSecond(duration)}s,width=960/${src.replace(/^\//, "")}`;
}
