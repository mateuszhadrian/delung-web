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

- Schemat DOCELOWY (od Etapu 2, analiza §6.1): `slug`, `order`, `title`,
  `category` (`select` — opcje 1:1 ze slugami/etykietami
  `src/lib/categories.ts`; spójności pilnuje test kontraktu), `year`,
  `description`, `cover {image, position?}`, `gallery[] {image, position?,
video?, duration?}` (min 1), `specs[] {label, value}`.

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
- Wideo BEZ transformacji — serwowane wprost z R2
  (`<video preload="none" poster={imgAt(...)}>`; poster = obraz z tej
  samej pozycji galerii). Limity: H.264+AAC, 1080p, ≤ ~30 MB/klip.
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
