---
paths:
  - "src/content/**"
  - "src/content.schema.ts"
  - "src/content.config.ts"
  - "public/admin/**"
  - "src/lib/img.ts"
  - "src/components/sections/work/**"
---

# CMS (Sveltia) + Realizacje + media R2 — reguły

## Własność plików

- `src/content/realizacje/*.json` pisze WYŁĄCZNIE Sveltia (panel `/admin`,
  commituje przez GitHub API na `main`, omijając husky). Ręczna edycja
  zabroniona (jest hook-guard); pliki są w `.prettierignore` — Sveltia ma
  własny formater (tablice zawsze wielolinijkowe).

## Schemat danych — zmiana w TRZECH miejscach naraz

1. Zod: `src/content.schema.ts` — źródło prawdy (czysty Zod, współdzielony
   z testem kontraktu CMS); `src/content.config.ts` tylko go importuje
   i podpina do kolekcji (walidacja w buildzie),
2. panel: `public/admin/config.yml` (definicje pól — PL-only, bez {pl,en}),
3. konsumenci: `src/components/sections/work/*`.
   Niespójność = build przechodzi lokalnie, a wpis z panelu wybucha w CI.

- Schemat AKTUALNY (po remoncie panelu, `docs/analiza-remont-panelu.md`):
  `slug`, `order`, `title`, `category` (`select` — opcje 1:1 ze slugami/
  etykietami `src/lib/categories.ts`; spójności pilnuje test kontraktu),
  `year`, `description`, `gallery[]` (min 1), `specs[] {label, value}`.
- **Pola `cover` NIE MA.** Kaflem realizacji na `/realizacje/` i w scenie na
  stronie głównej jest **pierwsza pozycja galerii**; `viewProject()`
  (`work-data.ts`) wylicza z niej `cover` dla komponentów.
- **Pozycja galerii to WARIANT, nie suma pól** — albo zdjęcie, albo film:
  - `{type: "photo", image, position?}`
  - `{type: "video", video, duration?, position?}` — **bez `image`**
    Wymusza to sam panel (`types`/`typeKey` Sveltii), więc klient nie może
    wypełnić obu naraz. Dyskryminator `type` zapisuje Sveltia.
- **Pierwsza pozycja musi być zdjęciem** (jest kaflem). Panel nie umie
  warunku „na tej pozycji", więc łapie to dopiero `.superRefine` w Zodzie —
  komunikat jest napisany dla klienta, nie dla programisty. Nie zamieniaj go
  na domyślny tekst Zoda.
- Miniatura filmu **nie jest osobnym plikiem**: powstaje z klatki filmu
  (`videoFrameAt()` w `src/lib/img.ts` → `/cdn-cgi/media/mode=frame`).
  Środek liczony z pola `duration` („0:24" → `time=12s`), brak/śmieć → 1 s.

## Media (Cloudflare R2)

- Bucket `delung-media`, domena publiczna `https://media.delung.pl`,
  prefix `realizacje/`. Zdjęcia i wideo NIE trafiają do repo.
- Sveltia wgrywa do R2 przez pola wpisu: Image (zdjęcia) oraz `file`
  (wideo MP4 — plan A potwierdzony spike'iem Etapu 2; upload przez
  bibliotekę Assets poza polami NIE trafia do R2). Sveltia NIE kasuje
  plików z R2 przy usuwaniu wpisu — osierocone pliki trzeba sprzątać
  ręcznie w dashboardzie R2 (przy wideo istotniejsze niż przy zdjęciach).
- Rozmiary obrazów: wyłącznie przez `imgAt()` (`src/lib/img.ts`) —
  Cloudflare Image Transformations (`/cdn-cgi/image/...`). W dev endpoint
  nie istnieje → funkcja zwraca oryginał; NIE debuguj „złych rozmiarów"
  lokalnie.
- Wideo BEZ transformacji — sam plik serwowany wprost z R2
  (`<video preload="none" poster={videoFrameAt(...)}>`). **Poster to klatka
  z tego samego filmu** (Media Transformations, JPEG, cache 20 dni) — nie
  ma już „zdjęcia-plakatu" w pozycji galerii. Limity pliku bez zmian:
  H.264+AAC, 1080p, ≤ ~30 MB/klip.
- Oba endpointy `/cdn-cgi/` (`image` i `media`) istnieją **wyłącznie na
  produkcji** — lokalnie 404. `imgAt()` oddaje wtedy oryginał, `videoFrameAt()`
  nie zwraca postera; kolektor problemów w testach (`tests/helpers/guards.ts`)
  filtruje oba. NIE debuguj miniatur ani rozmiarów lokalnie.
- Dostępności mediów NIE pilnuje żadne CI: schemat sprawdza tylko, że adres
  jest napisem. `tests/unit/media-r2.test.ts` (HEAD po każdym URL-u) biega
  wyłącznie z `CHECK_REMOTE_MEDIA=1` — ręcznie i w `/release-check`. Po
  sprzątaniu bucketa odpal go sam.

## Autoryzacja panelu

- Logowanie przez Worker `sveltia-cms-auth-delung` (`base_url`
  w config.yml — `https://auth.delung.pl`). Worker to OSOBNY deploy dla
  delung (czysty branding i kill-switch; wdrożony w Etapie 2).
- `site_domain: delung.pl` w config.yml jest OBOWIĄZKOWE: bez niego panel
  na localhoscie wysyła `site_id=cms.netlify.com` (dziedzictwo Netlify
  w Sveltii) i wpada na ALLOWED_DOMAINS Workera.
- Klient loguje się kontem technicznym `delung-cms` (collaborator write
  wyłącznie do tego repo); konto ma wpis User-bypass (tryb Always)
  w rulesecie `main-protection` — commituje na `main` z panelu; ludzie
  chodzą przez PR-y (właściciel bez bypassu).
