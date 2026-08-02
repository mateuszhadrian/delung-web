---
paths:
  - "scripts/**/*.mjs"
---

# Skrypty dev-only (capture / optymalizacja) — reguły

- `capture-ambient-bg.mjs` — **SKASOWANY w Etapie 5** razem z całym
  ambientem (`components/backgrounds/`, tekstury `public/ambient-bg-*`,
  skrypt `pnpm capture:ambient-bg`). Ambient był dziedzictwem szablonu
  i żył wyłącznie w widokach na ciemnym motywie; po porcie `/kontakt/`
  stracił ostatniego konsumenta.
- `optimize-images.mjs`: PNG z eksportów designów (docs/design/assets —
  POZA repo, w .gitignore) → WebP w docelowych rozmiarach do `src/assets/`
  (`node scripts/optimize-images.mjs <src> <out.webp> [szer] [q]`).
  Osobne warianty desktop/mobile tam, gdzie mobile wymaga odciążenia (D6).
  Obrazy REALIZACJI nie idą do repo — od początku R2 + `imgAt()` (Etap 2).
- `lhci-median.mjs`: helper agregacji przebiegów LHCI — nie ruszać bez
  zmiany konfiguracji lighthouserc.
- `make-icons.mjs` (Etap 6, D-E11): komplet zasobów marki jednym poleceniem
  (`node scripts/make-icons.mjs`) — `favicon.ico` (16+32+48), `apple-touch-icon`,
  `icon-192/512` renderowane Z WEKTORA `public/favicon.svg` (jedyne źródło
  rysunku znaczka: sam znaczek na białym kwadracie, margines 6% — przy 10%
  szczeliny znikały w 16 px) oraz `og-image.png` (pełne logo na tle cream,
  1200×630). Ikony są BEZ alfy (iOS podkłada czerń). Nie podmieniaj tych
  plików ręcznie — po zmianie `favicon.svg` przepuść skrypt. Odrys znaczka
  jest weryfikowalny: render ścieżek vs kadr znaczka z oryginału, próg
  ≤ 2% różniących się pikseli (stan: 0,60%).
