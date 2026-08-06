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
- `node scripts/make-icons.mjs` — komplet ikon marki + og-image z wektora
  `public/favicon.svg` (Etap 6; nie podmieniaj tych plików ręcznie)
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
  `[data-slot]` w `fillContactSlots`); Lenis wtedy TYLKO desktop — dziś
  scroll natywny wszędzie (D-Q1, `.claude/rules/scroll.md`); hero
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
  karuzela 3 kafli (gotcha: `scroll-snap-stop: always`) + pasek postępu; kafel kategorii →
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
  z widoku, sticky szyna/head pod
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
- **Etap 5 (formularz + /kontakt/) — WYKONANY** (2026-08-02; PR #16 widok
  i formularz, #17 determinizm zdjęć w testach wizualnych, #18 porządki
  i wyjście GSAP-a; decyzje: `docs/analiza-kontakt.md` — czytać PRZED
  pracą przy tym widoku). **Dziedzictwo szablonu = SPŁACONE W CAŁOŚCI**:
  w projekcie nie ma już ciemnego motywu, ambientu, toastów, GSAP-a ani
  progów 861/760 — każdy widok stoi na designie delung.
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
  GSAP-a Z PROJEKTU** (Lenis przeszedł wtedy na własny
  `requestAnimationFrame`; sam Lenis wyszedł w rundzie poprawek 2 — D-Q1).
  Zmierzone na `/`: skrypty **67 978 B → 19 053 B**, total 892 752 B →
  842 768 B. Budżety LHCI zostają NIETKNIĘTE (script 80 000 B) — ich
  zacieśnienie do nowego baseline'u to osobna decyzja Mateusza i osobny
  commit (kandydat: Etap 6).
- **Runda poprawek wizualnych (przed Etapem 6) — WYKONANA** (2026-08-02,
  PR #20 kafle kategorii, PR #21 CTA i link opinii, PR #22 CTA zajawki
  oferty per breakpoint (mobile → `/kategorie/`); decyzje D-P1–D-P7:
  `docs/analiza-poprawki-wizualne.md` — czytać RAZEM z analizami widoków,
  bo koryguje D-SG4, D-SG5 i D-OK3). PR A: kanoniczny deep-link kategorii
  `/oferta/#<slug>` (desktop zaznacza zakładkę BEZ animacji przełączenia,
  mobile otwiera kartę), karty kategorii wyjechały do współdzielonego
  `KategorieSheets.astro` (renderują go `/kategorie/`, `/` i `/oferta/`
  obok `<Footer />`; `kategorie.ts` → `kat-sheets.ts` obsługuje wszystkie
  trzy) — **tap w kafel kategorii na mobile NIE nawiguje, otwiera kartę
  w miejscu**; `href` zostaje fallbackiem bez JS; dane kafli zajawki
  w `home-oferta-content.ts` pod unit testem kontraktu (slug musi mieć
  zakładkę i kartę). Zmierzone: `/` +3,5 kB gz, `/oferta/` +2,1 kB gz,
  bundle JS −416 B, zero nowych baseline'ów. PR B: hover czterech BIAŁYCH
  pigułek leżących na zdjęciach przestał być półprzezroczysty (`#f2f2f2`
  zamiast `rgba()`/`opacity` — szklane `hero-btn`/`cta-ghost` z designu
  zostają), desktopowe CTA procesu na stronie głównej (korekta D-SG5;
  navbar bez zmian — D-CH4), `OPINIE_GOOGLE_URL` → panel opinii firmy
  w Google. Baseline'y PR B: 8 plików (`index-proces` × 3 profile desktop
  - `index-opinie` × chromium-1366 — ten ostatni to przesunięcie o 1 px
    z wyższej strony, treść identyczna; diff zaakceptowany).
- **Etap 6 (SEO, pomiar, polish) — WYKONANY** (2026-08-03, PR #23 ikony,
  #24 JSON-LD, #25 kolejność w `<head>`, #26 polityka, #27 `@graph`,
  #28 budżety LHCI; decyzje D-E1–D-E12: `docs/analiza-etap-6.md` — czytać
  PRZED pracą przy ikonach, danych strukturalnych i budżetach): komplet
  ikon = SAM ZNACZEK na białym kwadracie (margines 6 %, przy 10 % szczeliny
  gasły w 16 px), `favicon.svg` to prawdziwy wektor (786 B zamiast 43 kB
  WebP w base64), odrys zweryfikowany pixel-diffem wobec oryginału (0,60 %
  przy progu 2 %); komplet powstaje z wektora przez `scripts/make-icons.mjs`
  (ikony BEZ alfy — iOS podkłada czerń); og-image = pełne logo na cream,
  1200×630 (12 kB zamiast 145 kB) + `twitter:card` na `summary_large_image`.
  Dane strukturalne: `src/lib/jsonld.ts` (JEDYNE źródło danych firmy dla
  schema.org, celowo NIE zna telefonu ani maila — D-CH5) + `seo/JsonLd.astro`
  w slocie `head`; `/kontakt/` = `FurnitureStore` (adres, geo, godziny
  PRACOWNI Pn–Pt 07–17/Sb 07–14, NIP, `foundingDate` 2014, `sameAs` IG +
  wizytówka po CID) BEZ `telephone`/`email`, `/` = `@graph` z `WebSite`
  i SAMODZIELNĄ `Organization` (KOREKTA po Rich Results Test: zagnieżdżona
  w `publisher` nie była wykrywana; RRT i tak nie raportuje `Organization`
  na `/` — właściwe narzędzie to `validator.schema.org`). Cloudflare Web
  Analytics = auto-injection (RUM w panelu strefy, nie w projekcie Pages);
  beacon NIE istnieje w lokalnym `dist/`, więc nie liczy się do budżetu
  skryptów — koszt zmierzony na produkcji: +359 B w dokumencie, 11,4 kB
  transferu, LCP bez zmian, ~19 ms na main thread. Polityka prywatności
  (D-E12) dociągnięta do stanu faktycznego — §02 twierdziła „strona nie
  prowadzi analityki"; data obowiązywania → 2 sierpnia 2026. Budżety LHCI
  (osobne commity): `script` 80 000 → **30 000** B i `total` mobile
  1 200 000 → **900 000** B / desktop 1 800 000 → **1 650 000** B, ale
  LCP mobile 4500 → **5000** ms i perf 0,85 → **0,80** — POLUZOWANIE
  wymuszone szumem runnera (3918 vs 4592/4890 ms przy identycznych
  bajtach; rozstrzyga FCP 421 vs 1750 ms). Search Console (property
  domenowa + sitemapa) i UptimeRobot (HTTPS, 5 min) zrobione;
  **wizytówka Google PRZENIESIONA DO ETAPU 7** (poprawki NAP razem
  z klientem przy przekazaniu) — do tego czasu Google widzi niespójny NAP.
- **Runda poprawek nr 2 (po Etapie 6) — WYKONANA** (2026-08-04, PR #29 szyna
  realizacji + link opinii, #30 hero mobile, #31 wyjście Lenisa, #32 scena
  realizacji na niskim ekranie, #33 link „Więcej" w tej scenie; decyzje
  D-Q1–D-Q6: `docs/analiza-poprawki-2.md` — czytać RAZEM z analizami
  widoków, bo koryguje D-P6, D-R7 i ustalenia 4.2 o scrollu):
  **LENIS WYSZEDŁ Z PROJEKTU** (D-Q1) — scroll natywny wszędzie, reguła
  `.claude/rules/scroll.md` (dawne `scroll-lenis.md`), prop `smoothScroll`
  i atrybuty `data-lenis-prevent*` skasowane, −5,3 kB gz. Powód ustalony
  sesją pomiarową na fizycznym Macu (15 wariantów): koszt to duże zdjęcie
  przycinane MASKĄ W KSZTAŁCIE LITER w hero — osobno tanie, razem drogie do
  przemalowania, a Lenis wymuszał przemalowanie w każdej klatce scrolla.
  Hero NIETKNIĘTE (żadna zmiana po jego stronie nie pomagała — wszystkie
  zmierzone). Rekompensata: `--p` navbara wygładzane własną pętlą rAF.
  Hero mobile (D-Q2): wysokość przypinana `--hero-h`, ale **dopiero gdy
  sonda wykryje drgające `100svh` przy stałej szerokości** — czyli tylko
  w przeglądarkach iOS zmieniających rozmiar webview (DuckDuckGo, Firefox,
  Opera, Edge). Lekcja warta zapamiętania: **długość wpisana z JS nigdy nie
  jest bit w bit tym, co przeglądarka wyliczyła sama** — dwie wcześniejsze
  wersje (przypinanie „profilaktyczne") ruszały rasteryzację o ułamek
  piksela i wywracały testy wizualne. Link opinii (D-Q3) → Place ID
  (KOREKTA D-P6: poprzedni wariant działał TYLKO na desktopie; kontrakt
  dekoduje Place ID i porównuje z CID-em z `sameAs`). Szyna filtrów
  `/realizacje/` klei się przez całą listę (D-Q4, KOREKTA D-R7 —
  `display: contents` na mobilnym nagłówku). Scena realizacji na stronie
  głównej (D-Q5): `.re-pin` z rzędu flex → **siatka**, przycisk we własnym
  wierszu, rozpórka odstępu ze sto razy większym `flex-shrink` niż blok
  opisu, treść karty skalowana `cqh` — przycisk nie zasłania treści NIGDY
  (było: od ~730 px wysokości okna, do −214 px przy 520). Link „Więcej"
  w karcie otwiera detal zamiast nawigować i przestał być zasłaniany przez
  nieaktywne karty (D-Q6, `pointer-events`). Budżety LHCI NIETKNIĘTE.
- **Runda poprawek nr 3 (po Etapie 6) — WYKONANA** (2026-08-04, PR #36 hero
  w Firefoksie, #37 powrót na początek listy realizacji, #38 opis i odstęp
  w scenie realizacji, #39 budżety LHCI + domknięcie; decyzje D-T1–D-T4:
  `docs/analiza-poprawki-3.md` — czytać RAZEM z analizami widoków, bo
  koryguje D-Q5): **typografia SVG hero nie renderuje się, dopóki Archivo
  nie jest realnie wczytany** (D-T1) — Gecko po podmianie kroju NIE
  unieważnia rastra napisów, więc biała kopia `<use>` i kopia przycięta
  maską zostawały narysowane różnymi krojami (Firefox 153, pierwsze wejście;
  naprawiało to dopiero odświeżenie albo zmiana rozmiaru okna). Bramka to
  skrypt `is:inline` PRZED markupem hero + reguła chowająca `.hero-d svg`
  (warstwa jest `position:absolute` — zero CLS), zdejmowana po **jawnym
  `document.fonts.load`**; `document.fonts.ready` jest tu sygnałem
  FAŁSZYWYM (przy preloadowanych fontach rozstrzyga się, zanim wystartuje
  pobranie w rozumieniu Font Loading API), a jednorazowe przemalowanie po
  podmianie NIE działa przy żywej animacji `pan` — oba warianty zmierzone.
  Twardy timeout 2500 ms siedzi w tym samym skrypcie (awaria JS/fontu nie
  kasuje napisów). `/realizacje/`: zmiana kategorii **wraca na początek
  listy** (D-T2) — pierwszy kafel 12 px pod przyklejonym chromem (`--hdr-h`
  - szyna poniżej progu desktop), skok TYLKO w górę i NIE przy deep-linku
    `#<slug>` na wejściu. Scena realizacji na `/` (KOREKTA D-Q5): pudełko
    opisu bierze wysokość z najwyższej z trzech kart (dzielą komórkę siatki)
    zamiast zgadywać ją z `20.1vw` — tamta liczba ucinała pół wiersza opisu
    przy 1024–1280 px NIEZALEŻNIE od wysokości okna (D-T3); kontener zapytań
    `cqh` przeniesiony z pudełka na kolumnę `.re-in`, a rozpórka dostała
    własną rampę, bo przeniesienie kontenera zmieniło rampy z reaktywnych na
    proaktywne i odwróciło kolejność kurczenia z D-Q5; `.re-pin` ma `row-gap`,
    czyli odstęp „Więcej" → CTA ma dolną granicę 16 px (było: 0 przy
    1280×560) i przepycha opis do góry (D-T4). Zero nowych baseline'ów
    w całej rundzie. **Budżety LHCI zacieśnione** (osobny commit, decyzja
    Mateusza; liczby z dwóch zielonych przebiegów na main): script 30 000 →
    **20 000** B (zmierzone 13 659 B co do bajta — widać wyjście Lenisa),
    total mobile 900 000 → **860 000** / desktop 1 650 000 → **1 580 000**,
    desktop LCP 1800 → **1700** ms, mobile CLS 0,02 → **0,015**. NIETKNIĘTE
    zostają mobilne LCP 5200, oba `perf`, oba TBT i desktopowy CLS — stoją na
    metrykach z udokumentowanym szumem runnera.
- **Refaktor przed Etapem 7 (zakres A–C) — WYKONANY** (2026-08-04, PR #42
  martwy kod, #43 komentarze, #44 kontrakt progów; decyzje R1–R15 i wyniki:
  `docs/analiza-refactor.md` — czytać PRZED każdym sprzątaniem kodu, bo §2
  wylicza strefy no-go, a §8 i §14 mówią, co ODRZUCONO i dlaczego): kasacja
  martwego kodu bez konsumenta (3 tokeny `global.css`, ~130 linii helperów
  testów opisujących sekcje `about`/`audience` i trasę `/dla-kogo/` z
  szablonu, `getLangFromUrl`/`languages`, zawężenie eksportów); komentarze
  przestały kłamać — **sześć z siedmiu stałych `*_DESKTOP_MIN_PX`
  deklarowało ochronę testami, której nie było**, a `proces-config.ts` nie
  ma ANI JEDNEGO konsumenta (stała jest dekoracją — próg żyje w czterech
  `@media`); duchy po GSAP/ScrollTriggerze/Lenisie/`verify-hero.mjs`
  usunięte, wiedza pomiarowa (7C) nietknięta. `home`/`oferta`/`work` dostały
  **realny kontrakt progu** (`tests/helpers/breakpoint.ts` mierzy układ przy
  `1023` i `1024` — łapie rozjazd stała↔`@media` także w paśmie 1024–1280,
  niewidocznym dla profili testowych); weryfikacja „test łapie regresję"
  wykonana w obie strony. **Zero zmian w `dist`** (JS bajt w bajt), zero
  regeneracji baseline'ów. **Odłożone: D/E/F** — `MotionGate.astro` (R2),
  wspólny moduł ruchu (R1) i wydzielenie sheeta z `Navbara` (R7); to one
  niosą ryzyko wizualne. `BackButton`/`back-link.ts` zostają uśpione
  świadomie (D-CH8, status dopisany w plikach; koszt zmierzony: 307 B na
  stronę inline, bez dodatkowego żądania).
- **Remont panelu `/admin` — WYKONANY** (2026-08-05, gałąź
  `feat/remont-panelu`; decyzje D-RP1–D-RP10: `docs/analiza-remont-panelu.md`
  — czytać PRZED pracą przy schemacie CMS): **pozycja galerii to WARIANT**
  („Zdjęcie" ALBO „Film", nigdy oba — `types`/`typeKey` Sveltii; mechanizm
  potwierdzony w binarium 0.170.0), czyli wykluczenie mediów wymusza sam
  panel, a nie build; **pole `cover` SKASOWANE** — kaflem jest pierwsza
  pozycja galerii, a `viewProject()` wylicza z niej `cover`, dzięki czemu
  `WorkIndexCard`/`HomeRealizacje` zostały NIETKNIĘTE; **film nie ma już
  zdjęcia-plakatu** — miniatura to klatka ze środka klipu (`videoFrameAt()`
  obok `imgAt()` → `/cdn-cgi/media/mode=frame`; środek liczony z pola
  „Długość wideo", brak/śmieć → 1 s; zmierzone: JPEG, cache 20 dni, `time`
  poza długością klipu = 400 i pusta miniatura — jedyny cichy błąd, jaki
  klient może tu popełnić); **pierwsza pozycja musi być zdjęciem** —
  jedyna reguła, której panel nie wymusi (nie zna warunku „na tym miejscu
  listy"), więc łapie ją `.superRefine` komunikatem napisanym dla klienta;
  etykiety parametrów zawsze wielkimi literami (`text-transform` w CSS —
  decyzja typograficzna, dane i czytniki ekranu nietknięte). Migracja treści
  skryptem `scripts/migrate-realizacje-gallery.mjs` (świadomy wyjątek od
  zasady twardej nr 2, za wyraźną zgodą Mateusza; idempotentny, `--dry`):
  5 wpisów produkcyjnych + 5 fixture'owych; wpis klienta z filmem na
  pierwszej pozycji rozbity na zdjęcie-kafel + film jako druga pozycja.
  **Zero nowych baseline'ów** — i to nie przypadek: na preview endpointy
  `/cdn-cgi/` nie istnieją, więc zdjęcia realizacji są pustymi kadrami
  i przetasowanie plików jest dla testu wizualnego niewidzialne (widziałby
  zmianę liczby kadrów albo geometrii). Kolektor problemów w testach
  (`tests/helpers/guards.ts`) filtruje teraz oba endpointy `/cdn-cgi/`
  (`image` i `media`) — wcześniej tylko `image`, przez co 404 miniatury
  wywracał spec „bez błędów konsoli i 404". **Panel przeklikany**
  (§10 analizy): Sveltia zapisuje `type` dokładnie tak, jak zakłada schemat
  (potwierdzone na diffie — to było ryzyko nr 1 całego remontu), rodzaju
  dodanej pozycji NIE DA SIĘ zmienić (uznane za zaletę; opisane w obu
  instrukcjach), a zapisu z filmem na pierwszej pozycji **panel nie
  zablokuje** — Sveltia waliduje wyłącznie pojedyncze pola
  (`valueMissing`/`patternMismatch`), bez żadnego hooka na cały wpis; stąd
  `hint` pod polem galerii jako jedyne ostrzeżenie PRZED zapisem.
  **M6 (plakat = jednolita plansza) ZAMKNIĘTE** (§11 analizy): objaw
  przeżył podmianę na klatkę, ale przyczyną był **proces Chrome'a działający
  po podmianie plików przez aktualizację** („Relaunch to update") — restart
  naprawił, ZERO zmian w kodzie. Po drodze obalone trzy hipotezy (format
  AVIF, klonowanie kadrów, kod strony); rozstrzygnął pomiar rozrzutu pikseli
  kadru w prawdziwym Chromie na czystym profilu. Lekcja do zapamiętania:
  **„tylko w jednej przeglądarce" ≠ „przez tę przeglądarkę"** — najpierw
  czysty profil TEJ SAMEJ przeglądarki, i patrz na CAŁE okno zrzutu
  (wskazówka leżała na pasku Chrome'a przez cały czas).
- **Podbicie Sveltii 0.170.0 → 0.178.0 — WYKONANE** (2026-08-06; domyka
  D-RP10, przebieg i pomiary: `docs/analiza-remont-panelu.md` §12): zmiana to
  **jedna linia** w `public/admin/index.html` (panel wisi na jsDelivr — nie ma
  lockfile'a ani zależności npm). Wzięta wersja z dwudniowym stażem zamiast
  najnowszej 0.180.0 wydanej tego samego dnia; różnica udokumentowana między
  nimi to DWIE LOKALIZACJE, więc nie tracimy nic. Jedyna zmiana łamiąca
  w całym paśmie (v0.174.0: Google Fonts → Fontsource) dotyczy **wyłącznie
  stron z CSP** — **CSP nie mamy** ani w repo, ani w nagłówkach produkcji
  (sprawdzone dwoma pomiarami). Sonda w binarium (technika z §2.5): wystąpienia
  `hasVariableTypes`/`typeKey`/`rangeUnderflow`/`showDirectoryPicker` oraz
  `valueMissing`/`patternMismatch` **identyczne** — czyli warianty listy stoją,
  a ustalenie „panel nie zablokuje filmu na pierwszej pozycji" obowiązuje dalej.
  Jedyna różnica (`cloudflare_r2` 5 → 14) to w całości nowe tłumaczenia
  etykiety klucza R2; to samo tłumaczy bundle 1 972 914 → 2 480 375 B (+26 %,
  bez wpływu na LHCI — mierzy strony serwisu, nie `/admin`). Regresja
  przeklikana w trybie lokalnego repozytorium: **klucze `type` po zapisie
  nietknięte**, diff osiem linii bez pól-śmieci, formater bajtowo w tym samym
  stylu — czyli przebudowa edytora listy z v0.176.0 („Improved the list editor
  UX", jedyna pozycja changelogu przeoczona przy wstępnym przeglądzie) NIE
  ruszyła formatu zapisu. Przy okazji domknięte pytanie otwarte z remontu:
  **`hint` pod polem galerii się renderuje**. Upload do R2 = jedyny punkt poza
  zasięgiem trybu lokalnego, weryfikowany po merge'u na produkcji.
- **Naprawa parallaxu w scenie realizacji — WYKONANA** (2026-08-06; decyzje
  D-U1–D-U4: `docs/analiza-parallax-realizacje.md` — KOREKTA ustaleń 4.2
  o parallaxie tej sceny): desktopowy override `:global(html.js-motion) .rc
img` kasował zapas z reguły bazowej do zera (`top: 0; height: 100%`),
  ZOSTAWIAJĄC ruch `data-par="0.11"` — a w przypiętej scenie kafel ma
  wysokość całego okna, więc odsłaniał kremowe tło kafla na **do 107 px**
  (1920×1080) nad zdjęciem przy wjeżdżaniu w sekcję i pod nim przy
  wyjeżdżaniu. Zapasem jest teraz **KADR** (zoom 1,14 w obu osiach) przy
  ruchu zmniejszonym na desktopie do 0,06 — nowy atrybut **`data-par-d`**
  czytany przez `parPaint` tylko powyżej progu (wstecznie zgodny: element
  bez niego zachowuje się jak dotąd). Wybór wariantu = decyzja Mateusza
  z dwóch zbudowanych i zmierzonych; odrzucony zapas procentowy
  (`height: 124%`) przycinał kadr mocniej, bo zostawiał ruch 0,11. Pułapka
  warta zapamiętania: **preflight Tailwinda ma `img { max-width: 100% }`**,
  więc bez `max-width: none` zapas powstaje tylko w pionie. Poboczne:
  hover-zoom kafla był MARTWY (styl inline z `parPaint` bije arkusz) —
  skasowany; `transition` na nadpisywanym transformie zostaje (zmierzone:
  opóźnienie ≤8,5 px, nigdy poza zapasem — wygładza parallax jak lerp `--p`
  navbara). **Zero nowych baseline'ów** — i to nie przypadek: na preview
  `/cdn-cgi/image` nie istnieje, kafle realizacji są pustymi ramkami, więc
  pixel-diff tej klasy usterki NIE WIDZI. Strażnikiem jest sonda układu
  w `tests/e2e/index.spec.ts` (weryfikacja „łapie regresję" w obie strony).
- **Testy odporne na treść z panelu — WYKONANE** (2026-08-06, po realnym
  incydencie na main): klient usunął w panelu wszystkie realizacje, co
  skasowało CAŁY katalog `src/content/realizacje` (git nie trzyma pustych
  katalogów) — trzy pliki testowe wołały `readdirSync` przy ładowaniu modułu,
  więc `quality` i `prod-smoke` poszły na czerwono z `ENOENT` PRZED
  uruchomieniem jakiegokolwiek testu. Build i deploy działały bez zarzutu
  (produkcja stała z pustą listą), czyli czerwień była wyłącznie testowa —
  ale przy required checks blokowała WSZYSTKIE merge'e, co przed przekazaniem
  klientowi jest pułapką. Wpisy czyta się teraz wyłącznie przez
  `tests/helpers/realizacje.ts`, a testy zależne od ich liczby robią
  `test.skip` z jawnym powodem (mobilna szyna filtrów pyta o realną wysokość
  siatki, nie o liczbę wpisów). Zmierzone: 0 wpisów → e2e w całości zielone
  i JEDEN czerwony test (kontrakt „katalog zawiera co najmniej jeden wpis",
  komunikat napisany dla człowieka); 1 wpis → wszystko zielone (wcześniej
  7 czerwonych); 6 wpisów → 551 ✓ jak dotąd. Reguły: `.claude/rules/testing.md`
  i `.claude/rules/cms-realizacje.md`.
- Etap 7 — przed nami (umowa → przekazanie).

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
  `KategorieSection` + skrypty `oferta.ts`/`kat-sheets.ts` (funkcjonalne,
  zawsze) i `oferta-motion.ts` (motion-gate, wspólny obu stron).
  Karty kategorii (6 sheetów `#kat-<slug>` + mechanika) =
  `KategorieSheets.astro` — komponent WSPÓŁDZIELONY przez `/kategorie/`,
  `/` i `/oferta/` (runda poprawek): tap w kafel kategorii na mobile
  otwiera kartę W MIEJSCU, kanoniczny deep-link kategorii to
  `/oferta/#<slug>` (desktop = zakładka, mobile = karta);
  `/kategorie/#<slug>` działa jak dotąd.
- `src/components/sections/work/` — Realizacje (4.4): dane z Content
  Collections (`src/content/realizacje/*.json`; schema Zod:
  `src/content.schema.ts` — źródło prawdy, `content.config.ts` tylko ją
  importuje) + `work-config.ts` (WORK_DESKTOP_MIN_PX=1024, importują
  testy) + `work-data.ts` (`viewProject`/`workRail`; `viewProject`
  WYLICZA kafel z pierwszej pozycji galerii — pola `cover` nie ma od
  remontu panelu). Detal = JEDEN
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
  `ContactPage.astro` (navbar `over`; scroll natywny — D-K9, od D-Q1
  reguła całego serwisu).
- `src/scripts/` — DWA moduły (`smooth-scroll.ts` skasowany razem z Lenisem
  w rundzie poprawek 2): `overlay.ts` (generyczne nakładki modal/sheet —
  focus-trap, Esc, swipe-down, blokada scrolla natywnie),
  `back-link.ts` (delegacja `a[data-back]` z `BaseLayout` — uśpiona, D-CH8).
  **Scroll w całym serwisie jest natywny** — `.claude/rules/scroll.md`.
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
