# Runda poprawek nr 3 (po rundzie 2, przed Etapem 7)

Status: **W TOKU** (start 2026-08-04; D-T1 zamknięte PR-em #36).
Zakres: cztery zgłoszenia Mateusza z testów na fizycznej maszynie — jedno
renderowania hero w Firefoksie (D-T1, zamknięte), jedno użytkowe na
`/realizacje/` (D-T2) i dwa w scenie realizacji na stronie głównej
(D-T3, D-T4 — oba korygują D-Q5 z poprzedniej rundy).
Na koniec rundy — osobną decyzją i osobnym commitem — zacieśnienie budżetów
LHCI do baseline'u po wyjściu Lenisa.

Numeracja decyzji: **D-T1 …** (T = trzecia runda poprawek).

---

## 1. Co zgłosił Mateusz (lista wejściowa)

| #   | Zgłoszenie                                                                                                                                                  | Widok / środowisko          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Napis na hero jest „rozjechany": obok liter wypełnionych zdjęciem stoi ta sama nazwa jeszcze raz — biała, grubsza, przesunięta o kilka(naście) pikseli. Naprawia to dopiero odświeżenie strony albo lekka zmiana rozmiaru okna | `/`, desktop, **Firefox 153.0.1 (aarch64) na macOS**, pierwsze wejście na stronę |
| 2   | Po zmianie kategorii lista zostaje przewinięta tam, gdzie była — a ma wrócić na swój początek, żeby pierwsza realizacja z wybranej kategorii była widoczna u góry listy | `/realizacje/`              |
| 3   | Opis nad przyciskiem „Więcej" przycina się na niektórych rozmiarach ekranu                                                                                    | `/`, scena realizacji, desktop |
| 4   | Na niektórych wysokościach okna nie ma żadnego odstępu między „Więcej" a przyciskiem „Przeglądaj nasze realizacje"; odstęp ma być zawsze, choćby minimalny, i ma przepychać opis do góry | `/`, scena realizacji, desktop |

Materiał dowodowy: dwa zrzuty ekranu (stan zepsuty — „Garderobyy" z dwiema
warstwami liter; stan poprawny po odświeżeniu).

---

## 2. Stan zastany — z pomiaru, nie z oka

### 2.1. Anatomia napisu hero (`HomeHero.astro`, wariant desktop)

Każda z czterech nazw kategorii jest w SVG rysowana **dwa razy z jednego
źródła** — `<text id="hg-tN">` leżącego w `<defs>` (linie 123–133):

1. `<use href="#hg-tN" fill="#ffffff" filter="url(#hg-glow)">` — biała kopia
   z poświatą i cieniem (to ona daje „obwódkę" liter),
2. `<g clip-path="url(#hg-cN)">` — grupa przycięta **maską w kształcie tych
   samych liter**, w środku ciemny `<rect>` i `<image>` z kadrem
   (animowany `pan`, 19–24 s w pętli).

W poprawnym renderze obie kopie leżą **dokładnie na sobie**: widać litery
wypełnione zdjęciem, a biała kopia daje tylko halo. Objaw zgłoszony przez
Mateusza to rozjechanie się tych dwóch kopii — czyli sytuacja, w której
**jedna z nich została narysowana krojem zastępczym, a druga docelowym**.

### 2.2. Reprodukcja (Firefox, Playwright, `pnpm preview` na 4399)

Reprodukcja jest deterministyczna, jeśli opóźni się odpowiedzi na pliki
`*.woff2` (symulacja zimnego cache / wolnego łącza): przy 1200 ms opóźnienia
napis rozjeżdża się w **każdym** przebiegu. Bez opóźnienia (serwer lokalny)
objaw też występuje — okno jest tylko krótsze.

Pomiar geometrii **po** podmianie fontu (`document.fonts.check` = `true`):

| Silnik   | szerokość `<use>` (jednostki viewBoxa) | świeży `<text>` w Archivo | ten sam tekst w kroju zastępczym |
| -------- | -------------------------------------- | ------------------------- | -------------------------------- |
| Firefox  | 633,40                                 | 633,40                    | 561,09                           |
| Chromium | 630,29                                 | 630,29                    | 557,98                           |

Wniosek numer jeden: **układ jest poprawny** — element `<use>` ma po
podmianie fontu dokładnie tę szerokość, co świeżo utworzony tekst w Archivo.
Rozjechanie nie jest więc błędem liczenia geometrii; to, co widać na
ekranie, jest **starym rasterem**, którego Gecko nie unieważnił. Różnica
szerokości kroju zastępczego i docelowego (633 vs 561 jednostek, ~11 %) to
dokładnie ta odległość, o którą „druga" nazwa jest przesunięta na zrzucie.

Wniosek numer dwa: **to defekt wyłącznie Gecko**. Ten sam scenariusz
(opóźnione fonty, zimny start) w Chromium i WebKicie daje render czysty —
sprawdzone zrzutami na obu silnikach. Zgadza się z obserwacją Mateusza, że
problem widzi tylko w Firefoksie.

### 2.3. Zasięg objawu — WSZYSTKIE cztery nazwy

Model, który postawiłem po pierwszym pomiarze („duch zostaje tylko dla tej
nazwy, która była na ekranie w chwili podmiany kroju"), **jest błędny** —
skorygowała go obserwacja Mateusza: zepsute były wszystkie cztery napisy
(Kuchnie, Łazienki, Wnętrza komercyjne, Garderoby) i wszystkie naprawiały
się naraz po odświeżeniu albo zmianie rozmiaru okna. To zgadza się
z mechanizmem: cztery grupy tekstu są potomkami JEDNEGO `<svg>` i dzielą
`<text>` w `<defs>`, więc unieważnienie (albo jego brak) dotyczy całej
warstwy, nie pojedynczej klatki. Konsekwencja praktyczna: poprawka musi
działać na poziomie całej warstwy — i tak działa (bramka chowa `<svg>`,
nie pojedyncze grupy).

### 2.4. Dlaczego naprawia to odświeżenie i zmiana rozmiaru okna

Odświeżenie: font jest już w cache, więc **nie ma podmiany** — pierwszy
raster powstaje od razu krojem docelowym. Zmiana rozmiaru okna: wymusza
przebudowę ramek i ponowną rasteryzację całego SVG. Obie „naprawy" opisują
więc ten sam mechanizm od dwóch stron.

### 2.5. Dlaczego jednorazowe przemalowanie NIE wystarcza

Pierwszy kandydat na poprawkę brzmiał: po `document.fonts.ready` wymusić
przemalowanie SVG (`display: none` → odczyt geometrii → `display: ''`).
Zmierzone warianty przemalowania (klatka „Kuchnie", opóźnione fonty):

| Technika                                            | Wynik      |
| --------------------------------------------------- | ---------- |
| `display` none→'' na `<svg>`                        | **czysto** |
| ponowne wstawienie `<text>` do `<defs>`             | duch zostaje |
| przepisanie `viewBox` tą samą wartością             | duch zostaje |
| mikro-zmiana `opacity` grup                         | duch zostaje |

Ale to samo przemalowanie przestaje działać, gdy w klatce **biegnie
animacja `pan`** — czyli zawsze poza testami z zamrożonym ruchem:

| Warunki (klatka „Wnętrza komercyjne")               | Wynik po przemalowaniu |
| --------------------------------------------------- | ---------------------- |
| animacja `pan` zamrożona                            | czysto                 |
| animacja `pan` żywa                                 | **duch zostaje**       |

Do tego doszła druga pułapka, ważniejsza od pierwszej:
**`document.fonts.ready` jest w tym zastosowaniu sygnałem fałszywym.**
Rozwiązuje się, gdy dokument nie ma *w danej chwili* trwających pobrań
fontów — a fonty są u nas w `<link rel=preload>`, więc w momencie
rozstrzygnięcia obietnicy pobranie w rozumieniu CSS Font Loading API mogło
się jeszcze nie zacząć. Bramka oparta na `ready` zdejmowała się **przed**
faktyczną podmianą kroju i nie chroniła przed niczym. Sygnałem
wiarygodnym jest dopiero jawne `document.fonts.load(<font>, <tekst>)`
z realną treścią napisów (`Kuchnie Łazienki Wnętrza komercyjne Garderoby`
— tekst wymusza pobranie OBU podzbiorów, latin i latin-ext).

Trzecia pułapka, czysto metodyczna: **każde wstrzyknięcie CSS po
załadowaniu strony samo działa jak przemalowanie** i „naprawia" objaw.
Pierwsza wersja eksperymentu podawała zamrożenie animacji przez
`page.addStyleTag()` po `load` — i pokazywała, że wszystkie warianty są
czyste, łącznie z kontrolą bez poprawki. Zamrożenie musi wchodzić
**przed** startem strony (`addInitScript`), inaczej mierzy się własne
narzędzie. Analogicznie zamrożenie samych klatek potrafi wygenerować
własne artefakty — ostateczna weryfikacja poprawki idzie **na żywej
stronie, bez żadnych wstrzyknięć**.

### 2.6. Zmiana filtru na `/realizacje/` — pomiar

Scenariusz Mateusza odtworzony: zjazd na ~60 % strony, klik w kategorię.
Po przefiltrowaniu pierwszy widoczny kafel ma górną krawędź:

| Profil        | scroll przed | scroll po | górna krawędź 1. kafla | wysokość szyny |
| ------------- | ------------ | --------- | ---------------------- | -------------- |
| 393×727       | 2394         | 1879      | **−1467 px**           | 40 px (sticky pod `--hdr-h` 105) |
| 1366×768      | 1348         |  901      | **−700 px**            | 145 px (sticky kolumna boczna, `--hdr-h` 87) |

Pozycja scrolla drgnęła sama (dokument po odfiltrowaniu jest krótszy), ale
początek listy zostaje daleko nad ekranem. Filtr działa — tylko nie widać
jego wyniku.

### 2.7. Przycinanie opisu — to problem SZEROKOŚCI, nie wysokości

Przemiat 9 szerokości × 6 wysokości, przejścia wyłączone, dla każdego
z trzech wpisów (liczba: uciętych pikseli opisu / odstęp „Więcej" → CTA):

| wys \ szer | 1024   | 1152    | 1280   | 1366  | 1440  | 1600  | 1920  |
| ---------- | ------ | ------- | ------ | ----- | ----- | ----- | ----- |
| 900        | 4/307  | **10**/280 | 3/231 | 0/195 | 0/166 | 0/166 | 0/212 |
| 800        | 4/207  | **10**/180 | 3/131 | 0/95  | 0/66  | 0/66  | 0/112 |
| 720        | 4/127  | **10**/100 | 3/65  | 0/40  | 0/20  | 0/20  | 0/66  |
| 640        | 4/82   | **10**/65  | 3/31  | 0/10  | 0/9   | 0/9   | 0/55  |
| 560        | 4/32   | **10**/16  | 3/**0** | 0/3 | 0/7   | 0/8   | 0/54  |

Rozstrzygające jest to, że **przycięcie nie zależy od wysokości okna** —
przy 1152 px szerokości ucina 10 px zarówno wtedy, gdy pod opisem zostaje
280 px wolnego miejsca, jak i wtedy, gdy zostaje 16 px. Czyli to nie jest
kurczenie się kolumny z D-Q5; to pudełko opisu jest po prostu za niskie.

Powód w kodzie: `.re-txts` ma wysokość **zgadywaną z szerokości okna**
(`flex: 0 1 clamp(240px, 20.1vw, 290px)`), a liczba linii, na które łamie
się opis, wcale nie zmienia się proporcjonalnie do `vw`. Zmierzone:

| Szerokość | pudełko (`20.1vw`) | ile potrzebuje najwyższa karta | brakuje |
| --------- | ------------------ | ------------------------------ | ------- |
| 1920      | 290                | 234                            | −56 (zapas) |
| 1440      | 289                | 280                            | −9 (zapas) |
| 1366      | 275                | 271                            | −4 (zapas) |
| 1280      | 257                | 260                            | **3**   |
| 1152      | 240 (podłoga)      | 250                            | **10**  |
| 1024      | 240 (podłoga)      | 244                            | **4**   |

10 px przy `line-height` ≈ 25 px to ucięta połowa ostatniego wiersza —
dokładnie to, co widać. Opisy idą z CMS-a, więc każda liczba wpisana tu
ręcznie zestarzeje się przy pierwszym dłuższym opisie.

### 2.8. Brak odstępu „Więcej" → CTA

Z tej samej tabeli: odstęp dochodzi do **0 px** przy 1280×560 i jest już
tylko kilkupikselowy przy 1366×560 (3 px) i 1440×560 (7 px). Formalnie
gwarancja D-Q5 („przycisk nigdy nie zasłania treści") jest spełniona —
najgorszy przypadek to styk, 0 px. Ale styk wygląda jak błąd i tak też
został zgłoszony. Brakuje **dolnej granicy** odstępu.

---

## 3. Decyzje

### D-T1. Napisy hero nie renderują się w kroju zastępczym — bramka na jawnym wczytaniu fontu

Skoro Gecko nie unieważnia rastra po podmianie kroju, a wymuszone
przemalowanie zawodzi przy żywej animacji, jedyna droga bez zgadywania to
**nie dopuścić do rasteryzacji napisów krojem zastępczym**. Litery hero
przestają być rysowane, dopóki Archivo nie jest realnie dostępny:

- **skrypt inline w `<head>`** (dokładany tylko na `/`, wzorzec redirectu
  `/kategorie/` i bramki `js-motion`) dokłada `html.hero-wait` **przed
  pierwszym paintem**;
- reguła `html.hero-wait .hero-d svg { display: none }` chowa całą warstwę
  typografii. `.hero-d svg` jest `position: absolute; inset: 0`, więc
  ukrycie **nie rusza układu** — zero ryzyka CLS;
- klasa spada po `document.fonts.load('900 144px "Archivo Variable"',
'Kuchnie Łazienki Wnętrza komercyjne Garderoby')` — sygnał
  wiarygodny, w przeciwieństwie do `fonts.ready` (§2.5);
- **twardy timeout 2,5 s uzbrajany w tym samym skrypcie inline**, nie
  w module. Gdy JS modułowy nie dojedzie albo font padnie, napisy pojawią
  się mimo wszystko (degradacja = dzisiejsze zachowanie), a strona nigdy
  nie zostaje bez napisów;
- bez JS klasa w ogóle nie powstaje — hero renderuje się jak dotąd.

**Koszt.** Zmierzone opóźnienie pojawienia się napisów: **60–90 ms** przy
zimnym wejściu na serwerze lokalnym, 1,5 s przy sztucznym opóźnieniu
fontów o 1,2–1,5 s (czyli: tyle, ile trwa pobranie fontu). Fonty są
preloadowane i ważą mniej niż kadry hero, więc w praktyce napisy
pojawiają się **przed** zdjęciem, na które są nałożone. Dziś w tym samym
oknie czasu widać litery w kroju zastępczym, które potem podskakują przy
podmianie — bramka wymienia jeden artefakt na brak artefaktu.

**Weryfikacja (żywa strona, bez wstrzykiwania stylów, Firefox, opóźnione
fonty):** bez poprawki duch jest, z poprawką render jest czysty —
zarówno na klatce pierwszej, jak i na dalszych.

**Czego NIE robimy.**

- Nie ruszamy hero: typografia SVG, maska, poświata, `pan` i Ken Burns
  zostają 1:1 z eksportu (jak w D-Q1 — problem nie jest w konstrukcji
  efektu, tylko w momencie jego pierwszej rasteryzacji).
- Nie wymuszamy przemalowań po podmianie fontu — zmierzone jako
  niewystarczające przy żywej animacji (§2.5).
- Nie dublujemy `@font-face` z `font-display: block` pod osobną nazwą
  rodziny: wariant renderuje się czysto, ale **kosztuje dwa dodatkowe
  żądania** plików woff2 (zmierzone: 6 → 8 pobrań fontów na `/`), a to
  wprost uderza w budżet LHCI, który za chwilę zacieśniamy.
- Nie zamieniamy napisów na ścieżki (outline). To jedyny wariant, który
  usuwa całą klasę problemu (brak zależności od pliku fontu), ale kosztuje
  nową zależność dev (fontkit), kilka–kilkanaście kB w HTML każdej wizyty
  na `/` i regenerację baseline'ów desktopowych. Zostaje **opisanym
  wariantem awaryjnym**, gdyby bramka okazała się niewystarczająca na
  fizycznym Firefoksie Mateusza.

### D-T2. Zmiana filtru wraca na początek listy

`applyFilter()` po zmianie kategorii **przez użytkownika** przewija stronę
tak, żeby pierwszy kafel wybranej kategorii stanął tuż pod przyklejonym
chromem: `--hdr-h` + wysokość szyny (mobile, gdzie szyna klei się nad
listą — D-Q4) albo samo `--hdr-h` (desktop, gdzie szyna jest kolumną
boczną), plus 12 px oddechu.

Trzy rozstrzygnięcia, każde z powodem:

- **tylko w górę.** Przewijamy WYŁĄCZNIE wtedy, gdy użytkownik jest już
  poniżej początku listy. Kto filtruje stojąc na nagłówku strony, nie
  zostanie nagle zepchnięty w dół — a zgłoszenie dotyczy sytuacji
  odwrotnej („niech wróci na górę listy").
- **nie na wejściu.** Deep-link `#<slug>` (D-R2) woła tę samą funkcję przy
  starcie strony; tam przewijanie jest niepożądane (użytkownik ma zobaczyć
  stronę od góry). Dlatego skok dostaje osobny argument i wchodzi tylko
  przy kliku w szynę oraz przy „Zobacz więcej z kategorii X" w detalu.
- **płynnie, chyba że reduce.** `behavior: "smooth"` przy
  `prefers-reduced-motion: no-preference`, inaczej skok. Scroll jest
  natywny (D-Q1) — nie wraca tu żaden wygładzacz.

### D-T3. Pudełko opisu bierze wysokość z treści, nie z `20.1vw` — KOREKTA D-Q5

Znika liczba, która była źródłem przycięcia. `.re-txts` przestaje mieć
`flex-basis` liczony z szerokości okna i dostaje wysokość **najwyższej
z trzech kart**. Żeby to było możliwe, trzy karty przestają leżeć na sobie
przez `position: absolute; inset: 0`, a zaczynają dzielić **tę samą komórkę
siatki** (`display: grid` na pudełku, `grid-area: 1/1` na kartach) — układ
na ekranie jest identyczny (nadal jedna na drugiej, przełączane
`opacity`), ale pudełko wie, ile miejsca naprawdę potrzebuje.

Konsekwencja dla mechanizmu skalowania z D-Q5: jednostki `cqh` liczyły się
dotąd od wysokości `.re-txts`, a ta po zmianie nie kurczy się już razem
z oknem (jest równa treści). **Kontener zapytań przenosi się na `.re-in`**
— kolumnę, której wysokość jest twardo wyznaczona przez wiersz `1fr`
sceny, czyli realnie maleje przy niskim oknie. Współczynniki przeliczam
tak, żeby przy 1920×1080 i 1366×768 `min()` dalej wybierał wartość
dotychczasową **co do piksela** (kontrola: `font-size` h3 i opisu ma
zostać 40px/16.5px oraz 37.9748px/15.709px).

`overflow: hidden` na akapicie **zostaje**, ale zmienia rolę: przestaje
być stanem roboczym przy 1152 px szerokości, a staje się ostatnim
zaworem, który odpala się dopiero wtedy, gdy kolumna naprawdę nie ma już
miejsca (po wyczerpaniu rozpórki i ramp skalowania). Gwarancja z D-Q5
(„treść nigdy nie wychodzi na przycisk") zostaje nietknięta — zmienia się
tylko to, że zawór nie jest wyzwalany bez powodu.

**Pułapka, którą odsłonił dopiero pomiar po implementacji.** Przeniesienie
kontenera zapytań na kolumnę zmienia charakter ramp: dotąd budziły się
REAKTYWNIE (pudełko kurczyło się dopiero pod naciskiem kolumny), a od teraz
reagują wprost na wysokość okna, czyli **proaktywnie**. Skutek uboczny
w pierwszej wersji: przy 1366×560 tytuł schodził do 30,7 px, choć rozpórka
miała jeszcze 68 px zapasu — czyli dokładnie odwrotnie, niż ustala D-Q5
(„najpierw odstęp, potem skalowanie"). Złapał to test kolejności kurczenia
z poprzedniej rundy.

Rozwiązanie: **rozpórka też dostaje rampę**, przesuniętą tak, żeby zeszła do
podłogi 12 px, zanim ruszą rampy treści
(`flex-basis: min(clamp(40px, 5vw, 72px), max(12px, calc(100cqh - 380px)))`).
Kolejność z D-Q5 jest znowu zadeklarowana w CSS, tylko obiema rampami zamiast
mechaniką flexa. Zmierzone po dostrojeniu (1366 px szerokości): przy 640 px
rozpórka 68 → 16 px, fonty **nietknięte**; przy 560 px rozpórka na podłodze
12 px i dopiero wtedy tytuł 37,97 → 33,8 px.

**KOREKTA D-Q5**: „blok opisu ma sztywną wysokość, bo jego dzieci są
ułożone jedno na drugim" przestaje obowiązywać. Ta sztywna wysokość była
zgadywana z `vw` i to ona ucinała opis; strukturalna gwarancja z D-Q5
opiera się na wierszu siatki dla przycisku, a nie na tej liczbie, więc
zostaje w mocy.

### D-T4. Dolna granica odstępu „Więcej" → CTA

`.re-pin` dostaje `row-gap: clamp(16px, 2.2vh, 28px)` — czyli wiersz
przycisku jest **oddzielony od kolumny tekstu odstępem, którego nie da się
skonsumować**. Mechanicznie działa dokładnie tak, jak Mateusz opisał:
odstęp zabiera wysokość wierszowi `1fr`, więc kolumna tekstu ma mniej
miejsca i jej zawartość jedzie do góry (najpierw rozpórka z D-Q5, potem
rampy skalowania). Przy wysokich oknach nic się nie rusza, bo kolumna ma
tam kilkaset pikseli zapasu pod tekstem.

Wartość: 16 px podłogi (widoczna szpara przy skrajnie niskim oknie),
2,2vh w środku pasma, 28 px sufitu — sufit nie ma znaczenia wizualnego
(przy wysokim oknie odstęp i tak liczy się w setkach pikseli), pilnuje
tylko, żeby przy bardzo wysokim oknie nie zjadać kolumny bez potrzeby.

---

## 4. Implementacja — pliki

**PR A — D-T1**

| Plik | Zmiana |
| ---- | ------ |
| `src/components/sections/home/HomeHero.astro` | stałe `HERO_FONT`/`HERO_FONT_TEXT` w frontmatterze; skrypt `is:inline` z `define:vars` **przed markupem hero** (zakłada `hero-wait`, zdejmuje po `document.fonts.load(...)`, twardy timeout 2500 ms); reguła `:global(html.hero-wait) .hero-d svg { display: none }` w gałęzi desktopowej; `[data-font-text]` na `.hero-d` jako kontrakt testu |
| `tests/e2e/index.spec.ts` | cztery nowe asercje kontraktu bramki (§5) |
| `docs/analiza-strona-glowna.md` | dopisek o bramce fontu przy hero desktop |
| `docs/analiza-poprawki-3.md`, `docs/README.md` | ten dokument + wpis w indeksie |

**PR B — D-T2**

| Plik | Zmiana |
| ---- | ------ |
| `src/components/WorkIndexPage.astro` | `applyFilter(slug, odUzytkownika)` + skok na początek listy (offset z `--hdr-h` i wysokości szyny poniżej progu desktop); wywołania z szyny i z detalu przekazują `true`, deep-link na wejściu `false` |
| `tests/e2e/work-index.spec.ts` | asercje skoku (mobile + desktop) i braku skoku na wejściu z deep-linkiem |

**PR C — D-T3 + D-T4**

| Plik | Zmiana |
| ---- | ------ |
| `src/components/sections/home/HomeRealizacje.astro` | `.re-txts` na siatkę z kartami w jednej komórce i wysokością z treści; `container-type: size` przeniesiony na `.re-in` + przeliczone współczynniki `cqh`; `row-gap` na `.re-pin` |
| `tests/e2e/index.spec.ts` | asercje: zero przycięcia opisu w paśmie roboczym, odstęp zawsze ≥ podłogi, niezmienione rozmiary fontów przy 1920×1080 i 1366×768 |
| `docs/analiza-strona-glowna.md` | dopisek KOREKTA D-Q5 |

Skrypt bramki hero siedzi w komponencie hero, a nie w `Home.astro`: stoi w markupie
przed `.hero-d`, więc klasa jest na miejscu przed pierwszym paintem, a cała
wiedza o bramce (skrypt + reguła + lista znaków) zostaje w jednym pliku.
Kolejność wykonania jest tu istotna dwa razy: skrypt musi zdążyć przed
paintem hero, ale też **po** sparsowaniu arkuszy (inaczej `@font-face`
jeszcze nie istnieje i `document.fonts.load` rozstrzyga się natychmiast,
niczego nie pobierając) — skrypt klasyczny w `<body>` spełnia oba warunki,
bo czeka na arkusze z `<head>`.

## 5. Testy

`tests/e2e/index.spec.ts`, profile desktopowe (defekt dotyczy Gecko, ale
kontrakt pilnujemy wszędzie — mechanizm jest przeglądarkoniezależny).
Wszystkie cztery **zielone**:

1. **bramka istnieje**: przy opóźnionych `*.woff2` (3 s) zaraz po nawigacji
   `html` niesie `hero-wait`, a `.hero-d svg` ma `display: none`;
2. **bramka spada**: po wczytaniu fontu klasa znika i SVG wraca
   (`display: block`) — napisy NIE zostają ukryte na stałe;
3. **twarda podłoga**: przy ZABLOKOWANYCH żądaniach fontów (`route.abort`)
   napisy pojawiają się mimo wszystko — awaria pobrania nie kasuje treści
   hero;
4. **lista znaków**: żaden znak z czterech `<text>` nie wypada poza
   `[data-font-text]` — inaczej `document.fonts.load` nie wymusiłby
   pobrania właściwego podzbioru i bramka przepuściłaby krój zastępczy.

**Weryfikacja, że test łapie regresję** (wykonana): po cofnięciu poprawki
`git checkout HEAD -- HomeHero.astro` i przebudowie testy 1 i 4 są
**czerwone**, 2 i 3 zielone — zgodnie z projektem, bo te dwa pilnują, żeby
bramka nie zablokowała napisów na stałe, a nie samego buga. Poprawka
przywrócona z kopii.

- `pnpm test:visual` — **zero nowych baseline'ów** (zrzuty powstają po
  zdjęciu bramki, geometria bez zmian). W pierwszym pełnym przebiegu
  wypadł `o-nas: precyzja` na webkit-iphone-14 — widok, którego ta zmiana
  nie dotyka (bramka żyje w gałęzi desktopowej `/`). Cztery kolejne
  przebiegi tego testu i pełny przebieg całej wizualnej: zielone. To znany
  z Etapu 5 wyścig dekodowania zdjęć `lazy` przy zrównoleglonym przebiegu
  (`settleImages` w `tests/helpers/visual.ts`); obrazu diffu nie
  obejrzałem, bo udany przebieg wyczyścił `test-results`. Do obserwacji
  w CI.
- `a11y.spec.ts` — bez zmian (allowlista zostaje pusta; napisy hero to
  dekoracja, `h1` jest sr-only i bramki nie dotyczy).

**PR B (D-T2)** — `tests/e2e/work-index.spec.ts`, mobile i desktop:

1. po zmianie kategorii ze zjazdu w dół pierwszy widoczny kafel stoi
   `--hdr-h` + szyna (mobile) + 12 px od góry, z tolerancją 2 px;
2. filtrowanie ze szczytu strony **nie** przewija (skaczemy tylko w górę);
3. wejście z deep-linkiem `#<slug>` zostawia stronę na górze.

**PR C (D-T3 + D-T4)** — `tests/e2e/index.spec.ts`:

1. przemiat szerokości **1024 / 1152 / 1280** / 1366 / 1440 / 1920 × trzy
   wysokości: zero uciętych pikseli opisu dla KAŻDEGO z trzech wpisów.
   Przemiat jest konieczny, bo bug żył na szerokościach, których nie ma
   w profilach testowych (1920 i 1366 były czyste);
2. rampy skalowania śpią przy 1920×1080 i 1366×768 — rozmiar fontu równa
   się czystemu `clamp()` bez członu `cqh` (ta sama arytmetyka w każdym
   silniku, więc asercja nie jest wpisaną na sztywno liczbą);
3. odstęp „Więcej" → CTA ≥ 16 px na całej rampie wysokości (dopisane do
   istniejącego testu z D-Q5);
4. kolejność kurczenia z D-Q5 przeliczona na udziały (pudełko opisu ma
   teraz wysokość treści, więc maleje razem ze skalowaniem fontów).

**Weryfikacja, że testy łapią regresję** (wykonana dla obu PR-ów): po
`git checkout HEAD -- <pliki>` i przebudowie czerwone są dokładnie
te asercje, które mają być — przycinanie przy 1024/1152/1280, oba testy
skoku listy (mobile i desktop) oraz odstęp na profilu chromium-1366 (pięć
wysokości). Kod przywrócony z kopii.

Stan po poprawkach (pomiar, 9 szerokości × 6 wysokości × 3 wpisy):
**zero przycięcia** w całym paśmie i odstęp nigdy poniżej 31 px. Test
odporności na dłuższe opisy z CMS-a (opis 2× dłuższy niż dzisiejsze):
odstęp dalej zawsze ≥ 16 px, a zawór przycinania otwiera się dopiero przy
oknach ≤ 640 px — czyli działa jak zawór, a nie jak stan roboczy.

## 6. Rachunek baseline'ów

| PR  | Co zmienia się wizualnie | Pliki do regeneracji |
| --- | ------------------------ | -------------------- |
| A   | nic w stanie ustalonym — zmienia się wyłącznie to, co widać przez pierwsze ~60–90 ms zimnego wejścia | **0** |
| B   | nic — zmienia się pozycja scrolla po kliku, nie wygląd | **0** |
| C   | **potwierdzone zrzutami: nic** — `pnpm test:visual` (203 zrzuty, 6 profili) zielony bez jednej regeneracji. Teza z planu się obroniła.<br />Było: **cel: nic** na profilach testowych. Pudełko opisu zmienia wysokość (1920: 290 → 234 px), ale treść karty jest wyrównana do GÓRY i pod pudełkiem nie ma nic w potoku (pasek postępu jest absolutny), więc żaden piksel nie powinien drgnąć. Podobnie `row-gap`: przy 1080 i 768 kolumna ma pod tekstem setki pikseli zapasu. **To jest teza do sprawdzenia zrzutami, nie pewnik** — profile testowe (1920×1080, 1366×768) leżą w paśmie, gdzie oba mechanizmy śpią | **0** (a jeśli nie: `index-realizacje*` × 3 profile desktop × 2 platformy) |

Każdy ewentualny diff pokazuję **obrazkiem** przed jakąkolwiek
regeneracją. Święta kolejność bez zmian: kod → workflow „Update linux
visual baselines" z brancha PR-a → `git pull` → lokalne
`pnpm test:visual:update` → commit darwin na końcu.

## 7. Podział na PR-y

1. **PR A — `fix/hero-font-swap-firefox`** (D-T1): **ZMERGOWANY** (PR #36),
   potwierdzony przez Mateusza na fizycznym Firefoksie; `prod-smoke`
   zielony.
2. **PR B — `fix/realizacje-scroll-po-filtrze`** (D-T2): jedna zmiana
   w skrypcie strony, zero ryzyka wizualnego — idzie pierwszy.
3. **PR C — `fix/home-realizacje-opis`** (D-T3 + D-T4): obie poprawki
   dotyczą tej samej kolumny sceny i tych samych liczb, więc rozdzielanie
   ich dałoby dwa razy tę samą weryfikację zrzutami. Wchodzi po B.
4. **PR ostatni — budżety LHCI**: osobny commit, liczby z zielonego
   przebiegu `lighthouse` na `main` (po wyjściu Lenisa skryptów ubyło
   ~5,3 kB gz — liczby biorę z CI, nie z lokalnego builda). Uwaga:
   `total` ma najciaśniejszy zapas (~9 % na mobile).

## 8. Ryzyka i weryfikacja na fizycznym urządzeniu

- **D-T1 → fizyczny Firefox Mateusza (macOS), zimny start.** Emulacja
  Playwrighta to ten sam Gecko, ale inny port i inna ścieżka kompozycji —
  potwierdzenie musi przyjść z prawdziwej przeglądarki: **pierwsze wejście
  na stronę po wyczyszczeniu cache** (Cmd+Shift+Delete → „Pamięć
  podręczna", albo okno prywatne), potem drugie wejście i odświeżenie.
  Na co patrzeć: czy napis pojawia się **od razu w docelowym kroju**
  (może pojawić się o ułamek sekundy później niż zdjęcie — to zamierzone)
  i czy przy dłuższym staniu na stronie żadna z czterech nazw nie zjawia
  się zdublowana.
- **Regresja tam, gdzie dziś jest dobrze**: Safari i Chrome na macOS —
  czy napisy hero pojawiają się normalnie i czy nie ma migotania przy
  wejściu; Chrome/Safari na telefonie — hero mobilne nie ma napisów SVG,
  więc bramka jest tam bez znaczenia, ale jedno wejście kontrolne jest
  tanie.
- **Wolne łącze**: przy bardzo wolnym pobieraniu fontu napisy pojawią się
  najpóźniej po 2,5 s (twarda podłoga). Warto sprawdzić z dławieniem
  sieci w narzędziach Firefoksa, czy ten stan wygląda znośnie (zdjęcia
  hero bez napisów).
- **LHCI**: bramka nie dokłada ani bajtu i nie zmienia kandydata na LCP
  (jest nim kadr `<img>`, nie warstwa SVG). Gdyby przebieg `lighthouse`
  na PR-ze pokazał inaczej — najpierw hipoteza szumu runnera (re-run),
  potem dopiero dyskusja o progach.

## 9. Definition of done rundy

Ten dokument + wpis w `docs/README.md`; dopiski w analizach widoków tam,
gdzie decyzja koryguje wcześniejszą; zielone lokalnie `format:check`,
`lint`, `typecheck`, `test:unit`, `test:e2e` (6 profili), `build` +
`test:visual`; zero nowych wpisów w allowliście axe; baseline'y
regenerowane wyłącznie tam, gdzie zmiana wyglądu była zamierzona (oba
komplety w jednym PR); PR-y zielone na `quality` + `e2e` + `lighthouse`;
po merge'u `prod-smoke` zielony; budżety LHCI zacieśnione osobnym commitem
po decyzji Mateusza; `CLAUDE.md` i `docs/README.md` zaktualizowane;
poprawka potwierdzona przez Mateusza na fizycznym Firefoksie po zimnym
starcie.

## 10. Rozstrzygnięcia

0. **Kolejność**: D-T1 zamknięte i potwierdzone; D-T2 → D-T4 idą teraz,
   budżety LHCI na koniec rundy.
1. **Środowisko zgłoszenia D-T1**: Firefox 153.0.1 (aarch64) na macOS.
2. **Zasięg objawu**: wszystkie cztery napisy naraz — mój pierwszy model
   („tylko ta nazwa, która była na ekranie w chwili podmiany") był
   błędny, korekta w §2.3.
3. **Koszt bramki zaakceptowany** przez Mateusza: napisy mogą pojawić się
   po chwili, byle bez błędu. Wariant docelowy „litery jako ścieżki"
   zostaje udokumentowaną rezerwą, gdyby bramka nie wystarczyła na
   fizycznym Firefoksie.
4. **Kolejność rundy**: najpierw domknięcie D-T1 (merge + potwierdzenie na
   fizycznym Firefoksie), potem opis zgłoszeń #2 i #3 → D-T2/D-T3.
