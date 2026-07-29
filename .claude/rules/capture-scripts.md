---
paths:
  - "scripts/**/*.mjs"
---

# Skrypty dev-only (capture / optymalizacja) — reguły

- `capture-ambient-bg.mjs` (`pnpm capture:ambient-bg`): samowystarczalny
  pipeline (Playwright + sharp, paleta z `ambient-palette.ts`) — bez dev
  servera; regeneruje `public/ambient-bg-mobile-{red,blue}.webp` po zmianie
  wyglądu `AmbientBackground` / palety. UWAGA: ambient jest dziedzictwem
  szablonu — używany tymczasowo w widokach legacy-dark (realizacje/
  kontakt); przy porcie widoków na jasny design delung (Etap 4/5) może
  wylecieć razem z tym skryptem.
- `optimize-images.mjs`: PNG z eksportów designów (docs/design/assets —
  POZA repo, w .gitignore) → WebP w docelowych rozmiarach do `src/assets/`
  (`node scripts/optimize-images.mjs <src> <out.webp> [szer] [q]`).
  Osobne warianty desktop/mobile tam, gdzie mobile wymaga odciążenia (D6).
  Obrazy REALIZACJI nie idą do repo — od początku R2 + `imgAt()` (Etap 2).
- `lhci-median.mjs`: helper agregacji przebiegów LHCI — nie ruszać bez
  zmiany konfiguracji lighthouserc.
