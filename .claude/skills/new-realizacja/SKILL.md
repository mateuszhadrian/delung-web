---
name: new-realizacja
description: Pipeline dodania nowej realizacji do portfolio — przygotowanie zdjęć/wideo pod R2, wpis w panelu Sveltia, walidacja i weryfikacja na stronie. Użyj gdy trzeba dodać/zmienić projekt w Realizacjach.
argument-hint: "[nazwa-realizacji]"
---

Prowadzisz proces dodania realizacji „$ARGUMENTS" (jeśli brak nazwy — zapytaj).

Schemat docelowy delung (od Etapu 2, `src/content.schema.ts`): `slug`,
`order`, `title`, `category` (select — slugi z `src/lib/categories.ts`),
`year`, `description`, `cover` (zdjęcie + opcjonalny kadr `position`),
`gallery` (≥1 pozycja: zdjęcie + opcjonalnie kadr / wideo MP4 / `duration`),
`specs` (pary etykieta+wartość, np. MATERIAŁY / BLAT / ZAKRES).

## 1. Zbierz materiały

Tytuł, rok, kategoria (jedna ze slugów `categories.ts`), opis, zdjęcia
(okładka + galeria), opcjonalnie klipy wideo (MP4 H.264+AAC, 1080p,
≤ ~30 MB, przygotowane wg flow z Części C instrukcji — HandBrake preset),
specs (etykiety wielkimi literami — konwencja designu).

## 2. Przygotuj media (lokalnie, PRZED uploadem)

- Zdjęcia: WebP/wysokiej jakości JPEG; sensowne wymiary źródła
  ~1920 px szer. (serving robi Cloudflare Image Transformations przez
  `imgAt()` — do R2 idzie JEDEN oryginał). Konwersja:
  `node scripts/optimize-images.mjs <src> <out.webp> [szer]`.
- Wideo: MP4 (H.264+AAC, 1080p, faststart) — pipeline klienta: HandBrake
  preset „Delung – strona www" (Część C instrukcji).
- Pliki wynikowe zostaw w katalogu wskazanym przez Mateusza (NIE w repo).

## 3. Wpis w panelu — robi człowiek, Ty pilnujesz zasad

Przypomnij checklistę (sam NIE edytuj JSON-ów — pisze je Sveltia):

- panel: https://delung.pl/admin (login przez GitHub — konto
  `delung-cms`; lokalnie: `pnpm dev` → `http://localhost:4321/admin/index.html`);
- zdjęcia wgrywać przez pola Image, wideo przez pole „Wideo MP4" w pozycji
  galerii (widget file — upload MP4 do R2 potwierdzony spike'iem Etapu 2;
  upload przez bibliotekę Assets poza polami NIE trafia do R2!);
- wideo zawsze W PARZE ze zdjęciem tej samej pozycji galerii (zdjęcie =
  poster klatki); `duration` (np. "0:24") opcjonalnie do badge'a play;
- przy pierwszym uploadzie na nowym urządzeniu panel poprosi o R2 Secret
  Access Key (menedżer haseł);
- slug małymi literami, bez spacji (idzie do URL i nazwy pliku);
- „Kolejność": mniejsze = wyżej na liście.

## 4. Po zapisaniu wpisu (Sveltia commituje na main)

```!
git log --oneline -3
```

- `git pull`, potem `pnpm test:unit` — kontrakt CMS zwaliduje nowy JSON
  schemą Zod w ~2 s (czytelny raport błędów); potem `pnpm build`.
  Błędy schematu wyjaśnij i wskaż pole do poprawy W PANELU.
- Media w R2 sprawdzi
  `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`.
- Sprawdź na dev/preview: kafelek na liście, filtr kategorii, detal
  (Modal desktop / BottomSheet mobile), odtworzenie wideo na tap.
- Przy USUWANIU realizacji przypomnij: Sveltia nie kasuje plików z R2 —
  osierocone media sprząta się ręcznie w dashboardzie R2 (przy wideo
  szczególnie ważne).
