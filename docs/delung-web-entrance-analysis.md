# Analiza wejściowa — delung.pl (strona dla klienta: Delung Meble)

> **Status:** ANALIZA DECYZYJNA (2026-07-29). Dokument powstał w repo
> `hadrianm-web`, ale docelowo przenosi się do katalogu projektu delung —
> dlatego CELOWO nie jest wpisany do `docs/README.md` tego repo.
>
> **Cel:** zebrać w jednym miejscu (1) decyzje już podjęte, (2) architekturę
> docelową, (3) różnice względem hadrianm.pl, (4) otwarte punkty decyzyjne —
> tak, żeby po ich rozstrzygnięciu dało się napisać szczegółową instrukcję
> wykonawczą (`delung-web-creation-process.md`).
>
> **Źródła:** kod i dokumentacja `hadrianm-web` (w szczególności
> `hadrianm-history-from-the-first-commit.md` — rekomendacje §A–E,
> `hosting_second_analysis_sveltia.md`, `additional-architecture-adjustment-admin-client.md`,
> `daily-workflow.md`, `.claude/rules/testing.md`) oraz eksporty designów
> `/Users/mateuszhadrian/Projects/delung-meble/eksport/` (8 widoków HTML +
> README + assets ~142 MB).

---

## 1. Kontekst i cel projektu

- **Klient:** Delung Meble — producent mebli na wymiar (kuchnie, szafy
  i garderoby, łazienki, inne zabudowy).
- **Domena:** `delung.pl` — wolna, do zakupu w OVH (jak `hadrianm.pl`).
- **Charakter strony:** wizytówka firmowa z portfolio realizacji zarządzanym
  przez klienta w panelu CMS (zdjęcia + **filmy** + teksty).
- **Rola projektu dla Ciebie:** pierwszy pełny przebieg „przepisu" z
  hadrianm.pl u klienta — świadomie stosujemy rekomendacje z kroniki
  (`hadrianm-history…` §A–E): ekosystem + guardraile w dniu 1, deploy w dniu 1,
  testy wcześnie, decyzja „podstrony" na starcie (już podjęta — designy są
  podstronami), sekcje po jednej pętlą analiza → implementacja → testy → PR.

## 2. Decyzje podjęte (2026-07-29)

| # | Obszar | Decyzja |
|---|--------|---------|
| 1 | Start kodu | **Kopia hadrianm-web jako szablon** (bez historii git); zostaje infrastruktura, wycinamy treść/sekcje/hero |
| 2 | Języki | **Tylko PL** — bez `/en/`, schemat CMS uproszczony do zwykłych pól (bez `{pl,en}`) |
| 3 | Animacje | **Umiarkowane** (reveal, parallax, ewentualnie punktowe pinned) — BEZ odpowiednika sceny urządzeń hero |
| 4 | `/kategorie` na desktop | **Client-side redirect** → `/oferta/` (matchMedia + `location.replace`) + canonical na `/oferta/` |
| 5 | Dostęp klienta do CMS | **Model A** — dedykowane techniczne konto GitHub (np. `delung-cms`) z write tylko do repo delung; klient loguje się nim w `/admin` |
| 6 | Konta i rozliczenia | **Wszystko na Twoich kontach (managed)**: domena OVH, Cloudflare Pages/R2/Worker; klient płaci abonament utrzymaniowy; kill-switch w umowie |
| 7 | Wideo realizacji | **R2 + MP4 (H.264) + poster WebP**, `preload="none"`; limit rozmiaru klipu i pipeline kompresji; spike uploadu wideo przez Sveltię na starcie |
| 8 | Zakres CMS | **Tylko kolekcja Realizacje** — reszta treści w kodzie |
| 9 | Testy | **Pełna piramida wcześnie** (unit + e2e + visual + LHCI + prod-smoke), baseline'y i budżety mierzone od nowa |
| 10 | Poczta | **OVH Zimbra** `kontakt@delung.pl` (w cenie domeny) + **Resend** na `send.delung.pl` + **Turnstile** (nowe klucze) |
| 11 | Designy | Eksporty w `~/Projects/delung-meble/eksport/` → przy starcie projektu kopiujemy do `docs/design/` nowego repo |
| 12 | Pomiar/monitoring | **Cloudflare Web Analytics + Google Search Console (sitemap) + uptime monitoring** od startu |

## 3. Designy — co wynika z eksportów

Eksporty (`README.txt` + 8 plików HTML, samodzielnych, mobile+desktop w jednym
dokumencie, breakpoint **1024 px**, wzorce 390/1440 px):

| Plik | Route docelowy | Sekcje / uwagi |
|------|----------------|----------------|
| `index.html` | `/` | hero, oferta (zajawka), proces (zajawka), realizacje (zajawka), o nas (zajawka), opinie, kontakt (CTA), footer; bottom sheet (menu/CTA) |
| `oferta.html` | `/oferta/` | desktop: zakładki + panel kategorii; mobile: karuzela 3 kafli + kafel „zobacz pełną ofertę" → `/kategorie/` |
| `kategorie.html` | `/kategorie/` | **tylko mobile** (bez wariantu desktop) — stąd redirect na desktopie |
| `realizacje.html` | `/realizacje/` | szyna filtrów kategorii, siatka kafli, detal realizacji: desktop panel `dt`, mobile bottom sheet; w galerii detalu zdjęcia **i wideo** (badge play + czas) |
| `proces.html` | `/proces-wspolpracy/` | hero + 4 kroki + „efekt" + CTA |
| `o-nas.html` | `/o-nas/` | hero, manifest, zespół (3 portrety), precyzja, opinie |
| `kontakt.html` | `/kontakt/` | hero, karty kontaktu, social, formularz |
| `polityka-prywatnosci.html` | `/polityka-prywatnosci/` | nagłówek + 9 sekcji + CTA |

Model danych realizacji **zaszyty w designie** (tablica `PROJEKTY` w
`realizacje.html`) — to gotowy punkt wyjścia dla schematu CMS:

```js
{ img, pos,                 // okładka + object-position
  tag,                      // kategoria: Kuchnia | Garderoba | Łazienka | Inne
  year, title, desc,
  shots: [{ img, pos, video? }],   // galeria; video → badge play + czas
  specs: [[label, value], …] }     // MATERIAŁY / BLAT / SYSTEMY / ZAKRES / ROK
```

Istotne fakty techniczne z eksportów:

- **Fonty:** Google Fonts — **Archivo** (już self-hostowane w hadrianm),
  **Manrope**, **Cormorant Garamond**. Wszystkie są w fontsource → self-hosting
  jak w hadrianm (lekcja FOUC/LCP), CDN Google wypada.
- **GSAP z CDN** w eksportach → w projekcie zostaje lokalny pakiet (jest już
  w zależnościach).
- **Obrazy:** PNG po kilka MB (sam README to flaguje) → pipeline konwersji do
  WebP + `imgAt()` (transformacje Cloudflare na `media.delung.pl`).
- **Duplikacja danych kategorii** między `oferta.html` i `kategorie.html`
  (dwie kopie tablicy `KATEGORIE`) → w Astro jedna wspólna tablica
  w `src/…/oferta-data.ts` importowana przez oba widoki.
- **Formularz w designie tylko symuluje wysyłkę** → podpinamy sprawdzony
  backend z hadrianm (Pages Function + Resend + Turnstile + antyspam).
- Linki social to `#` → potrzebne prawdziwe adresy od klienta (punkt D6).
- W makiecie lista realizacji jest podwojona (`WSZYSTKIE = PROJEKTY.concat(PROJEKTY)`)
  — na produkcji lista naturalna z kolekcji.

## 4. Co bierzemy z hadrianm-web, co wycinamy, co budujemy od nowa

### 4.1 Zostaje (infrastruktura — największa wartość kopii)

- **Fundament:** Astro 6 static, Tailwind 4, tokeny w `:root`, self-hosted
  fonty + preloady + bramka anty-FOUC, `BaseLayout` (canonical/OG/sitemap,
  prop `smoothScroll`), Lenis (`smooth-scroll.ts` — stałe desktop/touch
  rozdzielone), `bg-crossfade`/pomocniki sekcji wg potrzeb.
- **Chrome podstron:** BackButton (wraz z lekcją o wrapperze), Footer,
  globalny mechanizm „wstecz" (`a[data-back]` → `history.back()`),
  LoadingOverlay (tylko przejścia route!), fix bfcache
  (`pageshow` persisted → `lenis.resize()` + `ScrollTrigger.refresh()`).
- **Nakładki:** `overlay.ts` + `Modal`/`BottomSheet` + `CloseIcon` — dokładnie
  ten wzorzec, którego wymaga detal realizacji i menu mobile delung.
- **UI wspólne:** `SolidButton`/`AnimatedCta` (do adaptacji stylistycznej),
  system toastów, `LowPowerNotice` tylko jeśli będzie potrzebny (bez sceny
  wideo w hero prawdopodobnie zbędny — do weryfikacji, patrz D8).
- **CMS/serwis:** `imgAt()`, wzorzec Content Collections + `content.schema.ts`
  (czysty Zod współdzielony z testem kontraktu), panel Sveltia (przypięta
  wersja, jsDelivr), formularz kontaktowy (`functions/api/kontakt.ts` +
  `contact-form.ts` + warstwy antyspamowe + KV quota).
- **Testy i CI:** cała konfiguracja Playwright/Vitest/axe/LHCI, helpery
  (`assertPreview`, scroll przez Lenisa, freeze.css, sweep), workflowy
  `ci.yml` / `prod-smoke.yml` / `update-visual-baselines.yml`, husky +
  commitlint + lint-staged.
- **Ekosystem Claude Code:** `CLAUDE.md` (przepisany pod delung),
  `settings.json` z blokadami (commit/push, baseline'y, JSON-y CMS, `.env`),
  hooki (guard-realizacje, format-file, remind-tests, stop-typecheck),
  reguły `rules/` i skille (`/test`, `/release-check`, `/new-realizacja`
  po adaptacji; `/verify-mobile` i `/capture-devices` — patrz „wycinamy").

### 4.2 Wycinamy

- **Cała scena hero** (18 plików `sections/hero/`, `LaptopSite`/`PhoneSite`
  „drewelomet", `public/drewelomet/` ~45 assetów, `capture-device-videos`,
  skill `/capture-devices`, fonty `--font-drewelomet-*`, testy hero) —
  hero delung to inny, lżejszy komponent wg `index.html`.
- **Sekcje treściowe hadrianm** (audience/services/about/faq + ich podstrony,
  ekrany LUMÉA, portrety) — delung ma własne widoki.
- **i18n EN:** strony `/en/*`, klucze `en` w słownikach, `localizeProject`,
  hreflang/alternates. Zostaje minimalny słownik PL (albo zwykłe stałe) —
  mechanizm `useTranslations` można zostawić uśpiony, ale prościej wyciąć.
- **Baseline'y wizualne i budżety LHCI** — liczby hadrianm nie mają sensu dla
  delung; harness zostaje, wartości mierzymy od nowa.
- **Treści osobiste:** polityka prywatności (NIP/adres Mateusza — do podmiany
  na dane firmy Delung), obfuskowany mail/telefon, social linki, og-image,
  favicony, `site.webmanifest`.

### 4.3 Budujemy od nowa (wg designów)

- Hero + sekcje strony głównej (zajawki oferta/proces/realizacje/o-nas,
  opinie, CTA kontaktu).
- `/oferta/` (zakładki desktop + karuzela mobile) i `/kategorie/`
  (mobile-only + redirect) ze wspólną tablicą kategorii.
- `/realizacje/`: szyna filtrów po kategorii, siatka, detal
  (Modal desktop / BottomSheet mobile — na szkielecie `overlay.ts`),
  galeria detalu ze zdjęciami i wideo.
- `/proces-wspolpracy/`, `/o-nas/`, `/kontakt/`, `/polityka-prywatnosci/`.
- Menu mobile na bottom sheet (wg wzorca `sheet-*` z eksportów).
- Nowa paleta/tokeny + fonty (Manrope, Cormorant Garamond, Archivo).

## 5. Parametryzacja — miejsca „hadrianm" do podmiany w kopii

Pełna lista z przeglądu kodu (do checklisty w instrukcji):

1. **Domena/URL:** `astro.config.mjs` (`site`), `package.json` (`name`,
   `test:smoke:prod`), `public/robots.txt`, `prod-smoke.yml` (4×),
   `.claude/settings.json` (allow `curl … hadrianm.pl`).
2. **CMS/R2:** `public/admin/config.yml` (repo, `base_url` Workera,
   `account_id`, `access_key_id`, `bucket`, `public_url`, `prefix`),
   `public/admin/index.html` (title), `tests/unit/media-r2.test.ts` (regex
   domeny mediów), URL-e w `src/content/realizacje/*.json`.
3. **Poczta/formularz:** `src/lib/contact-form.ts` (`CONTACT_TO`,
   `CONTACT_FROM_*`, ~20 wystąpień w treściach maili), `contact-ui.ts`
   (obfuskowany mail + telefon), `contact-config.ts` (site key Turnstile).
4. **Branding UI:** `Navbar.astro` (logo ×2), `LoadingOverlay.astro`,
   `Footer.astro` (social + ©), `BaseLayout.astro` (title, `og:site_name`),
   `site.webmanifest`, favicony/og-image w `public/`.
5. **Teksty:** `src/i18n/ui.ts` (~25 kluczy z „hadrianm.pl"), `PolicyPage.astro`
   (NIP, adres, administrator danych).
6. **Skrypty/komentarze:** prefiksy tmp w `scripts/*`, komentarze „decyzja
   Mateusza", `CLAUDE.md` + `.claude/skills/*`, `lighthouserc*.cjs`.

## 6. Architektura CMS dla delung

### 6.1 Schemat kolekcji `realizacje` (propozycja — PL-only, z wideo)

```ts
{
  slug: string,            // nazwa pliku = slug (konwencja Sveltii jak w hadrianm)
  order: number,           // kolejność (mniejsze = wyżej)
  title: string,           // np. "Kuchnia kaszmirowa z podświetlaną witryną"
  category: enum,          // "kuchnie" | "szafy-garderoby" | "lazienki" | "inne"
                           //  (widget select — spójny z szyną filtrów i /oferta)
  year: string,
  description: string,     // desc z designu
  cover: { image: string, position?: string },   // kafel siatki (+ object-position)
  gallery: [                                     // shots z designu
    { image: string, position?: string,
      video?: string,      // URL MP4 w R2 — obecność pola = badge play
      duration?: string }  // "0:24" — opcjonalny opis przy badge
  ],                       // .min(1); image pełni rolę posteru dla wideo
  specs: [ { label: string, value: string } ],   // MATERIAŁY / BLAT / OKUCIA / ZAKRES / ROK
}
```

Zmiany schematu — jak w hadrianm — zawsze w **trzech miejscach naraz**:
`content.schema.ts` + `public/admin/config.yml` + komponenty (reguła
`cms-realizacje.md` przechodzi do nowego repo).

### 6.2 Logowanie klienta (Model A) — osobna „ścieżka auth" per klient

Rekomendacja: **nie współdzielić** Workera auth hadrianm, tylko postawić
komplet dla delung (koszt ~15 min, czysty branding i kill-switch):

1. Konto techniczne GitHub `delung-cms` (Ty zakładasz, Ty trzymasz recovery)
   → collaborator **write** wyłącznie w repo `delung-web`.
2. Nowa GitHub OAuth App „Panel treści — delung.pl" (klient przy logowaniu
   widzi nazwę delung, nie hadrianm).
3. Nowy Worker `sveltia-cms-auth` (drugi deploy z tego samego źródła) z
   sekretami tej aplikacji i `ALLOWED_DOMAINS=delung.pl,localhost`;
   docelowo custom domain `auth.delung.pl`.
4. Klient dostaje login+hasło konta `delung-cms` (+ instrukcję panelu).
   2FA na koncie technicznym — do rozstrzygnięcia sposób (D3).

Kill-switch (umowa!): wstrzymanie deployu Pages, usunięcie domeny z
`ALLOWED_DOMAINS`/wyłączenie Workera, odebranie collaboratora, DNS.

### 6.3 Wideo w R2 — ustalenia i spike

- Bucket `delung-media` + custom domain `media.delung.pl`; zdjęcia przez
  Image Transformations (`imgAt()` jak w hadrianm), **wideo bez transformacji**
  — serwowane wprost z R2 (`<video preload="none" poster=…>`; poster = obraz
  `image` z pozycji galerii przez `imgAt()`).
- **Spike na początku etapu CMS:** czy widget `file` Sveltii wgrywa MP4 do
  biblioteki mediów R2 (gotcha hadrianm: upload działał przez pola **Image**;
  dla wideo trzeba potwierdzić `widget: file` + `accept`). Plan B, gdyby nie
  działał: wideo wgrywasz Ty (wrangler/panel R2), klient wkleja w panelu URL
  (pole string z walidacją prefiksu `https://media.delung.pl/`).
- **Limity/format:** H.264 + AAC, 1080p max, docelowo ≤ ~30 MB / klip
  (klipy w designie to ~20–30 s); R2 free tier 10 GB — przy takich limitach
  duży zapas, a nadwyżka kosztuje grosze (Twoje konto — model managed).
- **Pipeline kompresji** — otwarty punkt D1 (kto przygotowuje pliki).

### 6.4 Gotchas dziedziczone z hadrianm (przechodzą do reguł nowego repo)

- JSON-y kolekcji pisze wyłącznie Sveltia (guard-hook + `.prettierignore`).
- Sveltia **nie kasuje** plików z R2 przy usunięciu wpisu → okresowe
  sprzątanie sierot (przy wideo istotniejsze niż przy zdjęciach).
- Sveltia commituje prosto na `main` z pominięciem PR — jedyny legalny
  wyjątek; konto techniczne musi mieć możliwość pushu (bypass/required
  checks tylko przez PR — jak skonfigurowano w hadrianm).
- Sekretny klucz R2 podaje się w panelu (nie w repo) — klienta trzeba tego
  nauczyć w instrukcji obsługi panelu (albo wgrać mu raz na jego urządzeniu).

## 7. Routing i SEO

- Trasy: `/`, `/oferta/`, `/kategorie/`, `/realizacje/`,
  `/proces-wspolpracy/`, `/o-nas/`, `/kontakt/`, `/polityka-prywatnosci/`
  (nazwy w `src/lib/routes.ts` — jedno źródło prawdy, bez map EN).
- `/kategorie/`: inline skrypt w `<head>` (przed paintem):
  `if (matchMedia('(min-width:1024px)').matches) location.replace('/oferta/')`
  + `<link rel="canonical" href="/oferta/">` — brak duplicate content,
  mobile bez kosztu. Breakpoint 1024 px spójny z designem (uwaga: hadrianm
  używał 760/768 px — dla delung progiem sterują designy, 1024 px wszędzie).
- Sitemap `@astrojs/sitemap` (jest w kopii) + `robots.txt` z `Disallow: /admin`
  → zgłoszenie w Google Search Console po podpięciu domeny.
- OG/ikony/manifest z brandingiem Delung (logo jest w assets eksportu).
- JSON-LD: zamiast FAQPage (hadrianm) — **LocalBusiness/FurnitureStore**
  (nazwa, adres warsztatu, telefon, godziny) na `/kontakt/` — naturalny zysk
  lokalnego SEO dla stolarza (dane od klienta, punkt D6).

## 8. Testy i CI dla delung

- Pełna piramida z kopii; wycinamy specy sekcji hadrianm, piszemy specy per
  widok delung tą samą pętlą co w Fazie 8 hadrianm (analiza → implementacja
  → testy → baseline'y darwin+linux → PR).
- Profile Playwright: te same 6 (chromium-1920/1366, firefox, webkit-SE/14,
  pixel-5) — sprawdzone; breakpoint 1024 oznacza, że iPhone'y i pixel zawsze
  dostają widok mobile, chromium-1366/1920 desktop.
- Baseline'y wizualne: od zera (darwin lokalnie, linux workflowem — kolejność
  kod → linux → darwin na końcu obowiązuje bez zmian).
- LHCI: budżety wystartują z pomiaru pierwszej działającej strony głównej
  i działają jako ratchet; **od początku z zapasem na przyrost sekcji**
  (lekcja §D kroniki — mniej PR-ów „re-baseline").
- Prod-smoke przeciw `https://delung.pl` po każdym deployu + zewnętrzny
  uptime monitor (decyzja #12).
- Wideo na zrzutach — przez maskę (lekcja hadrianm); odtwarzanie wideo
  detalu realizacji funkcjonalnie w e2e.

## 9. Proponowane etapy pracy (szkielet pod instrukcję wykonawczą)

Kolejność wprost z rekomendacji kroniki (§A): guardraile i produkcja
najpierw, sekcje potem.

- **Etap 0 — bootstrap repo (dzień 1):** katalog `~/Projects/delung-web`,
  kopia hadrianm-web bez `.git`, `git init`, wycięcie sekcji/hero/EN/treści
  (lista §4.2), parametryzacja (lista §5), nowy `CLAUDE.md` + reguły + skille,
  design tokens i fonty wg eksportów, kopie eksportów do `docs/design/`.
  Weryfikacja: `pnpm build` zielony, pusta-ale-żywa strona lokalnie.
- **Etap 1 — produkcja „pusta" (dzień 1–2):** repo GitHub `delung-web`,
  Cloudflare Pages, zakup domeny OVH (+ wyłączenie DNSSEC przed delegacją!),
  DNS do Cloudflare, skrzynka OVH Zimbra `kontakt@delung.pl`, placeholder
  online na `delung.pl`.
- **Etap 2 — CMS + media:** bucket R2 + `media.delung.pl` + transformacje,
  konto `delung-cms` + OAuth App + Worker auth, `config.yml` delung,
  schemat kolekcji (§6.1), **spike wideo (§6.3)**, testowe realizacje
  (JSON-y + media wgrane panelem — od razu ścieżką docelową).
- **Etap 3 — testy/CI na szkielecie:** adaptacja speców, required checks
  na main, prod-smoke, pierwsze baseline'y i budżety LHCI.
- **Etap 4 — widoki, po jednym PR:** chrome+nawigacja+menu bottom sheet →
  strona główna → `/oferta/`+`/kategorie/` → `/realizacje/` (+detal
  Modal/BottomSheet, filtry, wideo) → `/proces-wspolpracy/` → `/o-nas/` →
  `/polityka-prywatnosci/`.
- **Etap 5 — formularz kontaktowy:** Resend (`send.delung.pl`), Turnstile,
  KV quota, `/kontakt/`, testy antyspamu.
- **Etap 6 — polish + pomiar:** Web Analytics, Search Console + sitemap,
  uptime monitor, og/ikony, JSON-LD LocalBusiness, przegląd wydajności.
- **Etap 7 — przekazanie:** instrukcja panelu dla klienta (PL, prosta),
  przekazanie skrzynki, umowa (abonament + kill-switch), fizyczny test na
  telefonach (lista rzeczy niewykrywalnych emulacją).

## 10. Punkty decyzyjne — ROZSTRZYGNIĘTE (2026-07-29)

- **D1 — media klienta: wariant (b) — klient wrzuca SAM.** MVP: preset
  HandBrake na komputerze klienta + upload gotowego MP4 w panelu; docelowo
  ewolucja do automatycznej „wrzutni" (auto-przetwarzanie po uploadzie).
  Pełne flow krok po kroku: `delung-web-creation-process.md`, część C.
- **D2 — kategorie (7):** Kuchnie · Szafy i garderoby · Wnętrza komercyjne
  i biura · Dekoracje okienne · Zabudowy łazienkowe · Meble nietypowe · Inne.
  Lista może się jeszcze zmieniać po przeklikaniu strony przez klienta →
  jedno źródło prawdy w kodzie (`src/lib/categories.ts`), dodanie/usunięcie
  = jedna edycja. W szynie filtrów realizacji kategorie bez wpisów są
  **ukrywane** (nie pokazujemy licznika „0").
- **D3 — 2FA konta `delung-cms`:** konfigurowane na telefonie klienta;
  recovery codes w Twoim menedżerze haseł.
- **D4 — dane firmowe:** bierzemy z designów (`kontakt.html`,
  `polityka-prywatnosci.html`) — są już poprawne. **Facebook usunięty**;
  Instagram: `https://www.instagram.com/delung_meble/`.
- **D5 — treści:** wszystkie teksty i zdjęcia z eksportów traktujemy jako
  finalne i zaakceptowane; ewentualne podmiany już na produkcji (adres
  nieupubliczniony do momentu przekazania).
- **D6 — materiały:** screenshoty = materiały testowe; lepsze materiały od
  klienta później, podmiana przez panel. Wszystkie obrazy przechodzą
  optymalizację (WebP, docelowe rozmiary; osobne warianty desktop/mobile
  tam, gdzie trzeba odciążyć mobile) — assets z eksportów służyły tylko
  do designów.
- **D7 — umowa:** najpierw stawiamy całość (budowa portfolio, klient po
  znajomości), umowa równolegle — pomoc w jej przygotowaniu wpisana w
  Etap 7 instrukcji; dźwignie kill-switch (deploy/panel/DNS) pozostają.
- **D8 — brak autoplay wideo** → `LowPowerNotice` + `public/lpm-probe.mp4`
  wycinamy; wideo w detalu realizacji odtwarzane na tap działa też w Low
  Power Mode.

## 11. Ryzyka

- **Spike wideo w Sveltii może wypaść negatywnie** → plan B (URL wklejany
  w panelu) jest gotowy i nie blokuje harmonogramu.
- **Karuzele/snap + bottom sheety na Androidzie** — znane pole minowe;
  dziedziczymy gotowe rozwiązania (`data-lenis-prevent-horizontal`,
  `scroll-snap-stop:always`, overlay.ts) i pełny harness wizualny od Etapu 3,
  więc koszt powinien być ułamkiem hadrianmowego.
- **Assets 142 MB PNG** — bez pipeline'u kompresji budżety LHCI polegną;
  konwersja WebP + R2 wchodzi w Etap 2, zanim powstaną widoki.
- **Konto techniczne = hasło u klienta** — świadoma słabość Modelu A
  (klient teoretycznie widzi kod); mitygacja: minimalne uprawnienia (jedno
  repo), monitoring commitów, w razie potrzeby migracja do Modelu B bez
  zmiany panelu.
- **Współdzielenie konta Cloudflare** (hadrianm + delung na jednym koncie):
  wygodne, ale R2/Workers/Pages mieszają się między projektami — nazewnictwo
  z prefiksem `delung-` wszędzie; ewentualnie osobne konto CF na klientów
  (decyzja niewiążąca, można przenieść później).

---

*Decyzje D1–D8 rozstrzygnięte 2026-07-29. Instrukcja wykonawcza (pełna +
skrócona, kod i kroki poza kodem): `delung-web-creation-process.md`.*
