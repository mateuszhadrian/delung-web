# delung-web

Strona firmowa **Delung Meble** (meble na wymiar) — `delung.pl`.
Wizytówka z portfolio realizacji (zdjęcia + wideo) zarządzanym przez klienta
w panelu CMS (Sveltia).

Stack: Astro 6 (static) · Tailwind 4 · GSAP + Lenis · Cloudflare Pages/R2 ·
Sveltia CMS · Playwright/Vitest/LHCI.

Dokumentacja projektu: `docs/README.md` (indeks). Źródła prawdy:

- `docs/delung-web-entrance-analysis.md` — analiza wejściowa i decyzje,
- `docs/delung-web-creation-process.md` — instrukcja wykonawcza (Etapy 0–7),
- `docs/design/` — eksporty designów (referencje HTML).

## Komendy

| Komenda             | Działanie                              |
| :------------------ | :------------------------------------- |
| `pnpm install`      | Instalacja zależności                  |
| `pnpm dev`          | Serwer deweloperski (`localhost:4321`) |
| `pnpm build`        | Build produkcyjny do `./dist/`         |
| `pnpm preview`      | Podgląd builda (port 4399 dla testów)  |
| `pnpm test`         | Pełna piramida: unit + e2e + visual    |
| `pnpm typecheck`    | `astro check`                          |
| `pnpm lint`         | ESLint                                 |
| `pnpm format:check` | Prettier (sprawdzenie)                 |

Zasady pracy w repo: `CLAUDE.md` + `.claude/rules/`.
