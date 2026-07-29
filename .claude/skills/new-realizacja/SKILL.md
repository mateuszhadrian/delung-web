---
name: new-realizacja
description: Pipeline dodania nowej realizacji do portfolio — przygotowanie zdjęć/wideo pod R2, wpis w panelu Sveltia, walidacja i weryfikacja na stronie. Użyj gdy trzeba dodać/zmienić projekt w Realizacjach.
argument-hint: "[nazwa-realizacji]"
---

Prowadzisz proces dodania realizacji „$ARGUMENTS" (jeśli brak nazwy — zapytaj).

UWAGA (Etap 0–2): schemat kolekcji jest jeszcze PRZEJŚCIOWY (odziedziczony
z szablonu — screens/results/quote). Docelowe pola delung (category ze
slugami z `src/lib/categories.ts`, cover, gallery ze zdjęciami i WIDEO,
specs) wchodzą w Etapie 2 — wtedy zaktualizuj też ten skill.

## 1. Zbierz materiały

Wg AKTUALNEGO schematu (`src/content.schema.ts` — sprawdź przed startem):
nazwa, rok, kategoria (docelowo slug z `categories.ts`), opis, zdjęcia
(okładka + galeria), opcjonalnie klipy wideo (MP4 H.264, ≤ ~30 MB,
przygotowane wg flow z Części C instrukcji — HandBrake preset), specs.

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
  `delung-cms` lub Mateusza);
- zdjęcia wgrywać WYŁĄCZNIE przez pola Image (upload przez bibliotekę
  Assets NIE trafia do R2!); wideo wg wyniku spike'a Etapu 2
  (widget file albo wklejany URL `https://media.delung.pl/…`);
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
