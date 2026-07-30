# delung-web — CLAUDE.md

Strona firmowa klienta **Delung Meble** (meble na wymiar) — `delung.pl`.
Astro 6 **static** (bez SSR), **PL-only** (bez `/en/`). Hosting: Cloudflare
Pages, deploy automatyczny z gałęzi `main` → **main = produkcja** (od
Etapu 1). Main będzie chroniony (required checks: `quality`, `e2e`,
`lighthouse` — komplet od Etapu 3) — zmiany idą przez feature branch → PR
→ zielone checki → merge; bez pracy wprost na main.

Projekt budowany wg instrukcji wykonawczej
`docs/delung-web-creation-process.md` (Etapy 0–7; decyzje:
`docs/delung-web-entrance-analysis.md` — NIE otwieraj ich na nowo).
Kod startowy = kopia szablonu hadrianm-web (infrastruktura zostaje,
treść/sekcje budowane od nowa wg `docs/design/`).

## Zasady twarde

1. **NIGDY nie wykonuj `git commit` ani `git push`** — commituje wyłącznie
   Mateusz. Twoja rola: zostawić zmiany w working tree i ZAPROPONOWAĆ
   treść commita (conventional commits ze scope, po angielsku, np.
   `feat(oferta): …`, `fix(work): …`, `docs(cms): …`). Blokada jest też
   egzekwowana w `.claude/settings.json`.
2. **Nie edytuj `src/content/realizacje/*.json`** — te pliki pisze Sveltia
   CMS (własny formater, commituje przez GitHub API). Zmiany treści robi
   się w panelu `/admin`. Wyjątek wymaga wyraźnej zgody Mateusza.
3. **Nie dotykaj `dist/` i `.astro/`** — generowane.
4. Sekrety (`.env*`, tokeny Cloudflare/GitHub, klucze R2/Resend/Turnstile)
   — nie czytaj, nie loguj.
5. **Nie aktualizuj baseline'ów wizualnych** (`tests/visual/__screenshots__/`)
   bez pokazania diffu i zgody Mateusza (blokada też w settings.json).
   Aktualizacja wyłącznie przez `pnpm test:visual:update` po akceptacji;
   komplet linuksowy → workflow `update-visual-baselines.yml`.
6. Schemat CMS zmieniaj zawsze w **TRZECH miejscach naraz**
   (`content.schema.ts` / `public/admin/config.yml` / komponenty work) —
   reguła `.claude/rules/cms-realizacje.md`.

## Komendy

- `pnpm dev` — dev server (port 4321)
- `pnpm build` / `pnpm preview`
- `pnpm typecheck` — `astro check` (obejmuje też testy)
- `pnpm lint` / `pnpm lint:fix` / `pnpm format` / `pnpm format:check`
- Testy (kontrakt: `.claude/rules/testing.md`): `pnpm test` (wszystko);
  `pnpm test:unit` (Vitest, sekundy); `pnpm test:e2e` (Playwright:
  funkcjonalne+a11y+SEO); `pnpm test:visual` (screenshoty vs baseline;
  wymaga `pnpm build`; webServer sam wstaje na 4399);
  `pnpm test:visual:update` (nowe baseline'y — TYLKO za zgodą Mateusza);
  `pnpm test:smoke:prod` (smoke przeciw produkcji delung.pl)
- `node scripts/optimize-images.mjs <src> <out.webp> [szer] [q]` —
  PNG z eksportów designów → WebP do `src/assets/`
- CI (GitHub Actions) na push/PR — 3 joby (required checks na main):
  `quality` (format:check → lint → typecheck → test:unit → build),
  `e2e` (test:e2e + test:visual na artefakcie dist), `lighthouse`
  (budżety ratchet, lighthouserc\*). Po merge'u do main dodatkowo
  `prod-smoke.yml` (czeka na deploy Cloudflare, potem test:smoke:prod).
  Lokalnie husky: pre-commit lint-staged, commit-msg commitlint.

## Stan projektu (aktualizuj po każdym etapie!)

- **Etap 0 (bootstrap) — WYKONANY**: kopia szablonu, wycięte hero/EN/sekcje
  hadrianm, parametryzacja, tokeny+fonty delung, 8 tras-szkieletów,
  `categories.ts`.
- **Etap 1 („pusta" produkcja) — WYKONANY** (2026-07-30): repo GitHub
  `mateuszhadrian/delung-web` (**PUBLICZNE** — świadoma decyzja: ruleset
  egzekwowany za darmo, jak hadrianm-web; zero sekretów/wrażliwych
  danych w repo), Cloudflare Pages (`delung-web`, NODE_VERSION=22),
  domena `delung.pl` + `www` (NS na Cloudflare, DNSSEC zdjęty przed
  delegacją), skrzynka Zimbra `kontakt@delung.pl` + alias `adam@`
  (MX/SPF/DKIM/DMARC/SRV w Cloudflare — komplet PASS), ruleset
  `main-protection` AKTYWNY (PR + required check `quality`; bypass dla
  konta CMS dojdzie w Etapie 2). CI na main: `quality` zielone;
  `e2e`/`lighthouse` czerwone ZGODNIE Z PLANEM (adaptacja speców
  i budżetów = Etap 3).
- Etapy 2–7 — przed nami (CMS+R2 → testy/CI → widoki → formularz →
  SEO/pomiar → przekazanie).
- PRZEJŚCIOWE dziedzictwo szablonu (do wymiany w Etapach 2–5): schemat
  kolekcji realizacje (screens/results/quote → docelowo cover/gallery
  z wideo/specs), widoki `/realizacje/` `/kontakt/` `/polityka-prywatnosci/`
  na ciemnym motywie (`src/styles/legacy-dark.css` — strona delung jest
  JASNA), breakpointy 760/861 w odziedziczonych komponentach (docelowo
  wszędzie **1024 px**), placeholdery `TODO_*` w `public/admin/config.yml`
  (R2, Etap 2) i `contact-config.ts` (Turnstile, Etap 5).

## Mapa projektu

- `src/pages/` — 8 tras PL (`routes.ts` = źródło prawdy): `/`, `/oferta/`,
  `/kategorie/` (mobile-only + redirect desktop→/oferta/ przed paintem),
  `/realizacje/`, `/proces-wspolpracy/`, `/o-nas/`, `/kontakt/`,
  `/polityka-prywatnosci/`. Szkielety z Etapu 0 → docelowe widoki wg
  `docs/design/*.html` powstają w Etapie 4 (po jednym PR na widok).
- `src/lib/categories.ts` — 7 kategorii oferty (decyzja D2) — JEDNO źródło
  prawdy dla /oferta/, /kategorie/, filtrów realizacji i selecta w CMS.
- `src/components/sections/work/` — Realizacje: dane z Content Collections
  (`src/content/realizacje/*.json`; schema Zod: `src/content.schema.ts` —
  źródło prawdy, `content.config.ts` tylko ją importuje). Detal =
  Modal/BottomSheet na `overlay.ts`.
- `src/components/sections/contact/` — formularz kontaktowy (Pages Function
  `functions/api/kontakt.ts`, Resend + Turnstile + antyspam + KV quota);
  widok docelowy wg `docs/design/kontakt.html` w Etapie 5.
- `src/scripts/` — `overlay.ts` (Modal/BottomSheet — focus-trap, Esc,
  swipe-down), `smooth-scroll.ts` (Lenis; stałe desktop/touch rozdzielone
  CELOWO — reguły), `section-helpers.ts`, `anchors.ts`, `back-link.ts`,
  `bg-crossfade.ts`.
- `src/lib/img.ts` — `imgAt()`: JEDYNE miejsce wiedzy o rozmiarach obrazów
  (Cloudflare Image Transformations na `media.delung.pl`; w dev pokazuje
  oryginały). Wideo BEZ transformacji — wprost z R2.
- `src/i18n/` — słownik PL-only (`ui.ts`) + pozycje nawigacji (`nav.ts`);
  mechanizm `useTranslations` uśpiony na jednym języku.
- `src/styles/global.css` — design tokens w `:root` (paleta z designów:
  jasny motyw, zieleń `--accent #2f8f5b`; fonty: Archivo Variable =
  display — rola Helvetiki z designów, Manrope = body, Cormorant
  Garamond = serif). Breakpoint projektu: **1024 px**.
- `tests/` — `unit/` (Vitest: kontrakt CMS, img, contact-form), `e2e/`
  (Playwright: nawigacja, work, contact, policy, a11y, SEO, smoke
  `@prod-smoke`), `visual/` (screenshoty vs baseline'y per-platform —
  puste do Etapu 3/4), `helpers/` (assertPreview, scroll, freeze.css).
- `public/admin/` — panel Sveltia CMS (config.yml = definicja pól panelu).
- `docs/` — dokumentacja projektu; **statusy plików w `docs/README.md`**.
  `docs/design/` = eksporty designów (referencje 1:1; `assets/` POZA repo
  — .gitignore). Prettier i ESLint ignorują `docs/`.

## Konwencje pracy

- **Docs-first**: każdy widok Etapu 4 poprzedza mini-analiza w `docs/`
  (po polsku, wzorzec `analiza-*.md` z szablonu): decyzje portu z
  referencji → implementacja → testy → baseline'y → PR.
- Media realizacji żyją w R2 (`https://media.delung.pl`), NIE w repo.
  Upload wyłącznie przez pola Image w panelu Sveltia (wideo: wg wyniku
  spike'a Etapu 2). Obrazy statyczne sekcji: `scripts/optimize-images.mjs`
  → WebP w `src/assets/`.
- Weryfikacja wizualna: `pnpm build && pnpm test:visual` — WYMAGA preview,
  nie dev (strażnik `assertPreview`; port 4399). Emulacja NIE wykrywa:
  limitu warstwy GPU Androida, Low Power Mode, zwijanego toolbara iOS,
  zimnego cache — tam poproś Mateusza o test na fizycznym urządzeniu
  i wskaż, na co patrzeć.
- Podział ról: kroki „w kodzie" wykonujesz Ty; kroki „w chmurze" (panele
  GitHub / Cloudflare / OVH / Resend) klika Mateusz — Ty podajesz dokładne
  instrukcje z części B instrukcji.

## Kluczowe dokumenty (czytaj przed pracą w danym obszarze)

- **Najpierw indeks statusów: `docs/README.md`.**
- Decyzje projektu (zapadłe — nie otwieraj na nowo):
  `docs/delung-web-entrance-analysis.md` (D1–D8 + tabela §2).
- Instrukcja wykonawcza etapów: `docs/delung-web-creation-process.md`
  (Część A: checklista; B: kroki; C: flow mediów klienta; D: backupy).
- Designy-referencje: `docs/design/README.md` + 8 plików HTML
  (breakpoint 1024 px, wzorce 390/1440).
