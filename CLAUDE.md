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
- **Etap 4.3 (/oferta/ + /kategorie/) — WYKONANY** (2026-07-31, PR #10;
  decyzje i KOREKTY po testach Mateusza: `docs/analiza-oferta-kategorie.md`
  — czytać PRZED pracą przy tych widokach): treści oferty w
  `sections/oferta/oferta-content.ts` kluczowane slugami `categories.ts`
  (6 kategorii; `inne` celowo BEZ treści — żyje tylko w CMS/filtrach;
  unit test kontraktu), obrazy osobno w `oferta-images.ts` (nowe assety
  `src/assets/oferta/cat-*.webp` 1600 px z pełnych kwadratowych źródeł);
  stała `OFERTA_DESKTOP_MIN_PX=1024` w `oferta-config.ts`. Desktop:
  wzorzec ARIA tabs (strzałki, panel 01 w SSR), animacje przełączenia =
  keyframes CSS pod klasą `.anim` (bez GSAP; pierwszy render statyczny);
  wariant niskiego ekranu ≤820px PRZEBUDOWANY względem eksportu (nie
  mieścił się): CTA obok zdjęcia (dół CTA = dół zdjęcia; celowy duplikat
  karty `--side`/`--wide` w DOM), spece pełną szerokością pod spodem,
  wiersz zdjęcia ugina się (`1fr auto`) do min. 180 px; karta CTA
  `fit-content` + nowrap (dłuższa etykieta rozpycha w prawo). Mobile:
  karuzela 3 kafli (gotchas: `data-lenis-prevent-horizontal` +
  `scroll-snap-stop: always`) + pasek postępu; kafel kategorii →
  **deep-link `/kategorie/#<slug>`** (otwiera tam kartę; korekta po
  testach), „zobacz pełną ofertę" → goła lista. `/kategorie/`: lista
  6 kafli-przycisków + karta kategorii = 6 PRE-RENDEROWANYCH bottom
  sheetów na `overlay.ts` (`#kat-<slug>`; Esc/X/scrim/swipe-down;
  ≥1024 przy otwartej zamyka); redirect desktopowy i canonical z Etapu 0
  NIETKNIĘTE. Marquee logotypów = własny markup w `OfertaLogos` (reuse
  plików logo; HomeTrust nietknięty), tła `pr`/`kt-cta` = reuse
  `ko-bg.webp`. CTA realizacji: etykieta z `categoryLabel()`, href goły
  `/realizacje/` — deep-link FILTRA = decyzja 4.4 (D-OK6). Nowe specy:
  e2e `oferta`/`kategorie` (zakładki, karuzela, jawny redirect, sheety
  z gestami, deep-link), visual `oferta` (6 profili + panel-05 na
  chromium-1920) i `kategorie` (tylko profile mobile). Kickery/drobny
  druk pod ratchet axe: `--accent-ink`/`--faint`.
- **Etap 4.4 (/realizacje/) — WYKONANY** (2026-08-01, PR #11; decyzje
  i KOREKTY po testach Mateusza: `docs/analiza-realizacje.md` — czytać
  PRZED pracą przy tym widoku): szyna filtrów = „Wszystkie" + TYLKO
  kategorie z wpisami (`workRail()` w `work-data.ts` + unit test; bez
  re-empty/paginacji/atrapy sortowania z makiety), **deep-link filtra
  `/realizacje/#<slug>`** (domknięcie D-OK6; podpięte karty CTA paneli
  /oferta/ i `dt-more` kart /kategorie/; zły/pusty slug → „Wszystkie");
  detal = **JEDEN overlay `#work-detail`** (`WorkDetailOverlay.astro`;
  modal↔sheet czystym CSS przy `WORK_DESKTOP_MIN_PX=1024` w
  `work-config.ts` — `sheetMQ`/760 usunięte, `ui/Modal`+`ui/BottomSheet` +`CloseIcon` SKASOWANE, strona główna współdzieli overlay; X na
  sheecie jak karty kategorii; galeria wędruje placeGal-em przy
  klonowaniu, zmiana progu zamyka; desktopowy tor galerii BEZ
  overflow:hidden z makiety — clipował translateX); projnav =
  **przejazd modala za krawędź ekranu** (bez crossfade; guard na czas
  zjazdu); **podgląd pełnoekranowy** `[data-lightbox]` (tap/klik w kadr;
  klony kadrów w formacie 330/412 na czarnym tle; mobile: swipe-snap +
  chevron + swipe-down [`touch-action: pan-x` na torze], licznik na
  czarnym pasie; desktop: strzałki/dashes/X, Esc capture'em zamyka
  TYLKO podgląd; wyjście wraca na oglądany kadr; nosi
  `data-overlay-panel` — klik ≠ „klik w tło"; fokus na kontener, nie
  chevron — iOS rysował pierścień); **wideo BEZ `controls` i bez
  własnego play**: ikonka kamery `[data-cam]`, tap w kadr startuje film
  i otwiera podgląd z grającym klipem, w podglądzie tap = pauza↔play
  (reguła w sections.md zaktualizowana); `legacy-dark.css` usunięty
  z widoku, Lenis włączony (jak /oferta/), sticky szyna/head pod
  `--hdr-h` (fix top:0 makiety), `re-phone` przez antyscraping D-CH5.
  Nowe specy: e2e filtry/deep-link/detal/podgląd/wideo-funkcjonalnie
  (`play()` bez sieci — `paused===false`), visual top/grid/cta/detal/
  podgląd/wideo pod maską (stary baseline stopki skasowany).
- **Etap 4.5 (/proces-wspolpracy/ + /o-nas/ + /polityka-prywatnosci/) —
  WYKONANY** (2026-08-01, PR #12 proces, #13 o-nas, #14 polityka; decyzje:
  `docs/analiza-proces-onas-polityka.md` — czytać PRZED pracą przy tych
  widokach): navbar dostał modyfikator `tone="dark"` wariantu `over`
  (KOREKTA 4.1 — klasa `dark` ma realny CSS w `proces.html`; używają go
  `ProcesPage`/`OnasPage`, `/realizacje/` i reszta zostają na `plain`);
  treść przenoszona w eksportach JS-em (`relocate()`, klonowanie zdjęć
  kroków) renderowana jako **duplikaty per-breakpoint w SSR** (wzorzec
  karty CTA z 4.3); dane 6 opinii wyciągnięte do `src/lib/opinie.ts`
  (współdzielone przez `HomeOpinie` i sekcję opinii o-nas — markup osobny,
  baseline'y home nietknięte); ruch w `proces-motion.ts`/`onas-motion.ts`
  za motion-gate, bez GSAP; **`SkeletonPage.astro` SKASOWANY** (stracił
  ostatniego konsumenta). Polityka: pełny port na markup `pp-*` designu
  (cream `pp-head`, desktopowy sticky TOC `#pp-NN` pod `--hdr-h`,
  `pp-cta`), treść 9 sekcji RODO i klasa `.pp-sec` BEZ zmian, import
  `legacy-dark.css` usunięty, antyscraping przeszedł na wspólne sloty
  `contact-details.ts` (+ wariant href-only `data-tel="href"`); visual
  polityki celowo na 2 profilach (dokument niezależny od profilu).
- **Domknięcie Etapu 4 — WYKONANE** (2026-08-01, PR #15): budżety LHCI
  zacieśnione do baseline'u PEŁNEJ strony (5 pomiarów z main, mediana
  z 3 przebiegów — liczby i uzasadnienia w komentarzach `lighthouserc*.cjs`;
  osobny commit, decyzja Mateusza): mobile perf 0,75→0,85, LCP 6000→4500,
  script 100k→80k, total 2 MB→1,2 MB; desktop LCP 2000→1800, CLS
  0,02→0,01, script 100k→80k, total 2 MB→1,8 MB, fonty warn 5→6. Osobno
  (jeszcze w PR #14) desktop **TBT 100→200 ms**: próg-podłoga z Etapu 3
  leżał w środku pasma szumu runnera (22–138 ms przy IDENTYCZNYCH bajtach
  — main po #13 był z tego powodu czerwony). Poluzowane celowo zostają
  desktop `perf` 0,9 (min. próbka 0,92 — score ciągnie szumiący TBT) oraz
  mobile TBT 150 / CLS 0,02 (podłogi przy zerze).
- **Etap 5 (formularz + /kontakt/) — W TOKU** (decyzje:
  `docs/analiza-kontakt.md` — czytać PRZED pracą przy tym widoku).
  Kroki w chmurze WYKONANE (2026-08-01): **osobne konto Resend klienta**
  na `kontakt@delung.pl` (darmowy plan = 1 domena, konto Mateusza zajęte
  przez hadrianm; 2FA + Setup Key u Mateusza, przekazanie w Etapie 7),
  domena `send.delung.pl` Verified, widget Turnstile `delung-kontakt`
  (Managed; `delung.pl` + `delung-web.pages.dev`), KV
  `delung-kontakt-quota` + binding `KONTAKT_KV` i sekrety
  `RESEND_API_KEY`/`TURNSTILE_SECRET_KEY` w Production i Preview, reguła
  WAF `kontakt-form-burst` (3 POST-y/10 s na `/api/kontakt`).
  PR A (widok): port `/kontakt/` na design — hero `over` (ton jasny,
  tło = reuse `ko-bg.webp` pod blur), 4 kafle kontaktowe wjeżdżające na
  hero, karta formularza, pigułka social **duplikowana per breakpoint**
  (kolejność tabulacji = wizualna); pola wg designu: imię, **telefon
  (opcjonalny — nowe pole kontraktu)**, e-mail, wiadomość — **chipsy
  tematu wypadły** (serwer dalej toleruje puste `temat`); tel/mail
  w kaflach przez sloty `contact-details.ts` (koniec `[ POKAŻ ]`;
  kafle NIE startują `hidden` — maska trzyma layout); nadawcy Resend
  przeniesieni na `@send.delung.pl`; **toasty usunięte z użycia**
  (potwierdzenie = stan `.sent` karty + `.kt-srv` przy błędzie).
  **DŁUGI SZABLONU SPŁACONE**: `legacy-dark.css`, `Contact.astro`,
  `contact-scroll.ts`, cały ambient (`components/backgrounds/`,
  `capture-ambient-bg.mjs`, tekstury w `public/`, skrypt npm) —
  SKASOWANE; breakpoint kontaktu 861 → **1024**; realny site key
  Turnstile w `contact-config.ts`.
  Poprawka po merge'u (PR #17): `settleImages()` w `tests/helpers/visual.ts`
  — sekcje ładują zdjęcia `lazy`+`decoding="async"`, więc zszywany zrzut
  elementu wyższego niż ekran ścigał się z dekodowaniem (diff WYŁĄCZNIE na
  krawędziach zdjęć, tekst identyczny — tak migotał `o-nas: zespół` na
  webkit-iphone-14 w CI przy zielonym przebiegu lokalnym; sonda: 13 obrazów
  niewczytanych w chwili zrzutu). Przy okazji 5 baseline'ów utrwalających
  brakujące zdjęcia (marquee logotypów bez Festoola i w dwóch rzędach,
  pusty kafel „Meble nietypowe") zregenerowanych.
  PR B (porządki): kasacja `ui/toast/**` + `<Toast />` z `BaseLayout`,
  martwych `ui/{AnimatedCta,SplitCta,OfertaButtons,SolidButton}`,
  `scripts/{section-helpers,bg-crossfade,anchors}.ts` oraz **WYJŚCIE
  GSAP-a Z PROJEKTU** (Lenis na własnym `requestAnimationFrame`).
  Zmierzone na `/`: skrypty **67 978 B → 19 053 B**, total 892 752 B →
  842 768 B. Budżety LHCI zostają NIETKNIĘTE (script 80 000 B) — ich
  zacieśnienie do nowego baseline'u to osobna decyzja Mateusza i osobny
  commit (kandydat: Etap 6).
- Etapy 6–7 — przed nami (SEO/pomiar → przekazanie).

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
- `src/components/sections/oferta/` — widoki /oferta/ i /kategorie/ (4.3):
  `oferta-content.ts` (treści kluczowane slugami categories.ts; `inne`
  bez treści) + `oferta-images.ts` + `oferta-config.ts`
  (OFERTA_DESKTOP_MIN_PX=1024, importują testy) + sekcje `Oferta*`/
  `KategorieSection` + skrypty `oferta.ts`/`kategorie.ts` (funkcjonalne,
  zawsze) i `oferta-motion.ts` (motion-gate, wspólny obu stron);
  deep-link `/kategorie/#<slug>` otwiera kartę kategorii.
- `src/components/sections/work/` — Realizacje (4.4): dane z Content
  Collections (`src/content/realizacje/*.json`; schema Zod:
  `src/content.schema.ts` — źródło prawdy, `content.config.ts` tylko ją
  importuje) + `work-config.ts` (WORK_DESKTOP_MIN_PX=1024, importują
  testy) + `work-data.ts` (`viewProject`/`workRail`). Detal = JEDEN
  overlay `#work-detail` (`WorkDetailOverlay.astro` + `open-detail.ts`
  na `overlay.ts`: klon z `<template>`, galeria, podgląd pełnoekranowy,
  projnav, wideo tap-toggle); ruch w `work-motion.ts` (motion-gate).
- `src/components/sections/proces/` — /proces-wspolpracy/ (4.5): sekcje
  `Proces*.astro` + `proces-config.ts` (PROCES_DESKTOP_MIN_PX=1024,
  importują testy) + `proces-motion.ts`; strona przez `ProcesPage.astro`
  (navbar `over` + `tone="dark"`). Sekcja `efekt` istnieje TYLKO na
  desktopie.
- `src/components/sections/o-nas/` — /o-nas/ (4.5): sekcje `Onas*.astro` +
  `onas-config.ts` (ONAS_DESKTOP_MIN_PX=1024) + `onas-motion.ts`; strona
  przez `OnasPage.astro` (navbar `over` + `tone="dark"`). Dane opinii
  z `src/lib/opinie.ts` — WSPÓŁDZIELONE z `HomeOpinie` (markup osobny,
  tylko dane); manifest i tor zespołu to sceny przypięte desktop-only.
- `src/components/PolicyPage.astro` — /polityka-prywatnosci/ (4.5): markup
  `pp-*` designu, treść 9 sekcji RODO inline (dokument prawny), klasa
  `.pp-sec` = kontrakt `policy.spec.ts`; jasny motyw (bez legacy-dark).
- `src/components/sections/contact/` — /kontakt/ (Etap 5): sekcje
  `ContactHero/ContactCards/ContactForm/ContactSoc.astro` +
  `contact-config.ts` (CONTACT_DESKTOP_MIN_PX=1024 i site key Turnstile;
  importują testy) + `contact-ui.ts` (formularz — ładowany ZAWSZE) +
  `contact-motion.ts` (ruch za bramką). Backend: Pages Function
  `functions/api/kontakt.ts` + `src/lib/contact-form.ts` (Resend
  z `send.delung.pl` + Turnstile + antyspam + KV quota). Strona przez
  `ContactPage.astro` (navbar `over`, scroll NATYWNY — D-K9).
- `src/scripts/` — TRZY moduły (reszta skasowana w Etapie 5):
  `overlay.ts` (generyczne nakładki modal/sheet — focus-trap, Esc,
  swipe-down), `smooth-scroll.ts` (Lenis TYLKO desktop na własnej pętli
  rAF; dotyk = scroll natywny — decyzja 4.2, `.claude/rules/scroll-lenis.md`),
  `back-link.ts` (delegacja `a[data-back]` z `BaseLayout` — uśpiona, D-CH8).
- `src/components/ui/` — po czystce Etapu 5 zostały `LoadingOverlay.astro`
  (bramka mikro-fade w `BaseLayout`) i `BackButton.astro` (nieużywany,
  świadomie zachowany — D-CH8). Toast, AnimatedCta, SplitCta,
  OfertaButtons i SolidButton skasowane.
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
