# Runda poprawek nr 3 (po rundzie 2, przed Etapem 7)

Status: **W TOKU** (start 2026-08-04).
Zakres wejściowy: jedno zgłoszenie Mateusza z testów na fizycznej maszynie
(hero strony głównej w Firefoksie po pierwszym wejściu) + zapowiedziane dwa
mniejsze zgłoszenia, które dołączą do tej samej rundy jako **D-T2+**.
Na koniec rundy — osobną decyzją i osobnym commitem — zacieśnienie budżetów
LHCI do baseline'u po wyjściu Lenisa.

Numeracja decyzji: **D-T1 …** (T = trzecia runda poprawek).

---

## 1. Co zgłosił Mateusz (lista wejściowa)

| #   | Zgłoszenie                                                                                                                                                  | Widok / środowisko          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Napis na hero jest „rozjechany": obok liter wypełnionych zdjęciem stoi ta sama nazwa jeszcze raz — biała, grubsza, przesunięta o kilka(naście) pikseli. Naprawia to dopiero odświeżenie strony albo lekka zmiana rozmiaru okna | `/`, desktop, **Firefox 153.0.1 (aarch64) na macOS**, pierwsze wejście na stronę |
| 2   | (zapowiedziane, opis po zamknięciu #1)                                                                                                                        | —                           |
| 3   | (zapowiedziane, opis po zamknięciu #1)                                                                                                                        | —                           |

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

---

## 4. Implementacja — pliki

**PR A — D-T1**

| Plik | Zmiana |
| ---- | ------ |
| `src/components/sections/home/HomeHero.astro` | stałe `HERO_FONT`/`HERO_FONT_TEXT` w frontmatterze; skrypt `is:inline` z `define:vars` **przed markupem hero** (zakłada `hero-wait`, zdejmuje po `document.fonts.load(...)`, twardy timeout 2500 ms); reguła `:global(html.hero-wait) .hero-d svg { display: none }` w gałęzi desktopowej; `[data-font-text]` na `.hero-d` jako kontrakt testu |
| `tests/e2e/index.spec.ts` | cztery nowe asercje kontraktu bramki (§5) |
| `docs/analiza-strona-glowna.md` | dopisek o bramce fontu przy hero desktop |
| `docs/analiza-poprawki-3.md`, `docs/README.md` | ten dokument + wpis w indeksie |

Skrypt siedzi w komponencie hero, a nie w `Home.astro`: stoi w markupie
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

## 6. Rachunek baseline'ów

| PR  | Co zmienia się wizualnie | Pliki do regeneracji |
| --- | ------------------------ | -------------------- |
| A   | nic w stanie ustalonym — zmienia się wyłącznie to, co widać przez pierwsze ~60–90 ms zimnego wejścia | **0** |

Każdy ewentualny diff pokazuję **obrazkiem** przed jakąkolwiek
regeneracją. Święta kolejność bez zmian: kod → workflow „Update linux
visual baselines" z brancha PR-a → `git pull` → lokalne
`pnpm test:visual:update` → commit darwin na końcu.

## 7. Podział na PR-y

1. **PR A — `fix/hero-font-swap-firefox`** (D-T1): bramka + testy + dopiski
   w dokumentacji. Razem z nim jedzie osobny commit dokumentacyjny
   (ten plik + wpis w `docs/README.md`).
2. **PR B, C — zgłoszenia #2 i #3** (D-T2+), po opisie od Mateusza.
3. **PR ostatni — budżety LHCI**: osobny commit, liczby z zielonego
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

1. **Środowisko zgłoszenia**: Firefox 153.0.1 (aarch64) na macOS.
2. **Zasięg objawu**: wszystkie cztery napisy naraz — mój pierwszy model
   („tylko ta nazwa, która była na ekranie w chwili podmiany") był
   błędny, korekta w §2.3.
3. **Koszt bramki zaakceptowany** przez Mateusza: napisy mogą pojawić się
   po chwili, byle bez błędu. Wariant docelowy „litery jako ścieżki"
   zostaje udokumentowaną rezerwą, gdyby bramka nie wystarczyła na
   fizycznym Firefoksie.
4. **Kolejność rundy**: najpierw domknięcie D-T1 (merge + potwierdzenie na
   fizycznym Firefoksie), potem opis zgłoszeń #2 i #3 → D-T2/D-T3.
