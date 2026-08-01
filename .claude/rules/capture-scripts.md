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
