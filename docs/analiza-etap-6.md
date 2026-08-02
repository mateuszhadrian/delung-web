# Mini-analiza Etapu 6 — SEO, pomiar, polish

Status: **plan do akceptacji** (data: 2026-08-02).
Zakres: 7 punktów Etapu 6 z `docs/delung-web-creation-process.md`
(Część B → „Etap 6 — SEO, pomiar, polish"). Wszystkie 8 widoków stoi na
designie delung, Etapy 0–5 i runda poprawek wizualnych są zamknięte —
ten etap **nie dotyka layoutu żadnej strony**. Wchodzą: komplet ikon
marki, JSON-LD, meta podglądu linków, pomiar (Analytics / Search Console
/ uptime) i weryfikacja na fizycznych telefonach.

Numeracja decyzji: **D-E1 … D-E11** (E = Etap 6).

Decyzje D1–D8 (`delung-web-entrance-analysis.md`) i D-CH5 (antyscraping,
`analiza-chrome-globalny.md`) są zapadłe — ten dokument ich **nie
otwiera**, tylko się do nich stosuje (D-E5).

---

## 1. Stan zastany (co pokazał kod)

**Ikony i podgląd linków**

| Plik | Dziś | Problem |
| ---- | ---- | ------- |
| `public/favicon.svg` | 43 374 B — `<svg viewBox="0 0 64 64">` z **osadzonym WebP w base64** (całe logo z napisem wciśnięte w kwadrat) | zgłoszenie Mateusza: w karcie nieczytelne; do tego 43 kB na ikonę i zero korzyści z formatu wektorowego |
| `public/favicon.ico` | 692 B | pełne logo, ten sam problem czytelności |
| `public/apple-touch-icon.png` | 7 044 B, 180×180, z alfą | iOS nie lubi alfy (podkłada czerń pod ekranem startowym) |
| `public/icon-192.png` / `icon-512.png` | 7 807 B / 34 812 B | pełne logo |
| `public/og-image.png` | 145 093 B, **1200×1200** | kwadrat: FB/X/LinkedIn kadrują po bokach; waga do zbicia (lekcja hadrianm: 649 → 98 kB) |
| `public/site.webmanifest` | 347 B | bez `start_url`, `scope`, `lang`, `description`; ikony bez `purpose` |
| `BaseLayout.astro:59` | komentarz „og-image.png = placeholder z logo Delung (finalny obraz w Etapie 6)" | do zdjęcia razem z podmianą obrazu |
| `BaseLayout.astro:158–161` | `og:image:width/height` = 1200/1200, `twitter:card` = `summary` | po przejściu na 1200×630 oba wpisy do korekty (`summary_large_image`) |

**Źródło znaczka.** `src/assets/logo/delung-logo.webp` (640×186) to całe
logo — znaczka jako osobnego pliku nie ma. W oryginale
`~/Projects/delung-meble/eksport/assets/img/Delung-logo-new-no-background.png`
(2294×667, POZA repo) analiza kanału alfa pokazuje **przerwę na kolumnach
1513–1689**, czyli znaczek to region **x 1689–2294, y 0–590**
(605×591 px, praktycznie kwadrat). Geometria jest prosta i regularna:
prostokąty + łuki ćwierćkola, dwa kolory (zieleń ≈ `#78a878`, szarość
≈ `#606060` / `#888`) na przezroczystym tle.

**JSON-LD.** `grep -rn "application/ld+json" src/` → **zero trafień**.
Strona nie ma dziś żadnych danych strukturalnych.

**Antyscraping (pułapka etapu).** `tests/e2e/contact.spec.ts:350` grepuje
**cały** `dist/` (rozszerzenia `.html .js .mjs .css .json .txt .xml`) na
ciągi `kontakt@delung.pl`, `690291143`, `690 291 143`. Standardowy
`LocalBusiness` z polami `telephone`/`email` wywala ten test w CI
natychmiast — i wywaliłby go **także** wtedy, gdyby JSON-LD wylądował
w osobnym pliku `.json`.

**Punkt odniesienia do pomiaru (build z `main` @ `899814c`)**

| Metryka | Wartość |
| ------- | ------- |
| `dist/index.html` | 126 909 B (gz 17 250) |
| `dist/kontakt/index.html` | 27 965 B (gz 6 509) |
| suma chunków JS w `dist/_astro` | 52 118 B |
| suma plików ikon w `public/` | 238 822 B |

---

## 2. Decyzje

### D-E1. Komplet ikon = SAM ZNACZEK na białym kwadracie

Zgłoszenie Mateusza: w karcie przeglądarki ma być element graficzny bez
napisu „Delung". Tło **białe z ~10% marginesem** (nie przezroczyste, nie
zielone) — decyzja Mateusza. Uzasadnienie: przezroczystość i tak jest
podkładana przez system (iOS zawsze, Android przy maskowaniu), a szara
część znaczka na ciemnym pasku kart traci kontrast; białe tło jest przy
okazji spójne z jasnym motywem strony.

Komplet do wygenerowania:

| Plik | Rozmiar | Uwagi |
| ---- | ------- | ----- |
| `favicon.svg` | wektor | **odrysowany**, nie base64 — cel ≤ 2 kB |
| `favicon.ico` | 16 + 32 + 48 | kontener ICO z payloadem PNG |
| `apple-touch-icon.png` | 180×180 | **bez alfy** (płaskie białe tło) |
| `icon-192.png` / `icon-512.png` | 192 / 512 | manifest, Android |

`favicon.svg` powstaje jako **odrys geometrii** (prostokąty + łuki),
a nie kolejny raster w opakowaniu SVG. Weryfikacja odrysu jest
mierzalna: render SVG do PNG w rozdzielczości oryginału i pixel-diff
z wykadrowanym znaczkiem — **próg ≤ 2% różniących się pikseli**. Jeśli
odrys nie zejdzie poniżej progu, fallback: `favicon.svg` znika z repo
(zostają `.ico` + PNG-i, wszystkie przeglądarki to obsłużą) — ale
**nie** wraca 43 kB base64.

Ryzyko do sprawdzenia okiem przy 16 px: znaczek ma cienkie białe szczeliny
między belkami, które przy tej skali się zlewają. Jeśli w karcie zrobi się
z tego zielono-szara plama — wariant 16 px w `.ico` dostaje pogrubione
szczeliny (osobny, uproszczony rysunek TYLKO dla 16 px). Decyzja po
obejrzeniu pierwszej wersji przez Mateusza.

### D-E2. og-image: pełne logo, kadr 1200×630

Decyzja Mateusza. W podglądzie linku pracuje **nazwa** firmy, nie znaczek
— więc og-image jako jedyny z kompletu zostaje przy pełnym logo (napis
+ znaczek + „producent mebli na wymiar") na jasnym tle. Kadr **1200×630**
(1,91:1) zamiast dzisiejszego kwadratu: taki proporcji oczekują Facebook,
X i LinkedIn; kwadrat one przycinają po bokach.

Konsekwencje w kodzie: `og:image:width/height` → 1200/630,
`twitter:card` → **`summary_large_image`** (przy `summary` X pokaże
miniaturkę-kwadracik i zmarnuje obraz), dochodzi `og:image:alt`.
Cel wagi: **≤ 60 kB** (dziś 145 kB przy większej powierzchni) — PNG
z paletą albo, jeśli nie starczy, PNG 8-bit; formatu WebP dla og-image
świadomie **nie** używamy (część komunikatorów go nie renderuje).

Uwaga testowa: `tests/e2e/seo.spec.ts` asertuje dziś `twitter:card` =
`summary` — asercja idzie w tym samym PR.

### D-E3. Manifest: uzupełnienie, bez zmiany charakteru

`site.webmanifest` zostaje manifestem **strony**, nie aplikacji
(`display: "browser"` bez zmian — nie robimy z delunga PWA). Dochodzą:
`start_url: "/"`, `scope: "/"`, `lang: "pl"`, `description`,
`purpose: "any"` przy ikonach. `theme_color`/`background_color` zostają
białe (jasny motyw, `color-scheme: only light` z 4.1).

Ikony maskowalne (`purpose: "maskable"`) **pomijamy**: bezpieczna strefa
maski to okrąg wpisany w kwadrat, więc znaczek trzeba by dodatkowo
pomniejszyć — przy stronie firmowej (a nie aplikacji instalowanej na
ekran startowy) to praca bez odbiorcy.

### D-E4. JSON-LD `LocalBusiness` BEZ `telephone` i `email` (D-CH5 nietknięty)

Decyzja Mateusza: wariant (a). Na `/kontakt/` ląduje jeden węzeł typu
**`FurnitureStore`** (podtyp `LocalBusiness` — precyzyjniejszy niż
`HomeAndConstructionBusiness` dla producenta mebli) zawierający: `name`,
`legalName`, `address` (`PostalAddress`), `geo`, `url`, `image`, `logo`,
`sameAs`, `openingHoursSpecification`, `foundingDate`, `areaServed`,
`vatID`, `priceRange`.

**Pól `telephone` i `email` nie ma i nie będzie.** Powód: kontrakt D-CH5
(numer i adres nie istnieją w statycznym źródle) jest realną ochroną
skrzynki klienta, a koszt SEO jest bliski zeru — NAP dla Google i tak
płynie z wizytówki firmy, którą `sameAs` spina z tą stroną. Rich Results
Test przechodzi: `telephone` nie jest polem wymaganym.

Wariantu (c) (poluzowanie kontraktu) świadomie nie wybieramy; wariant
(a+) (doklejanie telefonu do JSON-LD w JS) zostaje **opisany jako opcja
na przyszłość**, gdyby okazało się, że Google w Search Console upomina
się o telefon — jest addytywny i nie wymaga wracania do decyzji.

### D-E5. Dane firmy — źródłem prawdy jest strona, nie wizytówka

Komplet ustalony z Mateuszem i wyczytany z repo:

| Pole | Wartość | Skąd |
| ---- | ------- | ---- |
| `name` | Delung Meble | stopka designów |
| `legalName` | Delung Meble Adam Delung | stopka + polityka |
| `address` | Strażacka 27a, 98-300 Gaszyn, PL | stopka + `ContactCards` |
| `geo` | 51.199061, 18.552351 | Mateusz (pinezka z Map Google) |
| `vatID` | PL7312021984 | stopka (`NIP 7312021984`) |
| `foundingDate` | 2014 | `HomeTrust`, `OnasHero`, `onas-content.ts` („OD 2014") |
| `areaServed` | Polska (`Country`) | Mateusz |
| godziny | Pn–Pt 07:00–17:00, Sb 07:00–14:00 (Nd pominięta = zamknięte) | Mateusz (wizytówka Google) |
| `sameAs` | `instagram.com/delung_meble` + wizytówka Google | `Footer`, `ContactSoc`, `opinie.ts` (D-P6) |
| `priceRange` | `$$` | konwencja Google (pole lubiane przez walidator, bez podawania kwot) |

Godziny w JSON-LD opisują **pracownię** i nie kolidują z kaflem
„dostępność telefoniczna 24/7" na `/kontakt/` — to dwie różne rzeczy
(wizyta pod adresem vs telefon). Klient przyjmuje pod adresem, więc
`LocalBusiness` z `geo` jest uprawniony.

**Rozjazd z wizytówką Google jest znany**: wizytówka ma dziś nieaktualne
dane i adres `delungmeble.pl`. Ustalenie Mateusza: to **wizytówka
zostanie dociągnięta do strony**, nie odwrotnie — stąd krok w chmurze
§7.5. Do czasu jego wykonania Google widzi dwa sprzeczne komplety NAP;
to nie blokuje wdrożenia JSON-LD, ale osłabia jego efekt.

### D-E6. Drugi węzeł: `WebSite` + `Organization` na stronie głównej

Decyzja Mateusza (poza literą instrukcji, która mówi tylko o `/kontakt/`).
Na `/` idzie `WebSite` z `publisher: Organization` (nazwa + `logo` +
`sameAs`) — to węzeł, z którego Google bierze nazwę serwisu i logo do
wyników wyszukiwania. Kilkaset bajtów w dokumencie, zero JS.

`SearchAction` (pole wyszukiwania w wynikach) **nie wchodzi** — strona
nie ma wyszukiwarki, a deklarowanie nieistniejącego endpointu to błąd
walidacji.

### D-E7. Miejsce w kodzie: dane w `src/lib/jsonld.ts`, emisja przez komponent

Nowy moduł `src/lib/jsonld.ts` = **jedyne** źródło danych firmy dla
danych strukturalnych (buildery `localBusiness()` i `webSite()`), obok
istniejącego `src/lib/contact-details.ts` (który zostaje wyłącznym
źródłem telefonu i maila — te dwa moduły celowo się **nie znają**).
Moduł jest czystym TS bez zależności, więc wchodzi pod `pnpm test:unit`
(warstwa `src/lib/**` z `.claude/rules/testing.md`).

Emisja: `src/components/seo/JsonLd.astro` —
`<script type="application/ld+json" is:inline set:html={JSON.stringify(data)} />`
wstawiany przez `<Fragment slot="head">` (slot `head` istnieje
w `BaseLayout` od 4.1). Konsumenci: `ContactPage.astro` i `Home.astro`.

Dlaczego nie prop `jsonLd` w `BaseLayout`: dwie strony na osiem nie
uzasadniają rozszerzania interfejsu layoutu, a slot `head` już jest.

### D-E8. Cloudflare Web Analytics = auto-injection w panelu Pages

Rekomendacja przyjęta domyślnie (brak sprzeciwu Mateusza — jeśli wolisz
snippet, to jedna linijka w `BaseLayout` i wracamy do tego przed PR B).
Zero kodu i zero bajtów w repo, beacon wstrzykiwany na krawędzi,
wyłączany jednym przełącznikiem, token nie ląduje w publicznym repo.

Świadoma konsekwencja: beacon **nie istnieje** w lokalnym `dist/`, więc
nie widzą go ani testy e2e/visual, ani LHCI w CI — jego koszt obciąża
wyłącznie produkcję. Dlatego mierzymy go osobno, na `delung.pl`, po
włączeniu (§6, punkt C zlecenia) i raportujemy liczbę razem
z propozycją progów.

### D-E9. Pomiar wpływu — przed/po, na twardych liczbach

Punkt C zlecenia. Mierzone i raportowane:

1. rozmiar `dist/index.html` i `dist/kontakt/index.html` (raw + gz),
2. suma chunków JS w `dist/_astro` (JSON-LD nie powinien jej ruszyć
   ani o bajt — jeśli ruszy, coś poszło do bundla, nie do head),
3. suma plików ikon w `public/`,
4. po włączeniu Analytics: rozmiar beaconu na produkcji + wpływ na
   LCP/TBT z pomiaru Lighthouse przeciw `https://delung.pl`
   (przed/po, ta sama maszyna, mediana z 3 przebiegów).

Jeśli beacon ruszy LCP albo TBT w sposób widoczny ponad szum runnera —
zostanie to powiedziane wprost, razem z rekomendacją (możliwy odwrót do
snippetu z `defer` albo rezygnacja z Analytics na rzecz samego Search
Console).

### D-E10. Zacieśnienie budżetów LHCI — OSOBNY commit, po pomiarze

Decyzja Mateusza: robimy w tym etapie. Tryb bez zmian względem domknięcia
Etapu 4: progi **nie ruszają się** w PR-ach funkcjonalnych; po ich
merge'u zbieram **medianę z 3 przebiegów CI na `main`**, przedstawiam
tabelę „próg dziś → zmierzone → propozycja", i dopiero po akceptacji
powstaje osobny commit z uzasadnieniem w komentarzu przy każdym progu.

Kandydat oczywisty: `script` 80 000 B przy zmierzonych ~19 kB na `/`
(po wyjściu GSAP-a w Etapie 5 nikt progu nie ruszał). Kandydaci
ostrożni: `total`, LCP mobile. Poluzowane celowo **zostają bez zmian**:
desktop `perf` 0,9 i TBT 200 ms oraz mobile TBT 150 / CLS 0,02 — to
podłogi przy zerze i pasmo szumu runnera, nie zapas.

### D-E11. Generator ikon jako skrypt dev-only w repo

Ikony powstają jednym poleceniem `node scripts/make-icons.mjs`
(sharp jest już devDependency), które z `favicon.svg` renderuje komplet
PNG i składa kontener `.ico`. Powód: za pół roku „dorób ikonę 256"
nie może oznaczać odtwarzania z pamięci ciągu ręcznych komend, a
`optimize-images.mjs` robi co innego (PNG → WebP do `src/assets/`).
Skrypt dopisuję do `.claude/rules/capture-scripts.md` (reguła wymienia
skrypty dev-only) i do sekcji „Komendy" w `CLAUDE.md`.

Źródło (`Delung-logo-new-no-background.png`) leży **poza repo**
(`.gitignore` na katalogu eksportu) — skrypt bierze więc za wejście
`public/favicon.svg`, który jest w repo. Kadr znaczka z oryginału
wykonuję jednorazowo, ręcznie, przy odrysie.

---

## 3. Implementacja — pliki

**Nowe**

| Plik | Rola |
| ---- | ---- |
| `scripts/make-icons.mjs` | generator kompletu ikon z `favicon.svg` (D-E11) |
| `src/lib/jsonld.ts` | dane firmy + buildery `localBusiness()` / `webSite()` (D-E5, D-E7) |
| `src/components/seo/JsonLd.astro` | emisja `<script type="application/ld+json">` do `slot="head"` |
| `tests/unit/jsonld.test.ts` | kontrakt danych strukturalnych (w tym brak tel/mail) |

**Zmieniane**

| Plik | Zmiana |
| ---- | ------ |
| `public/favicon.svg` | odrys znaczka (wektor, ≤ 2 kB) zamiast 43 kB base64 |
| `public/favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | regeneracja ze znaczka (D-E1) |
| `public/og-image.png` | pełne logo, 1200×630, ≤ 60 kB (D-E2) |
| `public/site.webmanifest` | `start_url`, `scope`, `lang`, `description`, `purpose` (D-E3) |
| `src/layouts/BaseLayout.astro` | `og:image:width/height` 1200/630, `twitter:card` → `summary_large_image`, `og:image:alt`, aktualizacja komentarza o og-image |
| `src/components/ContactPage.astro` | `<JsonLd>` z `localBusiness()` w `slot="head"` |
| `src/components/Home.astro` | `<JsonLd>` z `webSite()` w `slot="head"` |
| `tests/e2e/seo.spec.ts` | asercje ikon/manifestu + JSON-LD (§4) |
| `.claude/rules/capture-scripts.md`, `CLAUDE.md` | wpis o `make-icons.mjs`, stan etapu |

**Czego NIE ruszamy:** żadnego pliku w `src/components/sections/**`,
`src/scripts/**`, `src/styles/**` ani `functions/**`. Etap 6 nie zmienia
ani jednego piksela renderowanej strony (D-E-baseline, §5).

---

## 4. Testy

**Unit (`tests/unit/jsonld.test.ts`)** — kontrakt danych strukturalnych:

- `localBusiness()` zwraca obiekt z `@context`/`@type` i kompletem pól
  z D-E5 (adres, geo, godziny, `sameAs`, `foundingDate`, `vatID`);
- **`JSON.stringify(localBusiness())` nie zawiera żadnego z ciągów
  `kontakt@delung.pl` / `690291143` / `690 291 143`** — kontrakt D-CH5
  zdublowany w warstwie sekundowej (e2e złapie to samo, ale dopiero po
  buildzie; unit powie o tym w 2 sekundy);
- godziny: 6 wpisów, niedziela nieobecna, format `HH:MM`;
- `webSite()` ma `publisher` z `logo` i `sameAs`;
- adres firmy w JSON-LD zgadza się co do znaku z tekstem stopki
  (jedno źródło prawdy — test porównuje ze stałą, nie z literałem).

**E2E (`tests/e2e/seo.spec.ts`, projekt `chromium-1920`)** — dopisywane:

- `/kontakt/`: dokładnie jeden `script[type="application/ld+json"]`,
  `JSON.parse` przechodzi, `@type === "FurnitureStore"`, adres/geo/godziny
  zgodne z modułem, **brak kluczy `telephone` i `email`**;
- `/`: węzeł `WebSite` z `publisher.@type === "Organization"`;
- ikony i manifest: `/favicon.svg`, `/favicon.ico`, `/apple-touch-icon.png`,
  `/icon-192.png`, `/icon-512.png`, `/og-image.png`, `/site.webmanifest`
  odpowiadają **200 z niepustym ciałem**, a ich zawartość ma właściwe
  **magiczne bajty** (`<svg` / `\x00\x00\x01\x00` / `\x89PNG`) i —
  dla manifestu — parsuje się jako JSON, którego wszystkie `icons[].src`
  też odpowiadają 200. Celowo **nie** asertujemy `Content-Type`: podaje
  go serwer (`astro preview` lokalnie, Cloudflare na produkcji), więc
  byłby to test cudzej konfiguracji, a nie naszego builda;
- `head /`: aktualizacja istniejącej asercji `twitter:card` na
  `summary_large_image` + nowa na `og:image:width/height` 1200/630.

**Bez zmian:** `contact.spec.ts` (grep `dist/`) zostaje **nietknięty** —
i to on jest ostatecznym strażnikiem D-E4. Jeśli JSON-LD kiedykolwiek
dostanie telefon, ten test padnie i o tym właśnie chodzi.

**Smoke (`@prod-smoke`)** — bez zmian. Smoke celowo trzyma ogólne
asercje; sprawność ikon na produkcji weryfikujemy krokami w chmurze
(§7), nie kolejnym testem sieciowym.

Komplet przed PR-em: `format:check`, `lint`, `typecheck`, `test:unit`,
`test:e2e` (6 profili), `build` + `test:visual`.

## 5. Baseline'y wizualne

**Oczekiwanie: ZERO nowych baseline'ów.** Zrzuty w `tests/visual/` łapią
kadr strony — favicon, manifest i JSON-LD nie mają w nim reprezentacji,
a w `BaseLayout` zmieniają się wyłącznie meta w `<head>`.

Jeśli którykolwiek baseline padnie, traktujemy to jako **sygnał błędu,
nie powód do regeneracji**: pokazuję Mateuszowi diff i pytam, zanim
cokolwiek zaktualizuję (zasada twarda z `.claude/rules/testing.md`).

## 6. Pomiar (punkt C zlecenia)

Punkt odniesienia z `main` @ `899814c` jest w §1. Po każdym PR-ze
raportuję tę samą tabelę + deltę. Prognoza (do zweryfikowania liczbami):

| Pozycja | Przed | Prognoza po | Skąd |
| ------- | ----- | ----------- | ---- |
| `dist/kontakt/index.html` | 27 965 B | +700…900 B raw (+~250 B gz) | JSON-LD `LocalBusiness` |
| `dist/index.html` | 126 909 B | +350…500 B raw | `WebSite` + `Organization` |
| JS w `_astro` | 52 118 B | **bez zmian** | JSON-LD nie idzie do bundla |
| pliki ikon razem | 238 822 B | ~90…110 kB | favicon.svg 43 kB → ≤ 2 kB, og-image 145 kB → ≤ 60 kB |

Beacon Analytics mierzony osobno na produkcji (D-E8) — to jedyna
pozycja, która może ruszyć LCP/TBT, i jedyna niewidoczna dla CI.

## 7. Kroki w chmurze (klika Mateusz) — kolejność

Dokładne kliki podam w czacie przy każdym kroku; tu kolejność i warunek
wejścia:

1. **Cloudflare Web Analytics** (po merge'u PR A) — Cloudflare → Workers
   & Pages → `delung-web` → Settings → Web Analytics → Enable.
   Weryfikacja: po ~15 min w zakładce Web Analytics widać własne wejście.
2. **Rich Results Test** (po merge'u PR B, po deployu) — walidacja
   `https://delung.pl/kontakt/` i `https://delung.pl/`. Warunek zaliczenia:
   wykryty typ `LocalBusiness`/`FurnitureStore`, **zero błędów**;
   ostrzeżenia o brakującym `telephone` są oczekiwane i akceptowane (D-E4).
3. **Google Search Console** — property **domenowa** `delung.pl`
   (weryfikacja rekordem TXT w Cloudflare DNS) → Sitemaps → submit
   `https://delung.pl/sitemap-index.xml`. Property domenowa, nie
   prefiksowa: obejmuje `www` i oba protokoły za jednym razem.
4. **UptimeRobot** — monitor HTTPS `https://delung.pl`, interwał 5 min,
   alert na mail Mateusza. Uzupełnia `prod-smoke.yml`, który patrzy
   wyłącznie w moment po deployu.
5. **Wizytówka Google (NAP)** — dociągnięcie danych do strony (D-E5):
   adres strony `delungmeble.pl` → `delung.pl`, nazwa, adres, godziny
   Pn–Pt 07:00–17:00 / Sb 07:00–14:00. Krok świadomie **po** JSON-LD,
   żeby przepisywać z jednego, aktualnego źródła.

## 8. Fizyczny test na telefonach (punkt 6 instrukcji)

Emulacja nie łapie: limitu warstwy GPU Androida, iOS Low Power Mode,
zwijanego toolbara Safari, zimnego cache i realnego łącza, fizycznego
dotyku. Checklistę (co otworzyć, na co patrzeć, co jest błędem) przekazuję
Mateuszowi osobno w czacie, w rozbiciu na: **ikony i podgląd linków**
(nowość tego etapu — ekran startowy iOS/Android, podgląd linku
w iMessage/WhatsApp/Messengerze), **karuzele i sheety**, **wideo
w realizacjach przy Low Power Mode**, **sticky navbar przy zwijanym
toolbarze**, **formularz na zimnym cache**. Checklista wraca odhaczona
i jest częścią definition of done.

## 9. Podział na PR-y

| PR | Zawartość | Ryzyko |
| -- | --------- | ------ |
| **A — brand** | ikony (D-E1), og-image (D-E2), manifest (D-E3), `BaseLayout` (meta), `scripts/make-icons.mjs` (D-E11), asercje ikon + `twitter:card` w `seo.spec.ts` | niskie; jedyny punkt uwagi to czytelność znaczka przy 16 px |
| **B — dane strukturalne** | `src/lib/jsonld.ts`, `components/seo/JsonLd.astro`, wpięcie w `/kontakt/` i `/`, `tests/unit/jsonld.test.ts`, asercje JSON-LD w `seo.spec.ts` | niskie; strażnikiem D-CH5 jest istniejący grep `dist/` |
| **C — budżety LHCI** (warunkowy) | wyłącznie progi w `lighthouserc*.cjs` + komentarze z uzasadnieniem | osobny commit, dopiero po pomiarze i akceptacji liczb (D-E10) |

Kroki w chmurze przeplatają się z PR-ami wg kolejności z §7.

## 10. Definition of done Etapu 6

- [ ] `docs/analiza-etap-6.md` + wpis w `docs/README.md`
- [ ] zielone lokalnie: `format:check`, `lint`, `typecheck`, `test:unit`,
      `test:e2e` (6 profili), `build` + `test:visual`
- [ ] zero nowych wpisów w allowliście axe; zero nowych baseline'ów
- [ ] PR A i PR B zielone na `quality` + `e2e` + `lighthouse`, po merge'u
      `prod-smoke` zielony
- [ ] kroki w chmurze §7 potwierdzone przez Mateusza (Analytics, Rich
      Results Test, Search Console + sitemapa, UptimeRobot, wizytówka)
- [ ] checklista telefonów (§8) przekazana i odhaczona
- [ ] pomiar przed/po (§6) zaraportowany, decyzja o PR C podjęta
- [ ] `/release-check` przed ogłoszeniem strony klientowi
- [ ] `CLAUDE.md` zaktualizowane (Etap 6 wykonany + numery PR-ów)
