# delung-web — CLAUDE.md

Strona firmowa klienta **Delung Meble** (meble na wymiar) — `delung.pl`.
Astro 6 **static** (bez SSR), **PL-only** (bez `/en/`). Hosting: Cloudflare
Pages, deploy automatyczny z gałęzi `main` → **main = produkcja** (od
Etapu 1). Main jest chroniony (required checks: `quality`, `e2e`,
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
  `main-protection` AKTYWNY (PR + required check `quality`). CI na main:
  `quality` zielone; `e2e`/`lighthouse` czerwone ZGODNIE Z PLANEM
  (adaptacja speców i budżetów = Etap 3).
- **Etap 2 (CMS + media + logowanie klienta) — WYKONANY** (2026-07-30):
  R2 `delung-media` (jurysdykcja EU) + custom domain `media.delung.pl`
  - Image Transformations + CORS (delung.pl, localhost:4321) + token
    `delung-media-sveltia` (Object R&W, tylko ten bucket); konto GitHub
    `delung-cms` (collaborator write, mail `kontakt@delung.pl`) z
    User-bypassem Always w rulesecie (dodany przez API — UI repo osobistego
    nie wyszukuje userów); OAuth App „Panel treści — delung.pl" + Worker
    `sveltia-cms-auth-delung` (`auth.delung.pl`, ALLOWED_DOMAINS
    delung.pl,localhost); `site_domain` w config.yml (bez tego localhost
    wysyła site_id=cms.netlify.com); SPIKE wideo = **PLAN A potwierdzony**
    (widget `file` wgrywa MP4 do R2; range requests OK); docelowy schemat
    kolekcji w trzech miejscach + test kontraktu selecta kategorii;
    5 testowych wpisów (dane z designu, media-placeholdery w R2).
- **Etap 3 (testy/CI na szkielecie) — WYKONANY** (2026-07-31, PR #3):
  specy e2e zaadaptowane do tras delung (PL-only; testy sekcji strony
  głównej = `test.skip` do odskipowania w Etapie 4); allowlista axe PUSTA
  (ratchet od zera) — kontrasty naprawione w tokenach (`--faint` 0.64,
  `--accent-ink` dla kickerów); FIX produkcji: `html:root`
  w `legacy-dark.css` (inlinowany override przegrywał kolejnością
  z tokenami global.css → ciemny tekst na czarnym tle); telefon w polityce
  składany w JS (antyscraping); sitemapa bez `/kategorie/` (canonical →
  `/oferta/`); pierwsze baseline'y wizualne (36 linux + 36 darwin, święta
  kolejność); budżety LHCI od baseline'u szkieletu Z ZAPASEM na sekcje
  (run 30622374361: mobile perf 0.99 / LCP 1965 ms, desktop 1.0 / 492 ms,
  script 59,6 KB) — ratchet AKTYWNY; required checks `quality`+`e2e`+
  `lighthouse` w rulesecie. Od teraz pełny daily workflow.
- **Etap 4.1 (chrome globalny) — WYKONANY** (2026-07-31, PR #6; decyzje:
  `docs/analiza-chrome-globalny.md`): navbar sticky wg designów (warianty
  `plain`/`over` — `over` czeka na hero 4.2; BEZ hide-on-scroll; stała
  `NAV_DESKTOP_MIN_PX=1024` w `navbar/nav-config.ts` + `@media` w parze;
  `--hdr-h` na `<html>`), menu mobile = bottom sheet na `overlay.ts`
  (swipe-down/Esc/scrim; markup w Navbarze), stopka `ft` (IG także na
  desktopie, polityka też na mobile, kontrasty AA), nawigacja = 4 pozycje
  wg designu („Proces współpracy" TYLKO w stopce do czasu CTA 4.2/4.3);
  BackButton POZA chrome (decyzja Mateusza — brak w designach; mechanizm
  `data-back`/`back-link.ts` uśpiony w BaseLayout, `ui/BackButton.astro`
  nieużywany); tel/mail chrome'u składane w JS (`lib/contact-details.ts`),
  kontrakt antyscrapingowy w `contact.spec.ts` przeszedł na SUROWY HTML
  (`page.request.get`) — DOM po JS celowo zawiera numer; tokeny
  `--pad`/`--col` w global.css; `color-scheme: only light` (fix
  wymuszanego ciemnienia na Androidzie; legacy-dark nadpisuje na `dark`).
- **Etap 4.2 (strona główna) — WYKONANY** (2026-07-31, PR #8 + fix
  strażnika prod-smoke PR #9; decyzje i KOREKTY po testach na fizycznych
  telefonach: `docs/analiza-strona-glowna.md` — czytać PRZED pracą przy
  stronie głównej): sekcje `src/components/sections/home/*` (hero
  mobile/desktop z typografią SVG, trust+logos, zajawki oferta/proces/
  realizacje/o-nas, opinie, banner `#contact`); sceny przypięte i cały
  ruch BEZ GSAP (`home-scroll.ts`, bramka `html.js-motion` inline przed
  paintem; bez JS/reduce strona w pełni statyczna); zajawka realizacji →
  Modal/BottomSheet przez współdzielony `open-detail` (próg 760
  świadomie do wyrównania w 4.4); tel/mail bannera wg D-CH5 (wariant
  `[data-slot]` w `fillContactSlots`); **Lenis TYLKO desktop — dotyk
  natywny** (decyzja po klatkowaniu; reguły scroll-lenis.md); hero
  mobile: `100svh` + parallax ze stałej wysokości (sonda svh — pasek URL
  nie szarpie), kadr SKALIBROWANY parametrami `--hero-zoom/x/up`
  w `HomeHero.astro` (zmiana = przelicz krop na pełnym źródle, komenda
  w komentarzu), `<picture>`+preload z wariantem gęstości (mobile
  pobiera tylko swój plik, desktop tylko kadry); jedyny h1 = sr-only nad
  wariantami hero (smoke/strict mode); gwiazdki jako SVG i kontrasty pod
  pustą allowlistę axe; szablonowe `Work*`/`KontaktBaner*` usunięte.
  Progi LHCI mobile podniesione (osobny commit, decyzja Mateusza): LCP
  3500→6000, perf 0.9→0.75, fonty warn 6 — zmierzone CI po
  optymalizacjach: **LCP 3695 ms / perf 0.89** → zacieśnić przy
  domknięciu 4.5. Nowy spec `tests/visual/index.spec.ts` (zrzuty sekcji
  na 6 profilach + sweep scen na chromium-1920; mikro-scroll przed
  zrzutem = wymuszenie re-rasteryzacji sticky paska w WebKit).
- Etapy 4.3–7 — przed nami (widoki → formularz → SEO/pomiar → przekazanie).
- PRZEJŚCIOWE dziedzictwo szablonu (do wymiany w Etapach 4–5): widoki
  `/realizacje/` `/kontakt/` `/polityka-prywatnosci/` na ciemnym motywie
  (`src/styles/legacy-dark.css` — strona delung jest JASNA; kafle/detal
  realizacji = tymczasowe kafle zdjęciowe), breakpointy 760/861
  w odziedziczonych komponentach (docelowo wszędzie **1024 px**),
  placeholder `TODO_*` w `contact-config.ts` (Turnstile, Etap 5).

## Mapa projektu

- `src/pages/` — 8 tras PL (`routes.ts` = źródło prawdy): `/`, `/oferta/`,
  `/kategorie/` (mobile-only + redirect desktop→/oferta/ przed paintem),
  `/realizacje/`, `/proces-wspolpracy/`, `/o-nas/`, `/kontakt/`,
  `/polityka-prywatnosci/`. Szkielety z Etapu 0 → docelowe widoki wg
  `docs/design/*.html` powstają w Etapie 4 (po jednym PR na widok).
- `src/lib/categories.ts` — 7 kategorii oferty (decyzja D2) — JEDNO źródło
  prawdy dla /oferta/, /kategorie/, filtrów realizacji i selecta w CMS.
- `src/components/sections/home/` — sekcje strony głównej (4.2):
  `Home*.astro` + `home-config.ts` (HOME_DESKTOP_MIN_PX=1024, importują
  testy) + `home-scroll.ts` (ruch bez GSAP, motion-gate `js-motion`).
- `src/components/sections/work/` — Realizacje: dane z Content Collections
  (`src/content/realizacje/*.json`; schema Zod: `src/content.schema.ts` —
  źródło prawdy, `content.config.ts` tylko ją importuje). Detal =
  Modal/BottomSheet na `overlay.ts`.
- `src/components/sections/contact/` — formularz kontaktowy (Pages Function
  `functions/api/kontakt.ts`, Resend + Turnstile + antyspam + KV quota);
  widok docelowy wg `docs/design/kontakt.html` w Etapie 5.
- `src/scripts/` — `overlay.ts` (Modal/BottomSheet — focus-trap, Esc,
  swipe-down), `smooth-scroll.ts` (Lenis TYLKO desktop; dotyk = scroll
  natywny — decyzja 4.2, reguły), `section-helpers.ts`, `anchors.ts`,
  `back-link.ts`, `bg-crossfade.ts`.
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
