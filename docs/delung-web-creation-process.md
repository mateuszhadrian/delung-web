# delung.pl — proces stworzenia strony: instrukcja wykonawcza

> **Status:** INSTRUKCJA WYKONAWCZA (2026-07-29), zgodna z decyzjami z
> `delung-web-entrance-analysis.md` (tabela §2 + rozstrzygnięcia D1–D8).
> Dokument powstał w repo `hadrianm-web`, docelowo przenosi się do katalogu
> projektu delung — celowo nie jest wpisany do `docs/README.md`.
>
> **Układ:** Część A = wersja skrócona (checklista). Część B = pełna
> instrukcja etapami (kod + kroki poza kodem, klik po kliku tam, gdzie
> trzeba). Część C = flow mediów dla klienta (D1). Część D = opcje
> backupowe na przyszłość.
>
> **Podział ról jak przy hadrianm.pl:** kroki „w kodzie" wykonuje Claude
> w sesjach w nowym repo; kroki „w chmurze" (panele GitHub / Cloudflare /
> OVH / Resend) klikasz Ty — są rozpisane maksymalnie dokładnie.
> **Commituje wyłącznie Mateusz** — ta zasada przechodzi do nowego repo
> razem z blokadami w `.claude/settings.json`.

---

## CZĘŚĆ A — WERSJA SKRÓCONA (checklista całości)

**Etap 0 — bootstrap repo (kod, dzień 1)**
- [ ] `~/Projects/delung-web` = kopia hadrianm-web bez `.git`/generatów/baseline'ów
- [ ] Wycięcie: hero+drewelomet, sekcje hadrianm, EN, LowPowerNotice+`lpm-probe.mp4`, capture-devices
- [ ] Parametryzacja ~40 miejsc „hadrianm" (lista §5 analizy)
- [ ] Fonty (Manrope, Cormorant Garamond, Archivo — fontsource + preloady), tokeny z designów
- [ ] `routes.ts` PL-only (8 tras), `/kategorie` z redirect-skryptem, `categories.ts` (7 kategorii)
- [ ] Ekosystem `.claude` przepisany (CLAUDE.md, settings, rules, skille)
- [ ] Eksporty designów → `docs/design/`; ta analiza + instrukcja → `docs/`+ nowy `docs/README.md`
- [ ] Zielone: `format:check`, `lint`, `typecheck`, `build`, `test:unit` (po przycięciu)

**Etap 1 — „pusta" produkcja (dzień 1–2)**
- [ ] Repo GitHub `mateuszhadrian/delung-web` (private) + push
- [ ] Cloudflare Pages: connect, `pnpm build`/`dist`/`NODE_VERSION=22`
- [ ] Domena `delung.pl` w OVH (⚠️ wyłącz DNSSEC przed zmianą NS!) → DNS do Cloudflare → custom domains `delung.pl`+`www`
- [ ] Skrzynka OVH Zimbra `kontakt@delung.pl` (MX+SPF w Cloudflare)
- [ ] Branch protection na `main` (na razie sam `quality`)

**Etap 2 — CMS + media**
- [ ] R2: bucket `delung-media` (eu) + custom domain `media.delung.pl` + Image Transformations + token R2
- [ ] Konto GitHub `delung-cms` (collaborator write tylko do `delung-web`)
- [ ] OAuth App „Panel treści — delung.pl" + Worker `sveltia-cms-auth-delung` (sekrety, `ALLOWED_DOMAINS`) + docelowo `auth.delung.pl`
- [ ] `config.yml` + `content.schema.ts` delung (PL-only, wideo, kategorie z `categories.ts`)
- [ ] **SPIKE: upload MP4 przez widget `file` Sveltii do R2** (plan B: pole URL)
- [ ] Testowe realizacje przez panel (materiały testowe D6)

**Etap 3 — testy/CI na szkielecie**
- [ ] Specy przycięte/adaptowane, `prod-smoke.yml` → `delung.pl`
- [ ] Pierwsze baseline'y (kod → workflow linux → darwin na końcu)
- [ ] Budżety LHCI z pomiaru + zapas; required checks: `quality`,`e2e`,`lighthouse`

**Etap 4 — widoki (po jednym PR, pętla analiza→implementacja→testy→baseline'y)**
- [ ] Chrome: navbar, menu bottom sheet, footer (IG `delung_meble`, bez FB)
- [ ] `/` → `/oferta`+`/kategorie` → `/realizacje` (filtry, detal, wideo) → `/proces-wspolpracy` → `/o-nas` → `/polityka-prywatnosci`

**Etap 5 — formularz + `/kontakt`**
- [ ] Resend: domena `send.delung.pl` (DKIM/SPF) + API key
- [ ] Turnstile: nowy widget dla `delung.pl` (site key w kodzie, secret w Pages)
- [ ] Pages env: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, binding KV `KONTAKT_KV`
- [ ] Adaptacja `contact-form.ts` + widok + testy antyspamu

**Etap 6 — SEO/pomiar/polish**
- [ ] og-image, favicony, manifest (logo Delung); JSON-LD LocalBusiness na `/kontakt`
- [ ] Cloudflare Web Analytics, Google Search Console + sitemap, uptime monitor
- [ ] Fizyczny test na telefonach (checklista §B.6.6)

**Etap 7 — umowa i przekazanie**
- [ ] Umowa (draft z Claude → prawnik): abonament managed, kill-switch, karencja, przekazanie
- [ ] Instrukcja panelu PL dla klienta + flow mediów (Część C)
- [ ] 2FA `delung-cms` na telefonie klienta; przekazanie loginów (panel, skrzynka)
- [ ] Szkolenie: dodanie realizacji na żywo

---

## CZĘŚĆ B — PEŁNA INSTRUKCJA

### Etap 0 — bootstrap repo (kod, lokalnie)

**Cel:** działający lokalnie, „pusty ale żywy" projekt delung z całą
infrastrukturą hadrianm i bez jego treści.

**0.1 Kopia projektu.**

```bash
mkdir -p ~/Projects/delung-web
rsync -a ~/Projects/hadrianm-web/ ~/Projects/delung-web/ \
  --exclude .git --exclude node_modules --exclude dist --exclude .astro \
  --exclude test-results --exclude playwright-report \
  --exclude "tests/visual/__screenshots__" \
  --exclude "public/drewelomet" --exclude docs \
  --exclude .claude/settings.local.json
cd ~/Projects/delung-web && git init && git checkout -b main
pnpm install && pnpm build   # sanity check punktu wyjścia
```

Baseline'y wizualne i `docs/` hadrianm zostają w hadrianm — delung dostaje
własne. Utwórz świeży `docs/` z: `README.md` (indeks statusów — konwencja
jak w hadrianm), `delung-web-entrance-analysis.md`,
`delung-web-creation-process.md` (ten plik) oraz `docs/design/` =
kopia `~/Projects/delung-meble/eksport/` (README.txt + 8 HTML; **assets/img
selektywnie** — patrz 0.6, nie wciągaj 142 MB PNG do repo bezmyślnie:
docelowo media żyją w R2, w repo tylko to, co potrzebne designom jako
referencja; duże PNG mogą zostać w `~/Projects/delung-meble/eksport/`,
a `docs/design/README.md` niech wskazuje tę ścieżkę).

**0.2 Wycinanie (w tej kolejności, po każdej grupie `pnpm typecheck`):**

1. Strony EN: `src/pages/en/**`; z `astro.config.mjs` zostaje
   `defaultLocale: "pl", locales: ["pl"]` (albo cała sekcja i18n out);
   z `BaseLayout` hreflang/alternates; `routes.ts` → zwykłe stałe PL.
2. Hero: `src/components/sections/hero/**` (18 plików), wpisy w `Home.astro`,
   fonty `--font-drewelomet-*` z `global.css`, `scripts/capture-device-videos.mjs`
   + `capture-harness.astro` + `verify-mobile-videos.mjs`, skill
   `/capture-devices`, testy `hero-*` (unit/e2e/visual).
3. Sekcje hadrianm: `sections/{audience,services,about,faq}/**`, strony-wrappery
   (`AudiencePage`, `ServicesSubpage`, `AboutPage`, `FaqPage`), `i18n/faq.ts`,
   powiązane specy i assets (`src/assets/{about,audience}`).
4. `LowPowerNotice.astro` + `public/lpm-probe.mp4` (decyzja D8).
5. Sekcja `work/` — **zostaje jako baza** (overlay, WorkDeviceDuo do wymiany
   na galerię delung; częściowo przepiszemy w Etapie 4.4, ale kontrakt
   kolekcja→komponenty warto utrzymać przy życiu od początku).
6. Uprość `localizeProject`/`{pl,en}` w `work-data.ts` do typów PL-only.
7. `i18n/ui.ts` → odchudzony słownik PL (albo stałe w modułach) — decyzja
   robocza w sesji; nie zostawiać martwych kluczy EN.

**0.3 Parametryzacja** — checklista miejsc z analizy §5 (domena, R2,
poczta, branding, teksty, skrypty). Konkrety wpisywane teraz:

- `astro.config.mjs`: `site: "https://delung.pl"`.
- `package.json`: `name: "delung-web"`, `test:smoke:prod` →
  `BASE_URL=https://delung.pl`.
- `public/robots.txt`: `Sitemap: https://delung.pl/sitemap-index.xml`.
- `.github/workflows/prod-smoke.yml`: 4× URL → `https://delung.pl`.
- `.claude/settings.json`: allow `curl … delung.pl`; reszta blokad bez zmian.
- `contact-form.ts`: `CONTACT_TO="kontakt@delung.pl"`, `CONTACT_FROM_NOTIFY=
  "Formularz delung.pl <no-reply@delung.pl>"`, `CONTACT_FROM_CONFIRM="Delung
  Meble <no-reply@delung.pl>"` + treści maili (temat `[delung.pl] …`, stopka,
  podpis) — dane firmowe z `docs/design/kontakt.html` (D4).
- `contact-ui.ts`: obfuskowany mail/telefon delung (z designu kontakt).
- `Navbar`/`LoadingOverlay`/`Footer`: logo Delung (assets eksportu:
  `Delung-logo-new-no-background*.png` → zoptymalizowane SVG/WebP),
  © Delung Meble, social: tylko Instagram
  `https://www.instagram.com/delung_meble/` (D4 — Facebook usunięty).
- `PolicyPage.astro`: treść 1:1 z `polityka-prywatnosci.html` (9 sekcji,
  dane administratora z designu — poprawne wg D4).
- `site.webmanifest`, favicony, `og-image` — placeholdery z logo Delung
  (finalne w Etapie 6).

**0.4 Design tokens + fonty.**

- Z eksportów wyciągnij paletę/typografię do `:root` w `global.css`
  (jak w hadrianm — jedno źródło prawdy). Breakpoint projektu: **1024 px**
  (spójnie wszędzie; nie mieszać z 760/768 z hadrianm).
- Fonty self-hosted (lekcja FOUC): `@fontsource-variable/manrope`,
  `@fontsource/cormorant-garamond`, Archivo już jest. Preloady krytycznych
  subsetów latin/latin-ext w `BaseLayout` + istniejąca bramka `fonts-in`.
  Google Fonts i GSAP-z-CDN z eksportów **nie wchodzą** do produkcji.
- ⚠️ **Helvetica (font główny designów — 104 reguły
  `font-family:Helvetica,Arial,sans-serif`, wagi 200/300) NIE wchodzi do
  produkcji:** to komercyjny font (płatna licencja webfont), systemowo ma
  go tylko macOS/iOS — na Windows spada do Arial, na Androidzie do Roboto,
  a Arial **nie ma wagi 200** (nagłówki straciłyby „lekki" charakter).
  Decyzja (2026-07-29): rolę Helvetiki przejmuje **self-hostowany font
  variable** — kandydat nr 1: **Archivo Variable** (już w szablonie, już
  ładowany w eksportach, wagi 200/300 z jednego pliku), kandydat nr 2:
  Inter Variable. Wybór testem A/B w tym kroku: otworzyć
  `docs/design/index.html` z podmienionym `font-family` i porównać
  z oryginałem na macOS (gdzie renderuje się prawdziwa Helvetica);
  wybrany font wpisać do tokenów, `Helvetica` usunąć ze stacków
  (fallback: `system-ui, Arial, sans-serif`).

**0.5 Routing.** `src/lib/routes.ts` (PL-only): `/`, `/oferta/`,
`/kategorie/`, `/realizacje/`, `/proces-wspolpracy/`, `/o-nas/`,
`/kontakt/`, `/polityka-prywatnosci/`. Strony-szkielety (nagłówek + footer)
dla wszystkich tras od razu — działająca nawigacja przed treścią (lekcja
Fazy 2 hadrianm). `/kategorie/`: w `<head>` **przed** stylami/paintem:

```html
<script is:inline>
  if (matchMedia("(min-width:1024px)").matches)
    location.replace("/oferta/");
</script>
<link rel="canonical" href="https://delung.pl/oferta/" />
```

**0.6 Kategorie + obrazy.**

- `src/lib/categories.ts` — jedno źródło prawdy (D2):

```ts
export const CATEGORIES = [
  { slug: "kuchnie", label: "Kuchnie" },
  { slug: "szafy-garderoby", label: "Szafy i garderoby" },
  { slug: "wnetrza-komercyjne", label: "Wnętrza komercyjne i biura" },
  { slug: "dekoracje-okienne", label: "Dekoracje okienne" },
  { slug: "zabudowy-lazienkowe", label: "Zabudowy łazienkowe" },
  { slug: "meble-nietypowe", label: "Meble nietypowe" },
  { slug: "inne", label: "Inne" },
] as const;
```

  Konsumenci: `/oferta/`, `/kategorie/`, filtry `/realizacje/`, widget
  `select` w CMS, test kontraktu (spójność slug↔panel). Lista będzie się
  zmieniać po przeklikaniu przez klienta — dlatego dodanie/usunięcie
  kategorii = edycja tej jednej tablicy (+ ewentualnie treść oferty).
- Filtry realizacji: kategorie bez wpisów **ukryte** (żadnych „(0)").
- Obrazy do sekcji statycznych (hero, oferta, proces, o-nas): skrypt
  `scripts/optimize-images.mjs` (sharp — wzorzec z hadrianm): PNG z
  eksportów → WebP w docelowych rozmiarach; osobne warianty desktop/mobile
  tam, gdzie mobile wymaga odciążenia (D6). Obrazy **realizacji** nie idą
  do repo — od początku R2 + `imgAt()` (Etap 2).

**0.7 Ekosystem `.claude`.** Przepisz `CLAUDE.md` (mapa delung, te same
zasady twarde), zaktualizuj `rules/` (hero-rule out; sections/cms/testing
adaptowane; reguła „schemat CMS w trzech miejscach naraz" zostaje), skille:
`/test`, `/release-check`, `/verify-mobile` (bez sweepa hero — sekcje),
`/new-realizacja` (pola delung + wideo). Hooki bez zmian (guard-realizacje,
format-file, remind-tests, stop-typecheck).

**0.8 Weryfikacja etapu:** `pnpm format:check && pnpm lint && pnpm
typecheck && pnpm test:unit && pnpm build && pnpm preview` — strona
szkieletowa działa, zero odwołań do hadrianm (grep kontrolny:
`grep -ri "hadrianm" src public functions .github .claude` → 0 trafień).

### Etap 1 — repo GitHub + „pusta" produkcja + domena + poczta

**Cel:** `delung.pl` żyje (szkielet) — pipeline produkcyjny sprawdzony
zanim powstanie treść (lekcja „deploy w dniu 1").

1. **GitHub:** nowe repo `mateuszhadrian/delung-web` (**Private**), push
   main. (Sveltia działa z private repo — auth przez Workera.)
2. **Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to
   Git → `delung-web`, branch `main`; Framework preset **Astro**, build
   `pnpm build`, output `dist`, env `NODE_VERSION=22`. Save and Deploy →
   dostajesz `delung-web.pages.dev`.
3. **Domena `delung.pl` w OVH:** kup samą domenę (bez DNS Anycast; liczniki
   e-mail 0 — darmowa skrzynka Zimbra i tak jest w cenie).
   ⚠️ **Haczyk OVH: DNSSEC jest domyślnie WŁĄCZONY** — wyłącz go w panelu
   OVH i poczekaj na zdjęcie rekordu DS (kontrola: DNSViz / whois NASK
   „Unsigned"; panel OVH potrafi długo pokazywać „Disabling…") **zanim**
   zmienisz nameserwery.
4. **DNS do Cloudflare:** Cloudflare → Add a domain → `delung.pl` → z
   zeskanowanych rekordów usuń parkingowe OVH (A/CNAME/TXT znaczniki),
   w OVH ustaw nameserwery Cloudflare („Use my own DNS", pola IP puste).
   Po statusie Active: Pages → Custom domains → `delung.pl` + `www.delung.pl`.
5. **Skrzynka `kontakt@delung.pl`:** OVH → Web Cloud → E-maile (Zimbra
   Starter w cenie domeny) → utwórz konto `kontakt@delung.pl`; w Cloudflare
   DNS dodaj MX + SPF wg wskazań OVH (wzorzec: `docs/mailbox_setup.md`
   hadrianm). Test: wyślij/odbierz z webmaila. Hasło zapisz — przekazanie
   klientowi w Etapie 7.
6. **Branch protection:** GitHub → Settings → Branches → rule na `main`,
   required check: `quality` (rozszerzysz w Etapie 3). Od teraz praca
   wyłącznie feature branch → PR (daily workflow jak w hadrianm).

### Etap 2 — CMS (Sveltia) + media (R2) + logowanie klienta

**Cel:** panel `/admin` działa dla Ciebie i dla klienta (konto techniczne),
zdjęcia i wideo lądują w R2, testowe realizacje wgrane ścieżką docelową.

1. **R2:** Cloudflare → R2 → Create bucket `delung-media` (location EU) →
   Settings → Custom domain `media.delung.pl`. Włącz Image Transformations
   dla strefy `delung.pl` (Speed → Optimization → Image Optimization /
   Transformations). CORS bucketu: dopuść `https://delung.pl` (panel).
   Utwórz **R2 API token** (Object Read & Write, scope: tylko
   `delung-media`) → zanotuj `Account ID`, `Access Key ID`,
   `Secret Access Key` (menedżer haseł!).
2. **`imgAt()`**: bez zmian koncepcyjnych (`/cdn-cgi/image/width=…` na
   URL-ach `https://media.delung.pl/...`); test `media-r2.test.ts` → regex
   `media\.delung\.pl`.
3. **Konto techniczne `delung-cms`:** załóż konto GitHub (mail np.
   alias na Twojej skrzynce lub skrzynka klienta — Twoja decyzja
   operacyjna; recovery codes do Twojego menedżera). W repo `delung-web`:
   Settings → Collaborators → add `delung-cms` (**Write**). 2FA
   skonfigurujesz na telefonie klienta w Etapie 7 (D3).
   ⚠️ Konto `delung-cms` musi móc commitować na `main` z panelu — jak w
   hadrianm: branch protection wymuszaj przez PR dla ludzi, ale nie blokuj
   pushów CMS-a (w razie problemów: bypass dla `delung-cms`).
4. **OAuth App:** GitHub (konto `mateuszhadrian`) → Settings → Developer
   settings → New OAuth App: name `Panel treści — delung.pl`, homepage
   `https://delung.pl`, callback `https://<worker-delung>/callback`
   (uzupełnisz po kroku 5; docelowo `https://auth.delung.pl/callback`).
   Zapisz Client ID + wygeneruj Client Secret.
5. **Worker auth (osobny dla delung — czysty branding i kill-switch):**

   ```bash
   git clone --depth 1 https://github.com/sveltia/sveltia-cms-auth /tmp/sveltia-cms-auth
   cd /tmp/sveltia-cms-auth
   # w wrangler.toml zmień name na: sveltia-cms-auth-delung
   npx wrangler deploy
   ```

   W Cloudflare → Worker → Settings → Variables and Secrets:
   `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (Encrypt),
   `ALLOWED_DOMAINS = delung.pl,localhost` (+ czasowo, wąsko:
   `delung-web.pages.dev` — usuń po podpięciu domeny). Docelowo: Domains &
   Routes → Custom domain `auth.delung.pl` → popraw callback w OAuth App
   i `base_url` w config.yml (3 miejsca spójnie!). Dopisz Workera do
   cyklicznego odświeżania w `optional-todos` delung (co 3–6 mies.).
6. **`public/admin/` delung:** `index.html` (title „Panel treści —
   delung.pl", Sveltia z jsDelivr, wersja **przypięta** — sprawdź aktualny
   changelog i przypnij świeżą stabilną). `config.yml`:

   ```yaml
   backend:
     name: github
     repo: mateuszhadrian/delung-web
     branch: main
     base_url: https://auth.delung.pl
   media_libraries:
     cloudflare_r2:
       account_id: <ACCOUNT_ID>
       access_key_id: <ACCESS_KEY_ID>   # secret NIE wchodzi do repo —
       bucket: delung-media             # Sveltia pyta o niego w panelu
       public_url: https://media.delung.pl
       prefix: "realizacje/"
       jurisdiction: eu
   output:
     omit_empty_optional_fields: true
   ```

7. **Schemat kolekcji (PL-only + wideo)** — trzy miejsca naraz
   (`content.schema.ts` + `config.yml` + komponenty), pola wg analizy §6.1:
   `slug`, `order`, `title`, `category` (**widget `select`** z opcjami =
   slugi z `categories.ts`; test kontraktu pilnuje spójności), `year`,
   `description`, `cover {image, position?}`, `gallery[] {image, position?,
   video?, duration?}` (min 1), `specs[] {label, value}`. JSON-y pisze
   wyłącznie Sveltia (guard-hook, `.prettierignore` — jak w hadrianm).
8. **SPIKE WIDEO (przed budową widoków!):** w kolekcji pole `video` jako
   `widget: file` z biblioteką mediów R2 → wgraj testowy MP4 (~20 MB)
   z panelu; sprawdź, że plik ląduje w R2 i URL `https://media.delung.pl/…`
   gra w `<video>`. Gotcha hadrianm: upload do R2 działał przez pola Image —
   dla `file`/MP4 trzeba potwierdzić empirycznie. **Plan B:** pole `video`
   jako `string` z walidacją prefiksu `https://media.delung.pl/` — klient
   wkleja link z wrzutni (Część C), reszta flow bez zmian.
9. **Testowe realizacje:** 5 wpisów wg danych z `realizacje.html`
   (tablica `PROJEKTY` — tytuły/opisy/specs gotowe), media = materiały
   testowe (D6) **wgrane przez panel** (od razu ścieżka docelowa; przy
   pierwszym uploadzie panel poprosi o R2 Secret Access Key). Weryfikacja:
   `git pull` + `pnpm test:unit` (kontrakt CMS).

### Etap 3 — testy/CI na szkielecie

1. Specy: zostają `navigation`, `seo`, `a11y`, `policy`, `smoke`
   (adaptowane do tras delung); specy sekcji delung powstają razem z
   widokami w Etapie 4. Visual: sweep-helpery zostają, spec per widok
   delung. Konfiguracja Playwright (6 profili), `assertPreview`, port 4399,
   maskowanie wideo na zrzutach — bez zmian.
2. `ci.yml` bez zmian; `prod-smoke.yml` już na `delung.pl` (Etap 0.3).
3. Pierwsze baseline'y: darwin lokalnie (`pnpm test:visual:update`), linux
   workflowem `update-visual-baselines.yml`; **kolejność na zawsze: kod →
   workflow linux → commit darwin na końcu** (bot-push nie wyzwala CI).
4. LHCI: zmierz szkielet+home w CI, ustaw budżety **z zapasem na przyrost
   sekcji** (lekcja §D kroniki — mniej PR-ów „re-baseline"); ratchet od
   tego momentu. Allowlista axe: zaczynamy PUSTA (ratchet od zera).
5. GitHub → branch protection: required checks `quality` + `e2e` +
   `lighthouse`. Od teraz pełny daily workflow hadrianm (feature branch →
   `/test` → PR → 3 checki → merge → auto-deploy → prod smoke).

### Etap 4 — widoki (po jednym PR)

> **Tryb pracy (decyzja po Etapie 3):** etap rozbity na CZĘŚCI 4.1–4.5,
> każda prowadzona w OSOBNEJ, świeżej sesji Claude Code — prompty
> startowe per część + kontekst wspólny (lekcje Etapu 3, definition of
> done): **`docs/etap-4-prompty.md`**. Między częściami Mateusz testuje
> zmergowany widok sam (preview/produkcja/fizyczny telefon); poprawki
> osobnym promptem korekty (szablon tamże).

Pętla dla każdego widoku: mini-analiza w `docs/` (decyzje portu z
referencji, jak `analiza-*` w hadrianm) → implementacja → testy
unit/e2e/visual → baseline'y darwin+linux → PR. Kolejność:

1. **Chrome globalny:** navbar wg designów (`hdr`/`hdr-nav`, warianty
   plain/dark), **menu mobile na bottom sheet** (wzorzec `sheet-*` z
   eksportów na szkielecie `overlay.ts` — focus-trap, Esc, swipe-down,
   blokada scrolla za darmo), footer (`ft`, IG, polityka), BackButton +
   `data-back` na podstronach.
2. **Strona główna** (`index.html`): hero (umiarkowane animacje — reveal/
   parallax; **bez** sceny urządzeń), zajawki oferta/proces/realizacje/
   o-nas, opinie, CTA kontaktu, crossfade tła jeśli design go wymaga.
3. **`/oferta/` + `/kategorie/`:** wspólne dane z `categories.ts` + treści
   oferty; desktop zakładki+panel, mobile karuzela 3 kafli + „zobacz pełną
   ofertę" → `/kategorie/`; `/kategorie/` mobile-only + redirect (0.5).
   Gotchas karuzel z hadrianm: `data-lenis-prevent-horizontal` (NIE
   `-prevent`!), `scroll-snap-stop: always`.
4. **`/realizacje/`:** szyna filtrów (kategorie z wpisami — puste ukryte),
   siatka kafli z kolekcji, detal = Modal (desktop) / BottomSheet (mobile)
   przez `overlay.ts`; galeria detalu: zdjęcia przez `imgAt()`, wideo
   `<video preload="none" poster={imgAt(image,…)} playsinline controls>`
   odtwarzane na tap (badge play + `duration` wg designu). E2E: filtrowanie,
   otwarcie/zamknięcie detalu, odtworzenie wideo funkcjonalnie (nie na
   zrzutach — maska).
5. **`/proces-wspolpracy/`** (hero + 4 kroki + efekt + CTA),
   **`/o-nas/`** (manifest, zespół, opinie), **`/polityka-prywatnosci/`**
   (treść z designu; chrome podstron).

### Etap 5 — formularz kontaktowy + `/kontakt/`

1. **Resend:** konto (istniejące) → Domains → Add `send.delung.pl` →
   w Cloudflare DNS rekordy DKIM/SPF wg wskazań Resend (poczta na apeksie
   nietknięta — rozdzielenie mail transakcyjny/skrzynka jak w hadrianm) →
   Verify → **osobny API key dla delung**.
2. **Turnstile:** Cloudflare → Turnstile → Add widget `delung-kontakt`,
   domena `delung.pl` (typ Managed) → **site key** do
   `contact-config.ts`, **secret key** do Pages.
3. **KV:** Workers & Pages → KV → Create namespace `delung-kontakt-quota`;
   Pages → Settings → Bindings → KV `KONTAKT_KV` → namespace.
4. **Pages env (Production + Preview):** `RESEND_API_KEY`,
   `TURNSTILE_SECRET_KEY` (Encrypt).
5. **Kod:** `functions/api/kontakt.ts` bez zmian logiki; `contact-form.ts`
   już sparametryzowany (0.3). Widok `/kontakt/` wg `kontakt.html` (hero,
   karty, social, formularz). Testy: e2e antyspam (deterministyczny zegar,
   stub Turnstile, readonly-honeypot — wzorce z hadrianm), prod-smoke
   formularza po deployu.

### Etap 6 — SEO, pomiar, polish

1. **Brand polish:** favicon + zestaw ikon + `og-image` + `site.webmanifest`
   z logo Delung (dopilnuj kompresji — lekcja: og 649→98 KB).
2. **JSON-LD LocalBusiness** (typ `FurnitureStore` / `HomeAndConstructionBusiness`)
   na `/kontakt/`: nazwa, adres warsztatu, telefon, godziny, IG — dane z
   designu (D4). Walidacja: Rich Results Test.
3. **Cloudflare Web Analytics:** dla Pages najprościej włączyć w ustawieniach
   projektu Pages (auto-injection beaconu) albo snippet w `BaseLayout`.
4. **Google Search Console:** property domenowa `delung.pl` (weryfikacja
   TXT w DNS) → Submit sitemap `https://delung.pl/sitemap-index.xml`.
5. **Uptime:** UptimeRobot (free) → monitor HTTPS `https://delung.pl`,
   interwał 5 min, alert na Twój mail. (Uzupełnia prod-smoke, który patrzy
   tylko w moment po deployu.)
6. **Fizyczny test na telefonach** (emulacja tego nie łapie): limit warstwy
   GPU Androida (karuzele/sheety), iOS Low Power Mode (wideo na tap ma
   działać), zwijany toolbar Safari (sticky/bottom sheet), zimny cache +
   realne łącze (fonty, LCP), dotyk fizyczny (snap karuzel, swipe-down
   sheetów, Lenis feel na desktopie nie dotyczy mobile — scroll natywny).
7. `/release-check` przed ogłoszeniem klientowi.

### Etap 7 — umowa i przekazanie

1. **Umowa** (D7 — najpierw strona stoi, umowa równolegle; pomogę
   przygotować draft w osobnej sesji): zakres (projekt+wdrożenie+utrzymanie
   managed), abonament (hosting/domena/skrzynka/utrzymanie na Twoich
   kontach), **klauzula kill-switch** (co i kiedy „gaśnie" przy braku
   płatności, okres karencji, brak kasowania treści klienta), moment i
   warunki przekazania własności (domena/konta) po pełnym rozliczeniu,
   RODO/powierzenie (formularz). Draft → weryfikacja u prawnika.
2. **Instrukcja panelu dla klienta** (PL, nietechniczna, ze zrzutami):
   logowanie (konto `delung-cms`), dodanie/edycja/usuwanie realizacji,
   wgrywanie zdjęć, wklejenie R2 Secret Key przy pierwszym uploadzie na
   nowym urządzeniu (albo: konfigurujesz mu to raz przy przekazaniu),
   flow wideo (Część C), czego NIE ruszać.
3. **2FA `delung-cms`** na telefonie klienta (aplikacja TOTP); recovery
   codes zostają u Ciebie (D3).
4. **Przekazanie dostępów:** panel (`delung-cms`), skrzynka
   `kontakt@delung.pl` (webmail + konfiguracja telefonu/Gmaila —
   opcjonalnie wg `gmail_alias_setup.md` z hadrianm) oraz **konto Resend
   klienta** (założone w Etapie 5 na `kontakt@delung.pl` — darmowy plan
   daje jedną domenę na konto, więc poczta transakcyjna delunga od razu
   stoi na koncie klienta; 2FA na jego telefonie, Setup Key i hasło
   zostają u Ciebie do pełnego rozliczenia — tak samo jak `delung-cms`).
5. **Szkolenie na żywo:** wspólnie dodajecie jedną realizację od zera
   (zdjęcia + wideo + teksty) i patrzycie, jak po ~2 min build publikuje
   ją na `delung.pl`.
6. Po przekazaniu: wymiana materiałów testowych na finalne od klienta
   (D5/D6) — już przez panel, w jego rękach (z Twoją asystą).

---

## CZĘŚĆ C — FLOW MEDIÓW DLA KLIENTA (D1: klient wrzuca sam)

### C.1 Zdjęcia (proste — panel wybacza)

1. **Jednorazowo na iPhonie klienta:** Ustawienia → Aparat → Formaty →
   **„Najbardziej zgodne"** (JPEG zamiast HEIC — transformacje Cloudflare
   nie przetworzą HEIC). Na Androidzie domyślnie JPEG — OK.
2. Klient wgrywa zdjęcia **prosto z telefonu/komputera przez panel**
   (pola Image → R2). Rozmiar wejściowy nie jest krytyczny — na stronę
   i tak trafia wariant przeskalowany przez `imgAt()`; sensowna higiena:
   nie wgrywać plików > ~10 MB (wolny upload).
3. Kadr/pozycja: pole `position` w panelu (opcjonalne, np. `50% 40%`) —
   pokazać klientowi na szkoleniu, ale to „nice to have", nie wymóg.

### C.2 Wideo — MVP: HandBrake z gotowym presetem (rekomendacja na start)

Telefon nagrywa 100–300 MB / klip — tego nie wrzucamy. Jednorazowo
instalujesz klientowi **HandBrake** (darmowy, Win/Mac) i wgrywasz preset
**„Delung – strona www"**, który przygotujesz i wyeksportujesz do pliku
`.json` (Presets → Export):

- kontener MP4, **H.264** (x264), profil High, **web optimized /
  faststart ✔** (kluczowe — start odtwarzania bez pobrania całości),
- 1080p (downscale z 4K), 30 fps (albo „same as source" przy 24/25),
- jakość RF **22–23**, audio AAC 128 kbps (lub bez audio, jeśli klipy są
  z muzyką z telefonu — do ustalenia z klientem: na stronie i tak start
  bez dźwięku),
- efekt: klip 20–30 s → zwykle **5–15 MB**.

**Instrukcja dla klienta (krok po kroku, do instrukcji panelu):**

1. Przegraj film z telefonu na komputer (kabel / AirDrop / Zdjęcia Google).
2. Otwórz HandBrake → przeciągnij plik → u góry wybierz preset
   „Delung – strona www" → przycisk **Start**.
3. Gotowy plik (mały, `.mp4`) przeciągnij w panelu do pola **Film**
   w galerii realizacji (albo — plan B — wgraj przez wrzutnię i wklej link).
4. Miniatura/plakat: pole **Zdjęcie** tej samej pozycji galerii = kadr
   zastępczy przed odtworzeniem (klient robi zrzut ładnej klatki albo
   wybiera zdjęcie z tej samej realizacji).

### C.3 Wideo — docelowo: automatyczna „wrzutnia" (ewolucja, gdy MVP uwiera)

Trzy warianty automatyzacji „klient wrzuca surowe, reszta dzieje się sama",
w kolejności rosnącej wygody/kosztu:

1. **Folder-watchdog u Ciebie (0 zł, Ty poza pętlą tylko formalnie):**
   wspólny folder (iCloud/Dropbox „Delung – filmy") + skrypt na Twoim
   Macu/serwerku (launchd/cron): nowy plik → `ffmpeg` (te same parametry
   co preset) → upload do R2 (`rclone`/`wrangler`) → mail/SMS z gotowym
   linkiem `https://media.delung.pl/realizacje/…` do wklejenia w panelu.
2. **Mini-wrzutnia web (Worker):** strona `wrzutnia.delung.pl` za prostym
   logowaniem — Worker wydaje presigned PUT do R2 na surowy plik, po
   uploadzie kolejka (Cloudflare Queues) + transkodowanie. Uwaga: w samym
   Workerze nie ma ffmpeg — transkodowanie musi robić zewnętrzny runner
   (np. GitHub Actions job wyzwalany webhookiem, albo Twój serwerek z C.3.1).
   Najwięcej własnej roboty — sensowne dopiero przy wielu klientach.
3. **Cloudflare Stream (płatne, najbardziej „samo się dzieje"):** upload
   surowego pliku przez **Direct Creator Upload** (prosta strona-wrzutnia
   z linkiem jednorazowym), Stream sam transkoduje do adaptive bitrate
   i daje playbacK URL; w panelu klient wkleja ID/URL. Koszt: $5/1000 min
   przechowywania + $1/1000 min oglądania — przy portfolio stolarza
   (np. 30 klipów × 30 s = 15 min) to pojedyncze grosze/złotówki
   miesięcznie, rośnie dopiero z ruchem. Model managed: koszt w Twoim
   abonamencie.

**Rekomendowana ścieżka:** start = C.2 (HandBrake); jeśli klient wrzuca
często i marudzi na kroki → C.3.1 (watchdog — najtańsze zdjęcie tarcia);
przy skalowaniu na wielu klientów → rozważ C.3.3 (Stream) jako standard
oferty „wideo premium".

---

## CZĘŚĆ D — OPCJE BACKUPOWE (przegląd na przyszłość; nie wdrażamy teraz)

### D.1 Inwentarz: co w ogóle jest do backupu

| Zasób | Gdzie żyje | Naturalna odporność | Ryzyko realne |
|---|---|---|---|
| Kod + treść realizacji (JSON) | GitHub + klony lokalne | git = pełna historia, kopia na każdym klonie | usunięcie repo/konta (małe) |
| **Media (zdjęcia, wideo)** | **R2 — JEDYNA kopia** | brak (R2 nie ma wersjonowania obiektów) | **usunięcie przez pomyłkę (panel/klient), awaria — to jest główna dziura** |
| Konfiguracja Cloudflare | dashboard (DNS, Pages env, Worker secrets, KV) | brak eksportu automatycznego | żmudne odtwarzanie po utracie konta |
| Skrzynka `kontakt@` | OVH Zimbra | po stronie OVH | utrata maili przy migracji |
| Sekrety (OAuth, R2, Resend, Turnstile) | menedżer haseł | — | rozproszenie/zgubienie |

Wniosek: **priorytet nr 1 to kopia R2** — reszta jest albo już
zabezpieczona (git), albo tania do odtworzenia przy dobrej dokumentacji.

### D.2 Poziom 1 — tanie i od zaraz (~0 zł, warte wdrożenia wcześnie)

- **R2 → dysk lokalny:** `rclone sync r2:delung-media ~/Backups/delung-media`
  (rclone ma natywny backend R2; tryb `sync` z flagą `--backup-dir` =
  usunięte pliki lądują w koszu zamiast znikać). Odpalane launchd/cron na
  Twoim Macu co noc albo ręcznie raz w tygodniu (wpis w optional-todos).
- **Git mirror:** `git clone --mirror` repo na dysk zewnętrzny/NAS raz na
  jakiś czas (albo drugi remote, np. prywatny GitLab).
- **Eksport strefy DNS:** Cloudflare → DNS → Export zone file → plik do
  repo/notatek po każdej zmianie DNS. Plus: spisany w jednym miejscu
  „rejestr konfiguracji" (nazwy bucketów, Workerów, env vars — bez
  wartości sekretów; wartości w menedżerze haseł).

### D.3 Poziom 2 — kopia off-site, automatyczna (niezależna od Twojego komputera)

- **R2 → drugi dostawca:** scheduled workflow GitHub Actions (cron, np.
  co noc) z `rclone`: R2 → **Backblaze B2** (10 GB free — na start
  wystarczy) albo drugi bucket R2 na osobnym koncie Cloudflare. Sekrety
  rclone w GitHub Actions Secrets. To domyka ryzyko „padło jedno konto /
  jeden dostawca".
- **Wersjonowanie zamiast lustra:** jeśli chcesz historii („cofnij do
  stanu sprzed tygodnia"), zamiast `rclone sync` użyj **restic** z repo
  na B2 — deduplikacja + snapshoty + retencja.

### D.4 Poziom 3 — serwer domowy (Twój pomysł; oceniaj trzeźwo)

- **Jako cel backupu: sensowny, ale nie wymagany** — NAS/mini-PC z restic/
  rclone robi to samo co B2, plusem pełna kontrola, minusem prąd, dysk,
  aktualizacje i to, że mieszkanie to jedna lokalizacja (pożar/zalanie =
  strata razem z laptopem). Reguła 3-2-1: 3 kopie, 2 nośniki, 1 off-site —
  serwer domowy dobrze gra jako „drugi nośnik", nie jako jedyny backup.
- **Jako failover produkcji („dane przełączają się na inny serwer"): NIE
  rekomendowane.** Strona jest statyczna — najtańszym „failoverem" nie
  jest własny serwer, tylko fakt, że `dist` można w <1 h zdeployować
  u innego dostawcy (Netlify/Vercel/GitHub Pages) i przepiąć DNS. Warunek:
  aktualny eksport strefy DNS (D.2) + kopia mediów (D.2/D.3) + spisana
  procedura. Utrzymywanie ciągle zsynchronizowanego domowego origina to
  koszt i złożoność nieproporcjonalne do wizytówki.
- **Procedura awaryjna (spisać, przećwiczyć raz):** (1) build z repo,
  (2) deploy alternatywny, (3) media: podmiana `public_url`/`imgAt()` na
  lokalizację kopii (lub upload kopii do nowego bucketu), (4) DNS z
  eksportu, (5) formularz: Resend/Turnstile działają niezależnie od
  hostingu — przenieść env vars.

### D.5 Higiena

- **Restore drill** raz na kwartał: odtwórz losowy plik z backupu R2 i
  sprawdź integralność; raz na pół roku przećwicz build+deploy z czystego
  klona (przy okazji przeglądu sekretów z optional-todos).
- Sprzątanie sierot R2 (Sveltia nie kasuje mediów przy usuwaniu wpisu) —
  robić PRZED porównywaniem rozmiarów backupu, żeby kopie nie puchły od
  śmieci.

---

*Kolejny krok po akceptacji: sesja „Etap 0" w nowym katalogu
`~/Projects/delung-web` (bootstrap + wycinanie + parametryzacja), a
równolegle Twoje kroki z Etapu 1 (repo, Pages, domena — z haczykiem
DNSSEC w OVH). Umowa (Etap 7.1) — osobna sesja robocza w dowolnym
momencie.*
