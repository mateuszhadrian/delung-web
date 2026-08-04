# Analiza refaktoru (po rundzie poprawek 3, przed Etapem 7)

Status: **DO AKCEPTACJI** (2026-08-04). Zakres: audyt całego kodu przed
przekazaniem klientowi — bez zmiany zachowania i bez zmiany wyglądu.
Numeracja decyzji: **R1 … R21** (R = refactor).

Ten dokument jest **samowystarczalny**: da się go wykonać w świeżej sesji
bez dostępu do rozmowy, w której powstał. Każde znalezisko niesie plik,
linię, pomiar i konsekwencję.

---

## 0. Kontrakt tego refaktoru

**Definicja „refaktoru" w tym projekcie** (ustalona przed audytem):

- **Zero zmian zachowania i zero zmian wyglądu.** 434 pliki baseline'ów
  wizualnych (203 zrzuty × 2 platformy, 6 profili) i 541 testów e2e są
  **siatką bezpieczeństwa**, nie materiałem do regeneracji. Czerwony
  baseline = sygnał błędu, nie zadanie „zaktualizuj zrzuty".
- **Pokrycie testami nie maleje.** Kasujesz kod — kasujesz jego testy;
  przenosisz kod — testy idą za nim.
- **Bajty nie rosną.** Stan zmierzony w CI na `main` (dwa zielone
  przebiegi, runy 30909810628 i 30911240907): script **13 659 B** (budżet
  20 000), total mobile **811 389 B** (budżet 860 000 — najciaśniejszy
  zapas, ~6 %), total desktop **1 514 451 B** (budżet 1 580 000).
- **Priorytet nadrzędny: utrzymywalność**, nie bajty. Skrypty są dziś
  32 % pod progiem, więc oszczędność transferu nie ma praktycznej
  wartości; ryzyko Etapu 7 leży w zrozumiałości kodu dla kogoś, kto wejdzie
  w projekt bez kontekstu trzech rund poprawek.

**Zakres audytu:** `src/`, `functions/`, `tests/`, `scripts/`.
Poza zakresem: konfiguracja narzędzi, `docs/design/` (eksporty referencyjne),
`src/content/realizacje/` (pisze je Sveltia CMS — edycja zabroniona).

---

## 1. Metoda — skąd wzięte liczby

Nic w tym dokumencie nie jest oceną „na oko". Źródła:

1. **`pnpm dlx knip`** (uruchomiony bez dodawania zależności do
   `package.json`) — lista kandydatów na martwy kod. **Każdy kandydat
   zweryfikowany ręcznie**, bo narzędzie ma w tym projekcie dwie ślepe
   plamy: pliki `.astro` i pliki wołane z CLI.
   - Przykład fałszywego trafienia, który to potwierdza:
     `eslint-plugin-jsx-a11y` zgłoszony jako nieużywana zależność, a jest
     używany **pośrednio** przez `astro.configs["jsx-a11y-recommended"]`
     (`eslint.config.mjs:12`) — co odnotowuje już komentarz w linii 6–7
     tego pliku. **Nie kasować.**
   - Analogicznie fałszywe: `functions/api/kontakt.ts` (Pages Function —
     kontrakt runtime'owy Cloudflare, nie import), `lighthouserc*.cjs`
     i `scripts/*.mjs` (wołane z CLI / CI).
2. **`grep`/`rg` po całym repo** — liczby użyć tokenów, stałych, klas.
3. **`pnpm build`** — bajty w `dist/_astro/` (build zielony, wykonany
   przed spisaniem dokumentu).
4. **Skan zasobów** — każdy plik z `src/assets/` sprawdzony pod kątem
   konsumenta.

**Wynik skanu zasobów: zero martwych plików graficznych.** To czysty
rachunek — `src/assets/` nie wymaga sprzątania.

---

## 2. Strefy no-go (nie ruszamy, choćby kusiło)

Wypisane jawnie, żeby nie wracały w kolejnych sesjach jako „pomysł na
uproszczenie". Każda jest odpowiedzią na konkretny, zmierzony problem:

| Obszar | Dlaczego nietykalny |
| --- | --- |
| **Bramka fontu hero** `html.hero-wait` (`HomeHero.astro`) | D-T1. Skrypt `is:inline` musi stać PRZED markupem hero (klasa przed pierwszym paintem) i PO arkuszach (inaczej `@font-face` nie istnieje i `document.fonts.load` rozstrzyga się natychmiast). Sygnałem jest `document.fonts.load`, **nigdy** `document.fonts.ready`. Kosztowało jedną rundę pomiarową |
| **Konstrukcja hero** (typografia SVG, maska liter, poświata, `pan`, Ken Burns) | D-Q1. 15 wariantów zmierzonych na fizycznym Macu — żadna zmiana po stronie hero nie pomagała. Zostaje 1:1 z eksportu |
| **Scroll natywny** (brak wygładzacza) | D-Q1. Wróci wygładzacz — wróci klatkowanie hero w Safari |
| **Duplikaty markupu per breakpoint** (Etap 4.5, karta CTA 4.3, pigułka social 5) | Świadomy wzorzec zamiast relokacji JS-em. Ujednolicenie = powrót do `relocate()`, czyli cofnięcie decyzji |
| **Rampy `cqh` i `container-type` w scenie realizacji** (`HomeRealizacje.astro`) | D-T3. Przeniesienie kontenera zapytań zmienia rampy z reaktywnych na proaktywne i **odwraca kolejność kurczenia** — złapał to dopiero test z poprzedniej rundy |
| **`overlay.ts`** (blokada scrolla `body{position:fixed}` + `window.scrollTo`) | Jedyna ścieżka, bez gałęzi alternatywnej. Dotyka wszystkich nakładek w serwisie |
| **`scroll-snap-stop: always`** na torach karuzel | Bez tego szybki swipe przeskakuje kilka kafli |
| **Antyscraping D-CH5** | Telefon i e-mail nie mogą istnieć w statycznym źródle; test grepuje CAŁY katalog `dist` |

---

## 3. Powtórzenia i ujednolicenie

### R1. Wspólny moduł ruchu — 5 kopii tego samego kodu · **priorytet: WYSOKI**

**Stan zastany (pomiar).** Pięć modułów ruchu, razem 469 linii:

| Plik | Linii |
| --- | --- |
| `src/components/sections/o-nas/onas-motion.ts` | 161 |
| `src/components/sections/proces/proces-motion.ts` | 102 |
| `src/components/sections/work/work-motion.ts` | 74 |
| `src/components/sections/oferta/oferta-motion.ts` | 67 |
| `src/components/sections/contact/contact-motion.ts` | 65 |

Powtórzone **dosłownie** (różnice wyłącznie w komentarzach):

1. **Blok revealów `[data-rev]`** — `IntersectionObserver` z
   `rootMargin: "0px 0px -10% 0px"`, `threshold: 0.01`, warunkiem
   `if (!e.isIntersecting && e.boundingClientRect.bottom > 0) continue`
   i pętlą dosłaniającą pierwszy ekran. **Identyczny w 5 z 5 modułów**
   (~20 linii × 5 = ~100 linii).
   Lokalizacje: `contact-motion.ts:15–34`, `oferta-motion.ts:14–35`,
   `proces-motion.ts:16–35`, `onas-motion.ts:20–39`, `work-motion.ts:17–35`.
2. **Blok parallaxu `[data-par]`** — funkcja `parPaint()` z odczytem
   `data-par` (domyślnie `0.1`) i `data-par-scale`. **Identyczny w 4 z 5**
   (`work-motion.ts` ma własny wariant kafli `[data-tilepar]`).
   Lokalizacje: `contact-motion.ts:37–52`, `oferta-motion.ts:38–53`,
   `proces-motion.ts:38–53`, `onas-motion.ts:42–57` (~16 linii × 4 = ~64).
3. **Helpery** `qa`, `q`, `clamp01`, `pad` — kopiowane 5×.
4. **Pętla rysowania** `let raf = 0; function tick() {…}` + rejestracja
   `scroll`/`resize` — kopiowana 5×.

Razem **około 220 z 469 linii to kopie** (~47 %).

**Dowód, że to kopiuj-wklej, a nie zbieżność:** komentarze wskazują na
siebie w kółko — `oferta-motion.ts:37` mówi „wzorzec home-scroll",
`contact-motion.ts:37` „wzorzec proces-motion", `proces-motion.ts:37`
i `onas-motion.ts:41` „wzorzec oferta-motion". Cztery pliki przypisują
autorstwo tego samego bloku czterem różnym miejscom.

**Rekomendacja.** Nowy moduł `src/components/sections/motion-common.ts`
(albo `src/scripts/motion.ts`) eksportujący:

- `initReveals()` — blok 1, bez parametrów (wszystkie kopie identyczne),
- `initParallax()` — blok 2, zwracający funkcję malującą do pętli,
- `qa`, `q`, `clamp01`, `pad`,
- `rafLoop(paint: () => void)` — pętla + rejestracja zdarzeń.

Każdy `*-motion.ts` zostaje przy swojej **specyfice** (swap kroków,
manifest słowo-po-słowie, tor zespołu, parallax kafli) i chudnie do niej.

**Wpływ:** −~220 linii, jedno miejsce na poprawkę zamiast pięciu. Dziś
poprawka w mechanice revealów wymaga pamiętania o pięciu plikach — nikt
tego nie wymusza żadnym testem.

**⚠️ Warunek konieczny — pomiar bajtów przed merge'em.** Moduły ruchu są
ładowane **dynamicznie, po jednym na stronę**. Wspólny moduł zmieni układ
chunków: Vite albo wstawi wspólny kod do każdego chunku (bajty bez zmian),
albo wydzieli osobny chunk (drugie żądanie sieciowe na stronę). Stan
wyjściowy do porównania (`dist/_astro/`, raw):

```
onas-motion    2 429 B      work-motion    1 058 B
proces-motion  1 581 B      oferta-motion    946 B
                            contact-motion   934 B      RAZEM 6 948 B
```

Jeśli po zmianie suma wzrośnie albo pojawi się dodatkowy chunk na każdej
trasie — **cofnąć i zostawić duplikację**, opisując wynik w tym dokumencie.
Utrzymywalność jest priorytetem, ale nie kosztem budżetu, który sami
zacieśniliśmy dwa tygodnie temu.

**Pracochłonność:** średnia (~2 h + pełna bramka). **Ryzyko wizualne:**
niskie w teorii (ta sama mechanika), ale realne — moduły ruchu sterują
`opacity` i `transform`, a testy wizualne robią zrzuty po `freeze.css`.
Wymaga pełnego `test:visual` przed PR-em.

---

### R2. Bramka `js-motion` zduplikowana w sześciu wrapperach stron · **priorytet: WYSOKI**

**Stan zastany.** Każdy wrapper widoku niesie **własną kopię** tego samego
skryptu inline i tego samego bloku CSS:

```js
if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  document.documentElement.classList.add("js-motion");
}
```

Lokalizacje skryptu: `Home.astro:58–62`, `OfertaPage.astro:23–27`,
`ProcesPage.astro:22–28`, `OnasPage.astro:23–29`, `ContactPage.astro`,
`KategoriePage.astro`.

Do tego **bajt-w-bajt identyczny blok CSS** stanu startowego revealów
(sprawdzone porównaniem czterech plików):

```css
html.js-motion [data-rev] { opacity: 0; transform: translateY(22px);
  transition: opacity 0.7s ease,
              transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1); }
html.js-motion [data-rev].rv-in { opacity: 1; transform: none; }
html.js-motion [data-rev="soft"],
html.js-motion [data-rev="soft"].rv-in { transform: none; … }
```

Lokalizacje: `OnasPage.astro:49–63`, `OfertaPage.astro:49–63`,
`ProcesPage.astro`, `ContactPage.astro`, `Home.astro:90–104`.

**Rekomendacja.** Jeden komponent `src/components/MotionGate.astro`
niosący skrypt `is:inline` **i** blok `<style is:global>`; wrappery
renderują `<MotionGate />` w tym samym miejscu, w którym dziś mają kopię.

**Uwaga wykonawcza — kolejność ma znaczenie.** Skrypt musi zostać
`is:inline` i musi trafić w to samo miejsce dokumentu (klasa **przed
pierwszym paintem** — inaczej reveale mrugną). Astro nie gwarantuje
kolejności wstrzykiwania stylów między komponentami, więc po zmianie
**sprawdź kolejność reguł w wygenerowanym CSS**, nie tylko wygląd.
Wariant ostrożniejszy: przenieść sam blok CSS do `global.css` pod klasą
`html.js-motion` (jest już globalny — `is:global`), a w komponencie
zostawić wyłącznie skrypt.

**Wpływ:** −~90 linii, jedno miejsce definicji ruchu wejściowego.
**Pracochłonność:** mała (~45 min). **Ryzyko wizualne:** średnie —
dotyka CSS-a obecnego na sześciu trasach; wymaga pełnego `test:visual`.

---

### R3. Redundantny fallback fontu — 161 wystąpień · **priorytet: NISKI**

**Stan zastany.** `font-family: var(--font-display), sans-serif;` występuje
**161 razy**, a `var(--font-body), sans-serif` — 42 razy. Tymczasem token
już niesie własny łańcuch zastępczy (`src/styles/global.css:14–15`):

```css
--font-display: "Archivo Variable", system-ui, Arial, sans-serif;
--font-body: "Manrope Variable", system-ui, Arial, sans-serif;
```

Doklejane `, sans-serif` jest więc **martwym ogonem** — nigdy nie zostanie
osiągnięte, bo `sans-serif` z tokenu wypada wcześniej.

**Rekomendacja.** Nie jest to błąd i nie zmienia renderowania. Wchodzi
**wyłącznie** jako mechaniczna zamiana `sed` przy okazji innej pracy w tym
samym pliku — **nie jako osobny PR na 200 plikozmian**. Zysk to ~3,4 kB
źródeł i mniej szumu; zysk w `dist` bliski zeru (kompresja).

**Pracochłonność:** mała. **Ryzyko wizualne:** teoretycznie zerowe,
praktycznie — to 203 zrzuty na szali za kosmetykę. **Dlatego niski
priorytet i tylko przy okazji.**

---

### R4. Wzorzec „kicker" powielony w 12 klasach · **priorytet: ŚREDNI (ale patrz zastrzeżenie)**

**Stan zastany.** Kicker (mała, rozstrzelona etykieta nad nagłówkiem) ma
w projekcie **12 osobnych klas** z niemal identyczną deklaracją:
`.hero-kick` (8 wystąpień), `.re-kick` (4), `.pp-kick` (3), `.kt-kick` (3),
`.team-kick` (2), `.prec-kick` (2), `.pr-kick` (2), `.of-kick` (2),
`.cta-kick` (2), `.manifest-kick`, `.efekt-kick`, `.dt-kick`.

Trzon powtarzany za każdym razem (np. `HomeRealizacje.astro:630–636`,
`WorkDetail.astro:329–335`, `ProcesEfekt.astro:63–64`):

```css
font-family: var(--font-display), sans-serif;
font-weight: 500;  font-size: 11px;  line-height: 1;
letter-spacing: 0.2em;  text-transform: uppercase;
```

Różnią się **kolorem** (`#fff` / `var(--faint)` / `var(--accent-ink)`),
czasem `font-size` (`clamp(10px, 2.82vw, 12px)` w `OfertaProcesCta.astro:81`)
i marginesem.

**Zastrzeżenie, które przesądza o ostrożności.** Style w `.astro` są
**scope'owane per komponent**. Wyciągnięcie wspólnej klasy do `global.css`
zmienia **specyficzność i kolejność kaskady** — a to jest dokładnie ta
klasa zmiany, która w rundzie 2 i 3 dwukrotnie wywracała testy wizualne
o ułamek piksela. Do tego kickery są elementem **kontrastu pod ratchet axe**
(`--accent-ink`, `--faint` dobrane pod AA 4.5:1) — nieuważne scalenie może
podmienić kolor.

**Rekomendacja.** Wariant **bezpieczny**: nie tworzyć globalnej klasy,
tylko dodać do `global.css` token typograficzny opisujący sam trzon,
np.:

```css
--kick: 500 11px/1 var(--font-display), sans-serif;  /* font shorthand */
--kick-ls: 0.2em;
```

i podmienić trzon w 12 miejscach, zostawiając kolory i marginesy lokalnie.
Zysk w czytelności jest, a kaskada zostaje nietknięta.

**Wpływ:** ~60 linii mniej, jedno miejsce na zmianę kroju kickerów.
**Pracochłonność:** średnia. **Ryzyko wizualne:** średnie — **każdy** z 12
punktów wymaga sprawdzenia zrzutem, bo `font` shorthand resetuje właściwości,
których długa forma nie ruszała (m.in. `font-style`, `font-variant`).
Jeśli po pierwszych trzech podmianach pojawi się jakikolwiek diff —
**przerwać i zostawić stan obecny**.

---

### R5. Pięć stałych `*_DESKTOP_MIN_PX` o tej samej wartości — **NIE scalać** · **priorytet: dokumentacyjny**

**Stan zastany.** Siedem plików konfiguracyjnych, każdy z własną stałą
równą `1024`: `nav-config.ts`, `home-config.ts`, `oferta-config.ts`,
`work-config.ts`, `contact-config.ts`, `onas-config.ts`, `proces-config.ts`.

**Rekomendacja: zostawić rozdzielność.** To wygląda na powtórzenie, a jest
zabezpieczeniem: jedna wspólna stała pozwoliłaby zmienić próg **siedmiu
widoków naraz jednym znakiem**, a `@media` w plikach `.astro` i tak trzeba
utrzymywać ręcznie w parze (CSS nie zaimportuje stałej). Rozdzielone stałe
wymuszają świadomą decyzję per widok.

**Ale kontrakt jest dziś częściowo fikcyjny — patrz R14.**

---

## 4. Struktura plików

### R6. Duże pliki `.astro` — **w większości NIE dzielić** · **priorytet: informacyjny**

**Stan zastany.** Dwanaście plików powyżej 400 linii:

| Plik | Linii | Z czego `<style>` |
| --- | --- | --- |
| `navbar/Navbar.astro` | 835 | 163–746 (**583**) |
| `sections/oferta/OfertaSection.astro` | 815 | 220–815 (**595**) |
| `sections/home/HomeHero.astro` | 777 | — |
| `sections/work/WorkDetail.astro` | 732 | 186–732 (**546**) |
| `WorkIndexPage.astro` | 681 | 289–681 (**392**) |
| `sections/home/HomeRealizacje.astro` | 680 | — |
| `PolicyPage.astro` | 654 | — |
| `sections/work/WorkDetailOverlay.astro` | 591 | — |
| `sections/contact/ContactForm.astro` | 560 | — |

**Wniosek z pomiaru: to nie jest problem złożoności logicznej, tylko
objętości CSS.** W czterech największych plikach blok `<style>` to 55–73 %
zawartości. Markup i frontmatter są krótkie (np. `Navbar.astro`:
frontmatter 1–42, markup 42–163 — 121 linii na cały chrome globalny).

Pliki są przy tym **czytelnie posekcjonowane** komentarzami-separatorami
(`/* ── pasek ── */`, `/* ════ DESKTOP ≥1024 ════ */`) — nawigacja po nich
działa.

**Rekomendacja: nie rozbijać.** Wyciągnięcie CSS-a z komponentu `.astro`
oznacza utratę **scope'owania** (Astro dodaje unikalny atrybut do
selektorów komponentu). Plik zewnętrzny musiałby albo być `is:global`
(kolizje nazw klas między sekcjami — `.re-kick` vs `.pr-kick` przestają
być odseparowane), albo dublować selektory. **Koszt: realne ryzyko
regresji wizualnej na 203 zrzutach. Zysk: kosmetyczny.** To zły stosunek
w projekcie, który jutro idzie do klienta.

**Jedyny wyjątek wart rozważenia — `Navbar.astro` (R7).**

---

### R7. `Navbar.astro` niesie dwa niezależne byty · **priorytet: ŚREDNI**

**Stan zastany.** Plik zawiera dwa mechanizmy, które nie mają ze sobą nic
wspólnego poza sąsiedztwem w DOM:

1. **pasek** (linie 164–212 CSS + wygładzanie `--p` pętlą rAF w skrypcie
   748–835),
2. **bottom sheet menu mobilnego** (283–464 CSS + obsługa gestów) —
   nakładka na `overlay.ts`, żyjąca wyłącznie poniżej 1024 px.

**Rekomendacja.** Wydzielić sheet do `src/components/navbar/NavSheet.astro`
(markup + jego CSS + jego skrypt), zostawiając w `Navbar.astro` pasek
i renderowanie `<NavSheet />`.

**Warunek:** sheet musi zostać renderowany **w tym samym miejscu DOM**
(jest `position: fixed`, ale kolejność wpływa na stacking context) i musi
zachować import `kat-sheets`/`overlay` w tej samej kolejności.

**Wpływ:** 835 → ~500 + ~330 linii, dwie odpowiedzialności rozdzielone.
**Pracochłonność:** średnia (~1,5 h). **Ryzyko wizualne:** średnie —
`chrome-bar` i menu mają własne baseline'y na 6 profilach.
**Kandydat na ostatni PR serii** (najwyższe ryzyko w tym zestawie).

---

### R8. Niespójne umiejscowienie wrapperów widoków · **priorytet: NISKI**

**Stan zastany.** Widoki mają dwa różne wzorce bez uzasadnienia:

- **wrapper cienki + katalog sekcji**: `OfertaPage.astro` (74 linie) +
  `sections/oferta/*`; tak samo `ProcesPage` (70), `OnasPage` (72),
  `ContactPage` (96), `Home.astro` (113), `KategoriePage` (87);
- **wrapper gruby, bez katalogu sekcji**: `WorkIndexPage.astro` (**681**)
  i `PolicyPage.astro` (**654**) — całe widoki w jednym pliku
  w `src/components/`, mimo że `sections/work/` istnieje.

Do tego niespójność nazw: `Home.astro` vs `OfertaPage.astro` /
`OnasPage.astro` — ten sam byt, dwie konwencje.

**Rekomendacja.** **Nie przenosić plików w tym refaktorze.** Przeniesienie
`WorkIndexPage.astro` do `sections/work/` zmienia ścieżki importów w
`src/pages/realizacje.astro` i potencjalnie w testach; `PolicyPage.astro`
to dokument prawny z treścią inline (świadoma decyzja 4.5). Zysk czysto
porządkowy, koszt — dotknięcie dwóch największych widoków.

**Co zrobić zamiast:** dopisać do `CLAUDE.md` (mapa projektu) jedno zdanie
wyjaśniające, dlaczego te dwa widoki nie mają katalogu sekcji. Kosztuje
minutę i usuwa całe zdziwienie następnej osoby.

---

## 5. Nieużywany kod

To najbezpieczniejsza kategoria — i najbardziej opłacalna przed
przekazaniem. **Wszystkie pozycje zweryfikowane ręcznie.**

### R9. Trzy martwe tokeny w `global.css` · **priorytet: WYSOKI, ryzyko: ZEROWE**

Zmierzone `grep`-em po całym `src/` i `tests/` — **zero konsumentów**:

| Token | Linia | Uwaga |
| --- | --- | --- |
| `--accent-gradient` | `global.css:65` | `linear-gradient(105deg, …)` — pozostałość szablonu |
| `--accent-gold-rgb` | `global.css:69` | `242, 169, 12` |
| `--section-gap` | `global.css:73` | `clamp(56px, 7vw, 96px)` + 2 linie komentarza opisującego mechanizm, którego nikt nie używa |

**Rekomendacja: skasować wraz z komentarzami.** Token bez konsumenta jest
gorszy niż jego brak — sugeruje istnienie systemu, którego nie ma
(następna osoba doda `--section-gap` do sekcji i zdziwi się, że nic nie
łączy go z resztą).

**Uwaga na dwa pokrewne, których NIE kasujemy:** `--line` (`global.css`)
i `--accent-gold` mają po **jednym** konsumencie — `ui/BackButton.astro`,
komponent świadomie zachowany (D-CH8, patrz R12). Skasowanie tokenów
zepsułoby plik, który ma przetrwać.

---

### R10. Martwe helpery testów opisujące nieistniejące widoki · **priorytet: WYSOKI, ryzyko: ZEROWE**

**Stan zastany.** `tests/helpers/visual.ts` i `scroll.ts` niosą kod
przeniesiony z szablonu hadrianm-web, który **odwołuje się do sekcji i tras,
których w delung nigdy nie było**:

| Funkcja | Linie | Dlaczego martwa |
| --- | --- | --- |
| `snappedSectionSweep` | `visual.ts:73–133` (**61 linii**) | Sweepuje sekcje `about`/`audience` i podstronę **`/dla-kogo/`** — w delung nie istnieją. Zero konsumentów |
| `sectionAnchors` | `visual.ts:136–166` (**31 linii**) | Kotwice dla sekcji `faq`/`services` (nie istnieją), komentarz mówi o „zmianach długości treści (PL/EN)" — projekt jest PL-only |
| `heroScrollRange` | `scroll.ts:85–98` | Zero konsumentów |

Razem **~105 linii martwego kodu w plikach, które są siatką bezpieczeństwa
refaktoru**. To szczególnie kosztowne: ktoś czytający helper, żeby
zrozumieć, jak testować, trafia najpierw na mechanikę snapa GSAP-a, której
w projekcie nie ma.

**Rekomendacja: skasować wszystkie trzy.** Sprawdzone: żaden spec ich nie
importuje (konsumenci helperów to wyłącznie `usePreviewGuard`,
`useChromium1920Only`, `collectPageIssues`, `prepareSweep`, `gotoReady`,
`settle`, `scrollPageTo`, `scrollPageToStable`, `SWEEP_PROJECTS`).

**Konsekwencja:** po kasacji `scrollPageToStable` zostaje jedynym
konsumentem prywatnego `scrollPageToSmooth` — to w porządku, ale sprawdź,
czy `MOBILE_POINTS` (`visual.ts:82`) nie osieroci się razem ze
`snappedSectionSweep` (osieroci — **skasować też**).

---

### R11. Eksporty bez zewnętrznego konsumenta · **priorytet: ŚREDNI, ryzyko: ZEROWE**

Symbole eksportowane, choć używane wyłącznie **wewnątrz własnego modułu**.
Zawężenie do prywatnych porządkuje publiczną powierzchnię API:

| Symbol | Plik:linia | Jedyny konsument |
| --- | --- | --- |
| `assertPreview` | `tests/helpers/guards.ts:8` | `usePreviewGuard` w tym samym pliku |
| `FREEZE` | `tests/helpers/visual.ts:19` | `prepareSweep` tamże |
| `settleImages` | `tests/helpers/visual.ts:35` | `prepareSweep` tamże |
| `OFERTA_IMAGES` | `sections/oferta/oferta-images.ts:17` | `ofertaImage()` tamże |
| `EMAIL_MAX` | `lib/contact-form.ts:18` | walidacja tamże (linia 89) |
| `OPENING_HOURS` | `lib/jsonld.ts:60` | budowa JSON-LD tamże (linia 97) |
| typy `OfertaSpec`, `WorkSpec`, `WorkGalleryItem`, `ContactLang` | `oferta-content.ts:17`, `work-data.ts:14,22`, `contact-form.ts:39` | używane w sygnaturach we własnych plikach |

**Rekomendacja.** Zdjąć `export` **poza dwoma wyjątkami**:

- **`assertPreview` zostaw wyeksportowany.** Reguła
  `.claude/rules/testing.md` nazywa go po imieniu („strażnik
  `assertPreview` wykrywa `/@vite/client` — nie obchodź go"). Zmiana
  nazwy/widoczności rozjeżdża regułę z kodem.
- **`settleImages` zostaw wyeksportowany.** `CLAUDE.md` opisuje go jako
  poprawkę z PR #17 — jest punktem odniesienia przy diagnozie migotania
  zrzutów.

Dla pozostałych: zdjęcie `export` nie zmienia ani bajtu w `dist`
(tree-shaking i tak je zostawiał), ale odpowiada na pytanie „czy mogę to
zmienić bez sprawdzania całego repo".

---

### R12. Kod świadomie martwy — zostaje, ale opisany w JEDNYM miejscu · **priorytet: NISKI**

**Stan zastany.** Trzy byty żyją bez konsumenta **z decyzji**, nie przez
zaniedbanie:

- `src/components/ui/BackButton.astro` (103 linie) — D-CH8: brak w designach,
  zachowany świadomie. Jedyny konsument tokenów `--line` i `--accent-gold`;
- `src/scripts/back-link.ts` (1 329 B) — mechanizm `a[data-back]` wołany
  z `BaseLayout.astro:170`, ale **żaden komponent nie renderuje dziś
  `data-back`** (poza nieużywanym `BackButton`). Mechanizm jest „uśpiony";
- `src/i18n/utils.ts` — `useTranslations` **żyje** (konsumenci:
  `WorkIndexPage.astro:18`, `ContactPage.astro:21`), ale `getLangFromUrl`
  (linie 15–19) i `languages` (`ui.ts:6`) nie mają konsumentów — to
  pozostałość mechanizmu wielojęzycznego, uśpionego na jednym języku.

**Rekomendacja.** Kasować **tylko `getLangFromUrl` i `languages`** — one
obsługują ścieżki `/en/`, których w projekcie nie ma i nie będzie (PL-only,
decyzja D2). `BackButton` i `back-link.ts` **zostawić** zgodnie z D-CH8,
ale dopisać do obu plików jedną linię statusu:
`// NIEUŻYWANY ŚWIADOMIE (D-CH8) — nie kasować bez decyzji.`
Dziś ta informacja jest w `CLAUDE.md`, a nie w pliku, w którym potrzebuje
jej osoba czytająca kod.

**Uwaga:** `BaseLayout.astro:170` ładuje `back-link.ts` na **każdej**
stronie. Skoro mechanizm jest uśpiony, warto **zmierzyć**, ile to kosztuje
(1 329 B źródła), i rozważyć ładowanie warunkowe. Ale to zmiana zachowania
przy pierwszym użyciu `data-back` — **decyzja Mateusza, nie refaktor.**

---

### R13. Fałszywe trafienia knipa — **NIE ruszać** · **priorytet: ostrzeżenie**

Zapisane, żeby następna sesja nie „posprzątała" działającego kodu:

| Zgłoszone jako nieużywane | Prawda |
| --- | --- |
| `eslint-plugin-jsx-a11y` | Używany pośrednio przez `astro.configs["jsx-a11y-recommended"]` (`eslint.config.mjs:12`) |
| `functions/api/kontakt.ts` | Pages Function — kontrakt runtime'owy Cloudflare, nie import |
| `lighthouserc.cjs`, `lighthouserc.desktop.cjs` | Konfiguracja LHCI wołana z CI |
| `scripts/{lhci-median,make-icons,optimize-images}.mjs` | Wołane z CLI (`.claude/rules/capture-scripts.md`) |
| `CONTACT_TO` (`lib/contact-form.ts:7`) | Używany w `functions/api/kontakt.ts:11,131,146` |
| `SWEEP_PROJECTS` (`tests/helpers/visual.ts:12`) | Używany w `tests/visual/index.spec.ts` |

---

## 6. Czystość i utrzymanie kodu

### R14. Komentarze, które **kłamią o kontrakcie** · **priorytet: WYSOKI, ryzyko: ZEROWE**

To najpoważniejsze znalezisko całego audytu — nie kosztuje bajtów, ale
wprowadza w błąd dokładnie tam, gdzie projekt deklaruje twardy kontrakt.

**Stan zastany (zweryfikowany `grep`-em po `tests/`).** Sześć z siedmiu
plików konfiguracyjnych deklaruje: *„Importują ją też testy e2e/visual"*.
**Rzeczywistość:**

| Stała | Komentarz mówi | Testy naprawdę importują? |
| --- | --- | --- |
| `CONTACT_DESKTOP_MIN_PX` | „importują testy e2e" | ✅ **TAK** — `tests/e2e/contact.spec.ts:16` |
| `NAV_DESKTOP_MIN_PX` | „importowana przez testy e2e" | ❌ **NIE** |
| `HOME_DESKTOP_MIN_PX` | „Importują ją też testy e2e/visual" | ❌ **NIE** |
| `OFERTA_DESKTOP_MIN_PX` | „Importują ją też testy e2e/visual" | ❌ **NIE** |
| `WORK_DESKTOP_MIN_PX` | „Importują ją też testy e2e/visual" | ❌ **NIE** |
| `ONAS_DESKTOP_MIN_PX` | „Importują ją testy" | ❌ **NIE** |
| `PROCES_DESKTOP_MIN_PX` | „Importują ją testy" | ❌ **NIE — i nikt inny też** |

**`proces-config.ts` jest importowany przez ZERO plików.** Cztery
komponenty procesu wspominają go wyłącznie w komentarzach CSS
(`ProcesHero.astro:107`, `ProcesSteps.astro:283`, `ProcesCta.astro:201`,
`ProcesEfekt.astro:45` — „para: PROCES_DESKTOP_MIN_PX"). Stała nie
uczestniczy w żadnym kontrakcie — jest dekoracją.

**Dlaczego to groźne.** `CLAUDE.md` i prompt startowy refaktoru wymieniają
te stałe jako **publiczny kontrakt pod ochroną testów**. Ktoś, kto zmieni
próg w `@media` i zapomni o stałej, spodziewa się czerwonego testu.
**Nie dostanie go w sześciu z siedmiu przypadków.**

**Rekomendacja — dwie drogi, do wyboru przez Mateusza:**

- **(A) Naprawić komentarze** (tanio, uczciwie): usunąć nieprawdziwe
  zdania, zostawić prawdziwe przy `contact-config.ts`. Efekt: dokumentacja
  przestaje kłamać, ale kontrakt dalej nie istnieje.
- **(B) Naprawić kontrakt** (drożej, wartościowo): dopisać do testów e2e
  po jednej asercji per widok, importującej stałą i sprawdzającej, że
  układ faktycznie przełącza się na tym progu (wzorzec z
  `contact.spec.ts`). Efekt: siedem stałych naprawdę pod ochroną.

**Rekomendacja własna: (B) dla `work`/`oferta`/`home`** (widoki z realnie
różnym układem po obu stronach progu, gdzie regresja byłaby dotkliwa) oraz
**(A) dla reszty**. To jedyne miejsce w tym audycie, gdzie proponuję
**dodać** kod — bo pokrycie testami ma nie maleć, a tu jest po prostu
dziura w tym, co uważaliśmy za pokryte.

**Pracochłonność:** (A) 20 min · (B) ~2 h. **Ryzyko wizualne:** zerowe
(komentarze + nowe testy).

---

### R15. Komentarze obiecujące pracę, która już się odbyła · **priorytet: ŚREDNI, ryzyko: ZEROWE**

**Stan zastany.** Komentarze pisane w trakcie budowy, których termin minął:

| Plik:linia | Treść | Stan faktyczny |
| --- | --- | --- |
| `src/lib/contact-details.ts:7` | „Sekcja kontaktu ma własne fragmenty (contact-ui.ts) — **ewentualna unifikacja przy porcie widoku kontaktu (Etap 5)**" | **Unifikacja SIĘ ODBYŁA.** `contact-ui.ts:11–12` sam odsyła do `contact-details.ts`; kafle używają slotów `fillContactSlots`. Komentarz opisuje stan sprzed Etapu 5 |
| `src/styles/global.css:11–13` | `--font-mono` „mapujemy na systemowy monospace **do czasu portu widoków delung (Etap 4)**" | Etap 4 zamknięty. Token ma 12 realnych konsumentów (m.in. `PolicyPage.astro:310`, `ProcesSteps.astro:199`) — mapowanie jest **stanem docelowym**, nie tymczasowym |
| `src/components/sections/home/home-scroll.ts:3` | „budżet skryptu zostaje na **Etap 5**" | Etap 5 zamknięty; budżety przeszły przez dwa zacieśnienia (Etap 6 i runda 3) |
| `src/components/navbar/Navbar.astro:19` | odsyła do „kontakt (Etap 5)" jako pracy przyszłej | Widok gotowy |

**Rekomendacja: przepisać w czasie przeszłym albo skasować.** Komentarz
„zrobimy to w Etapie 5" czytany po Etapie 6 każe szukać niedokończonej
roboty, której nie ma. To dokładnie ten rodzaj szumu, który kosztuje czas
osobę przejmującą projekt.

---

## 7. Komentarze — przegląd z podziałem

Gęstość: **1 427 linii komentarza w `src/`** (~8 % objętości). Znaczników
`TODO`/`FIXME`/`HACK`: **0** (czysto). Najgęstsze pliki: `lib/jsonld.ts`
(32 %), `BaseLayout.astro` (20 %), `lib/contact-form.ts` (18 %),
`home-scroll.ts` (14 %).

**Kryterium przyjęte w tym audycie:** kasujemy komentarze opisujące *co
robi kod* i pozostałości po kodzie, którego nie ma. Zachowujemy każdy
komentarz niosący *dlaczego* albo pułapkę pomiarową — te są dokumentacją,
a ich odtworzenie wymagałoby powtórzenia sesji pomiarowych na fizycznych
urządzeniach.

### 7A. Do SKASOWANIA — duchy nieistniejących bytów · **priorytet: WYSOKI**

Komentarze opisujące mechanizmy, których w projekcie **nie ma**. Każdy
aktywnie wprowadza w błąd:

| Plik:linia | Treść | Dlaczego duch |
| --- | --- | --- |
| `tests/helpers/scroll.ts:6` | „2×rAF (**GSAP scrub** dogania) + timeout" | GSAP wyszedł w Etapie 5 |
| `tests/helpers/scroll.ts:23` | „dla sekcji ze scrubem i snapem **ScrollTriggera (about)**" | Ani ScrollTriggera, ani sekcji `about` |
| `tests/helpers/scroll.ts:60` | „testuj z wyłącznikiem `?nosnap` (**about-scroll.ts**)" | Plik nie istnieje |
| `tests/helpers/guards.ts:1` | „port wzorców z **verify-hero.mjs**" | Skrypt nie istnieje w delung |
| `tests/helpers/visual.ts:9` | „odpowiedniki profili **verify-hero**" | j.w. |
| `tests/helpers/visual.ts:89` | „audience sweepuje podstronę **/dla-kogo/**" | Trasa nie istnieje (znika razem z R10) |
| `tests/helpers/freeze.css:1,3` | „port FREEZE_CSS z **verify-hero.mjs**"; „scroll-driven (**GSAP scrub**) zostają" | j.w. |
| `src/components/ui/LoadingOverlay.astro:15` | „reguła o **ScrollTrigger.refresh()** i o measure() w navbarze" | ScrollTrigger nie istnieje |

**Uwaga rozróżniająca — NIE kasować wzmianek „bez GSAP" w `src/`.**
Komentarze w `home-scroll.ts:2`, `contact-motion.ts:2`, `oferta-motion.ts:3`,
`work-motion.ts:2,7`, `proces-motion.ts:2`, `onas-motion.ts:2`,
`OfertaSection.astro:10`, `WorkIndexPage.astro:292`, `BaseLayout.astro:3`
dokumentują **świadomą decyzję** („eksport designu używał GSAP, my go nie
portujemy") — to jest *dlaczego*, nie duch. Zostają.

Różnica jest prosta: „**bez** GSAP" opisuje decyzję i jest prawdziwe;
„GSAP scrub dogania" opisuje działający mechanizm i jest **nieprawdziwe**.

### 7B. Do SKRÓCENIA · **priorytet: NISKI**

- `src/styles/global.css:5–13` — 9 linii o wyborze kroju display
  (Helvetica → Archivo, „kandydat nr 2: Inter Variable", data testu A/B).
  Decyzja zapadła w Etapie 0 i nie wróci. **Skrócić do 2 linii**, resztę
  zostawić w `docs/` (jest tam).
- `src/styles/global.css:73–74` — komentarz `--section-gap` znika razem
  z tokenem (R9).
- `tests/helpers/visual.ts:26–33` — 8 linii opisu wyścigu dekodowania
  zdjęć. **Zachować sens, skrócić do 3–4 linii** — to cenna pułapka
  (PR #17), ale nie wymaga pełnej narracji incydentu w pliku źródłowym.
- `src/lib/opinie.ts:66–75` — 10 linii historii KOREKTY D-P6.
  **Skrócić do 3**: wniosek („link sprawdzamy klikiem na obu progach")
  jest wart zachowania, przebieg śledztwa — nie.

### 7C. Do ZACHOWANIA — **nie ruszać** · **kategoria ochronna**

Komentarze, które są jedynym zapisem drogiej wiedzy. Ich kasowanie
w imię zwięzłości byłoby stratą netto:

- **`HomeHero.astro`** — komenda przeliczania kadru hero
  (`--hero-zoom/x/up`) i opis bramki fontu D-T1. Bez tego kalibracja kadru
  jest nie do odtworzenia.
- **`HomeRealizacje.astro`** — uzasadnienia ramp `cqh`, rozpórki i
  `row-gap` (D-T3/D-T4). Każda liczba ma tam powód wyliczony pomiarem.
- **`global.css:47–49, 60–64`** — dlaczego `--faint` to 0.64 a nie 0.5
  i dlaczego istnieje `--accent-ink` (kontrasty AA pod ratchet axe).
  Skasowanie zaprasza do „uproszczenia" palety i wywalenia a11y.
- **`global.css:19–24`** — `scrollbar-gutter: stable` i skok strony przy
  otwieraniu nakładek.
- **`global.css:35–40`** — `color-scheme: only light` i wymuszane
  ciemnienie na Androidzie.
- **`lib/contact-details.ts`**, **`lib/jsonld.ts`** — antyscraping D-CH5
  (dlaczego JSON-LD celowo nie zna telefonu).
- **`sections.md`-owe gotcha w kodzie**: `scroll-snap-stop: always`,
  honeypot `readonly`, podłoga `font-size: 16px` na mobile
  (`ContactForm.astro`), leniwy Turnstile.
- **`tests/helpers/scroll.ts:18–27`** — dlaczego skok „immediate" nie
  działa (po usunięciu ducha ScrollTriggera z tekstu — patrz 7A).

---

## 8. Rozważone i ODRZUCONE

Zapisane, żeby nie wracały jako „dobry pomysł" w kolejnych sesjach:

| Pomysł | Dlaczego odrzucony |
| --- | --- |
| Scalić 7 stałych `*_DESKTOP_MIN_PX` w jedną globalną | Rozdzielność jest zabezpieczeniem — jedna stała pozwala zmienić próg 7 widoków jednym znakiem (R5) |
| Wyciągnąć bloki `<style>` z dużych `.astro` do plików CSS | Utrata scope'owania Astro → kolizje klas między sekcjami i realne ryzyko na 203 zrzutach (R6) |
| Zrobić globalną klasę `.kick` dla 12 kickerów | Zmiana specyficzności i kolejności kaskady — ta klasa zmian wywracała testy dwukrotnie. Wariant tokenowy jest bezpieczny (R4) |
| Ujednolicić duplikaty markupu per breakpoint | To świadomy wzorzec zastępujący relokację JS-em (Etap 4.5); ujednolicenie = cofnięcie decyzji |
| Przenieść `WorkIndexPage`/`PolicyPage` do `sections/` | Zysk porządkowy, koszt — dotknięcie dwóch największych widoków tuż przed przekazaniem (R8) |
| Skasować `BackButton.astro` i `back-link.ts` | Zachowane świadomie (D-CH8) — decyzja Mateusza, nie refaktor (R12) |
| Warunkowe ładowanie `back-link.ts` | To zmiana zachowania, nie refaktor — osobna decyzja (R12) |
| Skasować `eslint-plugin-jsx-a11y` (sugestia knipa) | Fałszywe trafienie — używany pośrednio (R13) |

---

## 9. Podział na PR-y

Kolejność: **od zerowego ryzyka do najwyższego.** Po każdym PR-ze pełna
bramka lokalnie, zanim ruszy następny.

| PR | Zakres | Ryzyko wizualne | Baseline'y |
| --- | --- | --- | --- |
| **A — `refactor/martwy-kod`** | R9 (3 tokeny) + R10 (~105 linii helperów) + R11 (zawężenie eksportów) + R12 (kasacja `getLangFromUrl`/`languages`, dopiski statusu) | **ZERO** — nic nie ma konsumenta | 0 |
| **B — `refactor/komentarze`** | R14(A) (naprawa kłamiących komentarzy) + R15 (nieaktualne obietnice) + 7A (duchy) + 7B (skrócenia) | **ZERO** — wyłącznie komentarze | 0 |
| **C — `test/progi-breakpointow`** | R14(B) — nowe asercje progu dla `work`/`oferta`/`home` | ZERO (same testy) | 0 |
| **D — `refactor/bramka-motion`** | R2 — `MotionGate.astro` | **ŚREDNIE** (CSS na 6 trasach) | cel: 0 |
| **E — `refactor/motion-common`** | R1 — wspólny moduł ruchu **+ pomiar bajtów** | **ŚREDNIE** | cel: 0 |
| **F — `refactor/nav-sheet`** | R7 — wydzielenie sheeta z `Navbar.astro` | **NAJWYŻSZE** | cel: 0 |

**R3 (fallback fontu) i R4 (kickery)** nie dostają własnego PR-a —
R3 wchodzi mechanicznie przy okazji, R4 tylko jeśli Mateusz zdecyduje
i pierwsze trzy podmiany przejdą bez diffu.

**Zalecenie minimalne:** jeśli czas przed Etapem 7 jest krótki, **A + B + C
dają większość wartości przy zerowym ryzyku wizualnym.** D/E/F są
wartościowe, ale to one wymagają pełnego `test:visual` i to one mogą
kosztować rundę diagnostyki.

---

## 10. Rachunek baseline'ów i ryzyka

**Cel dla każdego PR-a: zero regeneracji.** Każdy diff pokazuję
**obrazkiem** przed jakąkolwiek regeneracją. Święta kolejność bez zmian:
kod → workflow „Update linux visual baselines" z brancha PR-a → `git pull`
→ lokalne `pnpm test:visual:update` → commit darwin NA KOŃCU (bot-push nie
wyzwala CI).

**Ryzyka specyficzne dla tego refaktoru:**

1. **Kolejność wstrzykiwania CSS (R2).** Astro nie gwarantuje kolejności
   stylów między komponentami. Po zmianie sprawdzić wygenerowany CSS
   w `dist/_astro/*.css`, nie tylko wygląd na ekranie.
2. **Układ chunków JS (R1).** Wspólny moduł ruchu może dołożyć żądanie
   sieciowe na trasę. Warunek merge'a: suma bajtów nie rośnie względem
   6 948 B i nie przybywa chunków na trasę.
3. **Profile testowe mają tylko dwie szerokości desktopowe** (1920, 1366).
   Bug z rundy 3 żył przy 1024–1280 i był dla nich niewidoczny. Jeśli
   któryś PR dotknie układu — dołożyć własne przemiatanie szerokości.
4. **Nie ufać zielonemu `test:visual` po jednym przebiegu przy zmianach
   w module ruchu** — reveale są czasowe, a `freeze.css` zeruje animacje
   CSS, nie pętle rAF.
5. **Budżety LHCI zostają NIETKNIĘTE.** Refaktor nie jest powodem do
   ruszania progów; gdyby `lighthouse` zaczerwienił się na metryce
   czasowej przy niezmienionych bajtach — najpierw hipoteza szumu runnera
   (re-run jobu).

---

## 11. Definition of done

Ten dokument + wpis w `docs/README.md`; zielone lokalnie `format:check`,
`lint`, `typecheck`, `test:unit`, `test:e2e` (6 profili), `build` +
`test:visual`; **zero regeneracji baseline'ów** (a jeśli którykolwiek się
ruszył — diff pokazany obrazkiem i świadoma zgoda Mateusza); zero nowych
wpisów w allowliście axe; bajty nie wyższe niż liczby z §0; PR-y zielone
na `quality` + `e2e` + `lighthouse`; po merge'u `prod-smoke` zielony;
`CLAUDE.md` (stan projektu + numery PR-ów) i `docs/README.md`
zaktualizowane.

## 12. Do rozstrzygnięcia przez Mateusza

1. **R14 — droga (A) czy (B)?** Naprawić same komentarze, czy dołożyć
   realne asercje progu dla `work`/`oferta`/`home`? (rekomendacja: B dla
   tych trzech, A dla reszty).
2. **Zakres serii.** Tylko A+B+C (zero ryzyka wizualnego), czy pełne A–F?
3. **R4 (kickery)** — wchodzi wariant tokenowy, czy zostawiamy 12 kopii?
4. **R12** — czy `back-link.ts` ma dalej ładować się na każdej stronie,
   skoro mechanizm jest uśpiony? (to zmiana zachowania — osobna decyzja).
