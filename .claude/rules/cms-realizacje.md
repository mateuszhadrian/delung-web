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

- STAN PRZEJŚCIOWY (Etap 0): schemat odziedziczony z szablonu
  (screens/results/quote). Docelowy schemat delung (category jako `select`
  ze slugami z `src/lib/categories.ts`, cover, gallery ze zdjęciami
  I WIDEO, specs — analiza §6.1) wchodzi w Etapie 2 — również w trzech
  miejscach naraz + spike uploadu MP4 (§6.3; plan B: pole URL).

## Media (Cloudflare R2)

- Bucket `delung-media`, domena publiczna `https://media.delung.pl`,
  prefix `realizacje/`. Zdjęcia i wideo NIE trafiają do repo.
- Sveltia wgrywa do R2 TYLKO przez pola Image (nie przez bibliotekę
  Assets) i NIE kasuje plików z R2 przy usuwaniu wpisu — osierocone pliki
  trzeba sprzątać ręcznie w dashboardzie R2 (przy wideo istotniejsze niż
  przy zdjęciach).
- Rozmiary obrazów: wyłącznie przez `imgAt()` (`src/lib/img.ts`) —
  Cloudflare Image Transformations (`/cdn-cgi/image/...`). W dev endpoint
  nie istnieje → funkcja zwraca oryginał; NIE debuguj „złych rozmiarów"
  lokalnie.
- Wideo BEZ transformacji — serwowane wprost z R2
  (`<video preload="none" poster={imgAt(...)}>`; poster = obraz z tej
  samej pozycji galerii). Limity: H.264+AAC, 1080p, ≤ ~30 MB/klip.
- Tagi: max 3 (pilnuje Zod i UI) — nie zwiększaj bez zmiany UI.

## Autoryzacja panelu

- Logowanie przez Worker `sveltia-cms-auth-delung` (`base_url`
  w config.yml — docelowo `https://auth.delung.pl`). Worker to OSOBNY
  deploy dla delung (czysty branding i kill-switch; wdrożenie: Etap 2).
- Klient loguje się kontem technicznym `delung-cms` (collaborator write
  wyłącznie do tego repo); konto musi móc commitować na `main` z panelu
  (branch protection wymuszaj przez PR dla ludzi, nie blokuj CMS-a).
