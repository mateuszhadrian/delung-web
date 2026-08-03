# Runda poprawek nr 2 (po Etapie 6, przed Etapem 7)

Status: **plan do akceptacji** (data: 2026-08-03).
Zakres: 4 zgłoszenia Mateusza z testów na fizycznych urządzeniach — dwa
wydajnościowo-geometryczne (Safari na macOS, hero mobile w przeglądarkach
iOS spoza Safari/Chrome), jedno treściowe (link do opinii Google) i jedno
strukturalne (`/realizacje/`). Zgłoszenia dotykają trzech różnych widoków,
więc — jak w rundzie poprzedniej (`analiza-poprawki-wizualne.md`) — trafiają
do wspólnego dokumentu, a decyzje korygujące wcześniejsze ustalenia są
opisane jako **KOREKTA D-…** i dublowane dopiskiem w analizie widoku.

Numeracja decyzji: **D-Q1 … D-Q4** (Q = druga runda poprawek).

---

## 1. Co zgłosił Mateusz (lista wejściowa)

| #   | Zgłoszenie                                                                                                      | Widok / środowisko                                                     |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Scroll strasznie klatkuje po wejściu na `delung.pl`; Chrome bez problemu, Firefox ledwo zauważalnie               | `/`, desktop, **Safari na macOS** (MacBook Pro M1, zasilanie, bez LPM)  |
| 2   | Przy pierwszym (i każdym kolejnym) chowaniu/pokazywaniu paska URL tekst hero „przeskakuje" po zdjęciu             | `/`, mobile, iPhone 12 mini + 15 Pro                                    |
| 3   | Link „Zobacz więcej opinii w Google" pokazuje pustą stronę                                                       | `/` + `/o-nas/`, mobile                                                 |
| 4   | Szyna wyboru kategorii odkleja się od navbara po chwili scrollowania — filtry są dostępne tylko u góry strony     | `/realizacje/`, mobile                                                  |

### Wyniki testów diagnostycznych (odpowiedzi Mateusza)

**#1 — lokalizacja problemu jest jednoznaczna:**

- z systemowym **Ogranicz ruch** scroll jest płynny; co więcej, przełączenie
  tej opcji **przy żywej karcie** naprawia płynność natychmiast (bez
  restartu Safari), a restart Safari + ponowne wejście przywraca klatkowanie
  → sprawcą jest coś, co wyłącza `@media (prefers-reduced-motion: reduce)`,
  a nie stan procesu/pamięci;
- klatkuje **wyłącznie na stronie głównej** (`/oferta/`, `/realizacje/` są
  płynne). Odczytałem to wtedy jako „to nie Lenis, bo Lenis działa wszędzie
  tak samo" — **błędnie**: Lenis okazał się warunkiem koniecznym, tyle że
  drogę do przemalowania ma tylko strona główna (D-Q1). Lekcja: lokalizacja
  objawu wskazuje miejsce kosztu, nie jego przyczynę;
- klatkuje **wyłącznie dopóki widać choćby skrawek pierwszego ekranu**;
  po zjechaniu do drugiej sekcji jest płynnie, po powrocie w górę znowu
  klatkuje → koszt jest w hero desktop, nie w scenach przypiętych niżej;
- ciepły cache nic nie zmienia → to nie pobieranie ani dekodowanie plików.

**#2 — to nie jest bug DuckDuckGo:** ten sam objaw dają **Firefox iOS,
Opera i Edge**; poprawnie działa **tylko Chrome iOS** (i Safari). Skok
występuje **za każdym razem** przy chowaniu i pokazywaniu paska. Objaw:
przy scrollu w dół od góry wjeżdża fragment zdjęcia dotąd schowany pod
navbarem, przy scrollu w górę chowa się z powrotem. W Edge dodatkowy pasek
(propozycja tłumaczenia strony) przesunął tekst względem zdjęcia **jeszcze
bardziej** — czyli geometria hero jest funkcją bieżącej wysokości viewportu.

**#3** — wariant CID (`maps.google.com/?cid=…`) sprawdzony klikiem na
telefonie: wizytówka otwiera się poprawnie, opinie widać po krótkim
przewinięciu pod mapę.

**#4** — zakres potwierdzony: szyna ma zostać przyklejona pod navbarem
przez całą listę kafli i odjechać dopiero z końcem listy (przy sekcji CTA
„Masz pomysł na własne wnętrze?" i stopce).

---

## 2. Stan zastany (co pokazał kod)

### 2.1. Hero desktop — anatomia pierwszego ekranu (`HomeHero.astro`)

Na pierwszym ekranie `/` na desktopie pracują **równolegle** dwie warstwy
animacji, obie w pętli ciągłej (26 s), obie wyłączane przez
`@media (prefers-reduced-motion: reduce)` (linie 594–609):

1. **Cztery kadry pełnoekranowe** (`.heroimg` × 4): `<img>` 1920×1075
   rozciągnięty na 106 % sekcji, `object-fit: cover`, crossfade `opacity`
   + Ken Burns (`scale(1→1.09)` + `translate3d`), każdy z
   `will-change: transform` i `backface-visibility: hidden` (linie 390–433).
   To cztery promowane warstwy wielkości całego viewportu.
2. **Typografia SVG** nad nimi (`z-index: 2`, viewBox 1440×900), cztery
   grupy `.herotxt`, każda złożona z:
   - `<use>` tekstu z filtrem `#hg-glow` — łańcuch **3 × feGaussianBlur**
     + feFlood/feComposite/feMerge (linie 137–157),
   - `<g clip-path="url(#hg-cN)">` (maska = kształt liter) zawierającej
     `<image>` o wymiarach **4002 × 2240 jednostek viewBoxa** (źródło
     1920×1075 skalowane `slice` ≈ ×2,08), z **CSS-owym
     `filter: brightness(1.25) contrast(1.05)`** (linia 453) i **animacją
     `translateX ±100 px`** trwającą 19–24 s w pętli `alternate`
     (linie 455–466).

**Dlaczego to jest kandydat numer jeden.** Element z filtrem CSS jest
renderowany i filtrowany **w całości**, a dopiero potem przycinany przez
`clip-path` przodka. Powierzchnia `<image>` to 4002 × 2240 jednostek
viewBoxa — przy oknie 1440 px i DPR 2 daje to rząd **8000 × 4480 pikseli
urządzenia (~36 Mpx)**, z czego maska liter przepuszcza kilka procent.
Ta powierzchnia jest przemalowywana w rytmie animacji `pan`, a transformy
wewnątrz poddrzewa z `filter` + `clip-path` **nie trafiają na kompozytor
w WebKicie** — więc każda klatka to praca głównego wątku, dokładnie na tym
samym wątku, który obsługuje scroll. Blink cache'uje ten przypadek lepiej
(Chrome płynny), Gecko pośrednio (Firefox „ledwo zauważalnie").

To **hipoteza** — mocna, bo tłumaczy komplet obserwacji Mateusza (tylko `/`,
tylko przy widocznym hero, ciepły cache bez znaczenia, reduce-motion leczy
natychmiast), ale przed zmianą kodu musi ją potwierdzić pomiar A/B na
prawdziwym Safari (D-Q1 krok 1). Nie zgaduję, która z dwóch warstw kosztuje:
mierzę.

### 2.2. Hero mobile — geometria wisi na bieżącej wysokości viewportu

- `.hero { height: calc(100svh - var(--hdr-h, 74px)) }` (linia 259),
- tekst: `.hero-in { position: absolute; inset: 0; justify-content: flex-end }`
  — kotwiczony do **dołu sekcji**,
- zdjęcie: `position: absolute`, `height: calc(100% * var(--hero-zoom) +
240px + var(--hero-up))`, `top` liczone z `100%` sekcji, `object-fit: cover`
  (linie 277–287),
- `home-scroll.ts` liczy parallax i postępy ze **sondy `100svh`**
  (linie 54–58).

Etap 4.2 wymienił `dvh` na `svh` właśnie po to, żeby chowany pasek nie
ruszał hero (`analiza-strona-glowna.md`, punkt 5 listy korekt). To było
konieczne, ale **niewystarczające**: `svh` jest stałe tylko wtedy, gdy
przeglądarka trzyma stały prostokąt webview i sama chowa paski „nad"
stroną. Przeglądarki iOS zbudowane na WKWebView, które przy chowaniu
własnego paska **zmieniają rozmiar webview** (DuckDuckGo, Firefox, Opera,
Edge), przeliczają wtedy `100svh` — a że zdjęcie jest `object-fit: cover`,
inna wysokość boksu to **inny kadr** i inny stosunek napisów do zdjęcia.
Obserwacja Mateusza z paskiem tłumaczenia w Edge jest tu rozstrzygająca:
im więcej chromu przeglądarki, tym większe przesunięcie.

Wniosek konstrukcyjny: `svh` to uprzejmość przeglądarki, nie gwarancja.
Jedyna stabilna referencja to wartość **zmierzona raz i przypięta**.

### 2.3. Link do opinii

`src/lib/opinie.ts:69` — `OPINIE_GOOGLE_URL` to adres desktopowego UI
wyszukiwarki (`tbm=lcl` + `rldimm` + `#lkt=LocalPoiReviews`). Google nie ma
tego widoku na mobile, stąd pusta strona. Równolegle `src/lib/jsonld.ts:26`
niesie `GOOGLE_LISTING_URL` = `https://maps.google.com/?cid=10496135886078434411`
(używany w `sameAs`) — wariant odporny na oba progi.

Weryfikacja tożsamości firmy: link „Udostępnij" z Map przysłany przez
Mateusza rozwija się do FID `0x427eafd1741faadb:0x91a9c3fa3bef5c6b`,
którego druga połówka to dziesiętnie **10496135886078434411** — dokładnie
ten CID, który mamy w kodzie. Identyfikator jest więc potwierdzony
niezależnym źródłem.

### 2.4. Szyna filtrów `/realizacje/`

`WorkIndexPage.astro:59` — `<nav class="re-rail">` siedzi **wewnątrz**
`<header class="re-head">`, a na mobile `.re-head` kończy się 20 px pod
szyną (`padding-block: 24px 20px`, linia 262). Element `position: sticky`
nigdy nie wychodzi poza blok zawierający, więc szyna „klei się" przez tyle
pikseli, ile zostało jej rodzicowi — i znika. Sama deklaracja jest
poprawna (`top: var(--hdr-h)`, D-R7); brakuje jej **zasięgu**.
Na desktopie problemu nie ma: tam `.re-head` jest sticky kolumną boczną
i trzyma się przez całą listę (linie 420–427).

---

## 3. Decyzje

### D-Q1. Klatkowanie w Safari: Lenis wychodzi z projektu (desktop)

Decyzja podjęta **na pomiarze**, nie na hipotezie. Sesja diagnostyczna
(3 rundy na fizycznym MacBooku Pro M1, Safari, zimny start przeglądarki
przed każdym wariantem; przełącznik warstw hashem `#dbg-…` w lokalnym
buildzie preview — rusztowanie usunięte po sesji) dała ten protokół:

| Wariant | Co wyłączał | Wynik |
| ------- | ----------- | ----- |
| kontrola | nic | klatkuje |
| `nosvg` | całą warstwę typografii SVG | **płynnie** |
| `nopan` | przesuwanie zdjęcia w literach | klatkuje (lżej) |
| `nofilter` | `brightness/contrast` na `<image>` | klatkuje |
| `noglow` | poświatę liter (3 × feGaussianBlur) | klatkuje |
| `nofade` | crossfade kadrów i grup tekstu | klatkuje |
| `nokb` / `nowc` | Ken Burns / promocję warstw kadrów | klatkuje |
| `fixA` | rasteryzacja zdjęcia przycięta do pasa liter (18× mniej powierzchni) | klatkuje |
| `fixB` | `fixA` + pan zdjęty z filtrowanego `<image>` na grupę | klatkuje |
| `fixC` | `fixB` + uproszczona poświata | klatkuje |
| `fixD` / `fixE` | promocja warstwy SVG (`will-change` / `translateZ(0)`) | klatkuje |
| `noimage` | zdjęcie w masce liter (maska zostaje) | **płynnie** |
| `noclip` | maskę liter (zdjęcie zostaje) | **płynnie** |
| `nomotion` | `home-scroll.ts` (Lenis zostaje) | klatkuje |
| `nolenis` | **Lenisa** (scroll natywny) | **płynnie** |

**Co z tego wynika.** Koszt nie leży w żadnym pojedynczym elemencie hero:
ani w powierzchni zdjęcia (fixA nie pomógł), ani w filtrach (`nofilter`,
`noglow`), ani w animacjach (`nopan`, `nofade`, `nokb`), ani w składaniu
warstw (fixD/fixE). Płacimy za **kombinację**: duży raster przycinany
maską w kształcie liter. Osobno każda połowa jest tania (`noimage`
i `noclip` — płynnie), razem są drogie do **przemalowania**. A przemalowanie
zdarza się przy każdej zmianie pozycji scrolla, bo Lenis pcha scroll
JS-em klatka po klatce; przy scrollu natywnym robi to kompozytor i koszt
znika (`nolenis` — płynnie). `home-scroll.ts` jest niewinny (`nomotion`
dalej klatkuje).

**Decyzja: Lenis wychodzi z projektu.** Uzasadnienie poza samą naprawą:

- **funkcjonalnie nic od niego nie zależy** — blokada scrolla nakładek ma
  natywny fallback (`overlay.ts:89`), a `/kategorie/` i `/kontakt/` jeżdżą
  natywnie od Etapów 4.3/5, więc ta ścieżka jest sprawdzona na produkcji;
- **na dotyku Lenisa nigdy nie było** (decyzja 4.2), więc zmiana dotyczy
  wyłącznie desktopu;
- **spójność**: dziś serwis ma dwa różne zachowania scrolla zależnie od
  trasy; po zmianie ma jedno;
- **budżet**: `smooth-scroll.ts` to 18 172 B raw / **5 293 B gz** —
  największy pojedynczy chunk JS w projekcie;
- **weryfikacja**: build bez Lenisa przetestowany przez Mateusza na Macu
  (Safari, Chrome, Firefox — pełna strona główna wraz ze scenami
  przypiętymi, `/proces-wspolpracy/`, `/o-nas/`) oraz na maszynie
  z Windows w sieci lokalnej. Sceny przypięte trzymają się scrolla,
  klatkowanie zniknęło.

**Rekompensata: wygładzenie paska.** Bez Lenisa Safari dostarcza zdarzenia
`scroll` rzadziej, niż faktycznie przewija (async scrolling), więc postęp
`--p` wariantu `over` navbara przechodził skokowo. Navbar dogania cel
**własną pętlą rAF** (lerp 0.18) — wygładzany jest wyłącznie pasek
(dekoracja), scroll strony zostaje w pełni natywny, a sceny przypięte
dalej czytają prawdziwą pozycję scrolla. Wariant zaakceptowany przez
Mateusza w teście A/B.

**Czego NIE robimy:** nie ruszamy hero. Typografia SVG, maska, poświata,
Ken Burns i pan zostają **1:1 z eksportem** — pomiar pokazał, że żadna
zmiana po tej stronie nie rozwiązuje problemu, więc każda byłaby psuciem
działającego efektu bez zysku.

**KOREKTA decyzji 4.2 i reguły `.claude/rules/scroll-lenis.md`**:
„Lenis TYLKO desktop, dotyk natywny" przechodzi w **„scroll natywny
wszędzie"**. Reguła zostaje przepisana (nie skasowana) — historia decyzji
i powód wyjścia biblioteki są warte zachowania. Znikają: zależność
`lenis`, `src/scripts/smooth-scroll.ts`, prop `smoothScroll` w
`BaseLayout` wraz z użyciami, gałęzie `window.__lenis` w `overlay.ts`
i helperach testów, atrybut `data-lenis-prevent-horizontal` na torze
karuzeli `/oferta/` (bez Lenisa nie ma czego blokować) oraz asercje
testów, które istnienia Lenisa pilnowały.

### D-Q2. Wysokość hero mobile przypięta raz — niezależna od paska przeglądarki

Hero przestaje pytać przeglądarkę o wysokość viewportu w trakcie scrolla:

- inline'owy skrypt **przed paintem** w `Home.astro` (obok istniejącej
  bramki `js-motion`) mierzy „mały" viewport raz — sondą `100svh`,
  z awaryjnym `window.innerHeight` — i zapisuje wynik jako `--vph`
  na `<html>` oraz `window.__vph`;
- `.hero` używa `height: calc(var(--vph, 100svh) - var(--hdr-h, 74px))`;
  dotychczasowa kaskada `100vh` → `100svh` zostaje jako degradacja bez JS;
- wartość przeliczamy **wyłącznie przy zmianie `innerWidth`** (obrót
  ekranu, zmiana okna). Zmiana samej wysokości = pasek przeglądarki albo
  klawiatura — świadomie ignorowana;
- `home-scroll.ts` bierze `vpH()` z `window.__vph` (sonda `100svh` zostaje
  fallbackiem), więc razem z boksem przestaje drgać parallax.

**ROZSZERZENIE decyzji 4.2 (`dvh` → `svh`)**: `svh` zostaje w kodzie jako
wartość startowa i fallback, ale nie jest już jedyną obroną. Konsekwencja
jest ta sama, co przyjęta w 4.2: po schowaniu paska pod hero wcześniej
wjeżdża pasek zaufania — to zaakceptowany standard, teraz identyczny we
wszystkich przeglądarkach.

**Zakres:** wyłącznie hero strony głównej (jedyne zgłoszone miejsce).
Pozostali konsumenci `svh` — `OfertaSection` (`min-height` karuzeli),
`OfertaProcesCta`, `KategorieSheets` (96svh), `.sheet` navbara (92svh) —
zostają nietknięci; trafiają do listy rzeczy do sprawdzenia na telefonie
(§8). Jeśli któryś okaże się równie ruchliwy, to osobna decyzja i osobny PR.

### D-Q3. Link do opinii = wizytówka po CID (jedno źródło prawdy z JSON-LD)

`OPINIE_GOOGLE_URL` przestaje być osobnym adresem — importuje
`GOOGLE_LISTING_URL` z `src/lib/jsonld.ts` (`https://maps.google.com/?cid=…`).
Zysk poza naprawą: dane strukturalne i link w treści nie mogą się już
rozjechać, a CID jest potwierdzony niezależnie (§2.3).

**KOREKTA D-P6**: wariant `tbm=lcl` + `#lkt=LocalPoiReviews` działał
wyłącznie na desktopie — kryterium „zweryfikowany klikiem" z poprzedniej
rundy zostało spełnione tylko na jednym progu. Nowe kryterium: link
klikany **na telefonie i na desktopie**, zanim wejdzie do kodu.

Świadomy koszt: na telefonie z zainstalowanymi Mapami Google system może
przejąć adres i otworzyć aplikację (użytkownik wychodzi z przeglądarki);
opinie są wtedy o jedno przewinięcie dalej. Wariant lądujący od razu na
liście opinii (`search.google.com/local/reviews?placeid=…`) wymaga
identyfikatora `ChIJ…`, którego nie da się wyprowadzić z CID-a — jeśli
Mateusz poda Place ID (Place ID Finder Google), wchodzi ten wariant,
a link CID-owy zostaje udokumentowanym fallbackiem. **Do rozstrzygnięcia
przed startem** (§10).

### D-Q4. Szyna filtrów klei się przez całą listę kafli

Na mobile `.re-head` dostaje `display: contents` — pudełko nagłówka
znika z układu, jego dzieci (kicker, h1, linijka, lead, szyna) stają się
dziećmi `.re-in`, a blok zawierający szyny rozciąga się na **całą listę**.
Szyna odkleja się dokładnie tam, gdzie kończą się kafle — czyli przed
sekcją CTA i stopką (zakres potwierdzony przez Mateusza).

Wyrównanie odstępów **co do piksela**, żeby zmiana była czysto
strukturalna: 24 px górnego paddingu nagłówka przechodzi na `.re-kick`,
20 px dolnego dolicza się do górnego paddingu `.re-grid` (16 → 36 px).
Cel: `work-index-top` bez różnicy wobec baseline'u. Na desktopie
`.re-head` wraca do `display: block` i cała gałąź ≥1024 zostaje nietknięta
(tam szyna ma pozostać elementem sticky kolumny bocznej).

Dlaczego nie przenosimy szyny w DOM-ie: na desktopie `.re-head` jest
sticky sidebarem niosącym nagłówek + szynę + kafelek telefonu jako jeden
przyklejony blok; wyjęcie szyny wymusiłoby przepisanie desktopowego
układu na grid i rozbicie tej jedności. `display: contents` dotyka
wyłącznie gałęzi mobilnej.

Dostępność: `<header>` zagnieżdżony w `<main>` nie jest punktem
orientacyjnym (to element generyczny), więc zniknięcie jego pudełka nie
zabiera semantyki; potwierdzam realnym przebiegiem axe (allowlista
zostaje pusta).

**KOREKTA D-R7**: „szyna sticky pod `--hdr-h`" dostaje zdefiniowany
**zasięg** — cała lista kafli, nie nagłówek. Sama wartość `top` bez zmian.

---

## 4. Implementacja — pliki

**PR A (drobne, pewne) — D-Q3 + D-Q4**

| Plik | Zmiana |
| ---- | ------ |
| `src/components/WorkIndexPage.astro` | `.re-head { display: contents }` na mobile + `display: block` w gałęzi ≥1024; kompensacja odstępów (`.re-kick` padding-top 24 px i zerowanie na desktopie, `.re-grid` padding-block 36/44) |
| `src/lib/opinie.ts` | `OPINIE_GOOGLE_URL` = `GOOGLE_LISTING_URL` z `jsonld.ts` + komentarz decyzji |
| `docs/analiza-realizacje.md` | dopisek KOREKTA D-R7 (zasięg sticky) |
| `docs/analiza-poprawki-wizualne.md` | dopisek KOREKTA D-P6 (link tylko desktopowy) |

**PR B (hero mobile) — D-Q2**

| Plik | Zmiana |
| ---- | ------ |
| `src/components/Home.astro` | inline'owy skrypt przed paintem: pomiar `--vph` + `window.__vph`, przeliczenie tylko przy zmianie szerokości |
| `src/components/sections/home/HomeHero.astro` | `.hero` na `calc(var(--vph, 100svh) - var(--hdr-h))` + komentarz decyzji |
| `src/components/sections/home/home-scroll.ts` | `vpH()` z `window.__vph`, sonda `100svh` jako fallback |
| `docs/analiza-strona-glowna.md` | dopisek ROZSZERZENIE (svh niewystarczające w przeglądarkach iOS spoza Safari/Chrome) |

**PR C (wyjście Lenisa) — D-Q1**

| Plik | Zmiana |
| ---- | ------ |
| `src/scripts/smooth-scroll.ts` | **kasacja** |
| `package.json` | zależność `lenis` won |
| `src/layouts/BaseLayout.astro` | kasacja propa `smoothScroll`, atrybutu `data-smooth-scroll` i bloku ładującego Lenisa |
| `src/components/{KategoriePage,ContactPage,PolicyPage}.astro` | zdjęcie propa `smoothScroll` |
| `src/scripts/overlay.ts` | gałęzie `window.__lenis` won — zostaje ścieżka natywna |
| `src/components/navbar/Navbar.astro` | wygładzanie `--p` własną pętlą rAF (rekompensata) |
| `src/components/sections/oferta/OfertaSection.astro` | atrybut `data-lenis-prevent-horizontal` won |
| `tests/helpers/scroll.ts` | gałęzie Lenisa won |
| `tests/e2e/{oferta,contact-index}.spec.ts` | asercje o istnieniu/braku Lenisa → asercja natywnego scrolla |
| `.claude/rules/scroll-lenis.md` | przepisana na „scroll natywny wszędzie" (z historią decyzji) |
| `CLAUDE.md` | wzmianki o Lenisie w stanie projektu i mapie |
| `docs/analiza-strona-glowna.md` | dopisek KOREKTA (Lenis wychodzi; hero bez zmian) |

## 5. Testy

**PR A**

- `tests/e2e/work-index.spec.ts` (**nowa asercja**, profile mobile):
  zjazd na koniec siatki kafli → górna krawędź `[data-rail]` dalej równa
  `--hdr-h` (±1 px), szyna widoczna; klik w kategorię z tej pozycji
  filtruje listę (czyli filtry są realnie użyteczne, nie tylko widoczne).
  Druga asercja: przy sekcji CTA szyna już nie jest przyklejona.
- `tests/unit/` (**nowy** `opinie.test.ts` albo rozszerzenie
  `jsonld.test.ts`): `OPINIE_GOOGLE_URL` identyczny z `GOOGLE_LISTING_URL`
  i pasujący do `maps.google.com/?cid=` — kontrakt jednego źródła prawdy.
- `tests/e2e/o-nas.spec.ts` (istniejący, `/google\.com/`) — musi zostać
  zielony bez zmian.
- `pnpm build && pnpm test:visual` — `work-index-top` **bez różnicy**
  (dowód, że kompensacja odstępów jest dokładna).
- `a11y.spec.ts` na `/realizacje/` — zero nowych wpisów w allowliście.

**PR B**

- `tests/e2e/index.spec.ts` (**nowy plik**, profile mobile): wejście na `/`,
  zapis wysokości `.hero` i pozycji zdjęcia względem sekcji → zmiana
  wysokości viewportu o −90 px **przy tej samej szerokości** (symulacja
  chowanego paska) → oba pomiary bez zmian (±1 px). Kontrola przeciwna:
  zmiana **szerokości** przelicza wysokość hero (mechanizm nie zamarza
  przy obrocie ekranu).
- `pnpm test:visual` — geometria pierwszego paintu identyczna, więc
  `index-top` bez różnicy.

**PR C**

- Automatu łapiącego klatkowanie w Safari **nie ma i nie będzie** —
  Playwright/WebKit to inny port i inna ścieżka kompozycji. Strażnikiem
  jest test Mateusza na fizycznym Macu (już wykonany na buildzie
  testowym, do powtórzenia na zmergowanym kodzie).
- `tests/e2e/oferta.spec.ts:144` (dziś: `window.__lenis` istnieje) →
  odwrócona: na desktopie **nie ma** Lenisa, scroll jest natywny.
  Analogicznie kontrakt `/kontakt/` (`contact-index.spec.ts`) — dotąd
  wyróżniał tę trasę, teraz opisuje regułę całego serwisu.
- Blokada scrolla nakładek na ścieżce natywnej: `work.spec.ts` /
  `kategorie.spec.ts` dostają asercję, że po zamknięciu detalu strona
  wraca na **tę samą pozycję** (dotąd tę ścieżkę pokrywały tylko dwie
  trasy bez Lenisa).
- Pełny `pnpm test:e2e` na 6 profilach — helpery scrolla przestają mieć
  gałąź Lenisa, więc każdy spec przewijający stronę jest tu regresją.
- `build` + `test:visual`: bez różnic (Lenis nie maluje nic własnego).

## 6. Rachunek baseline'ów

| PR  | Co zmienia się wizualnie | Pliki do regeneracji |
| --- | ------------------------ | -------------------- |
| A   | nic — `display: contents` z kompensacją odstępów, link to atrybut `href` | **0** (cel; gdyby kompensacja rozjechała się o piksel: `work-index-top` × 3 profile mobile × 2 platformy = 6) |
| B   | nic — pierwszy paint ma tę samą geometrię, zmienia się tylko odporność na późniejsze zmiany viewportu | **0** |
| C   | nic — Lenis nie maluje własnych pikseli, hero zostaje nietknięte | **0** |

Każdy diff pokazuję **obrazkiem** (`open test-results/*/…-diff.png`) przed
jakąkolwiek regeneracją. Święta kolejność bez zmian: kod → workflow
„Update linux visual baselines" z brancha PR-a → `git pull` → lokalne
`pnpm test:visual:update` → commit darwin na końcu.

## 7. Podział na PR-y

1. **PR A — `fix/realizacje-rail-i-link-opinii`** (D-Q3 + D-Q4): dwie
   drobne, niezależne poprawki bez baseline'ów — najkrótsza droga do
   zielonego. Razem z nimi jedzie **osobny commit dokumentacyjny**
   (`docs/etap-6-poprawki-prompt.md` + wpis w `docs/README.md`,
   komunikat gotowy w `.git/msg-e`) oraz ten dokument.
2. **Sesja diagnostyczna Safari** (bez PR-a) — **WYKONANA** (2026-08-03,
   3 rundy + test buildu bez Lenisa na Macu i maszynie z Windows).
   Protokół i wnioski w D-Q1.
3. **PR B — `fix/hero-mobile-viewport`** (D-Q2): przypięcie wysokości
   hero + nowy spec e2e.
4. **PR C — `refactor/scroll-natywny`** (D-Q1): wyjście Lenisa z projektu
   + wygładzenie paska. Największy PR rundy (kasacja zależności, prop
   `smoothScroll`, sprzątanie testów i reguły). Wchodzi **po** B, bo
   dotyka `BaseLayout` i helperów testów, na których stoi spec z PR-a B.

`CLAUDE.md` (wpis o rundzie + numery PR-ów) i status tego dokumentu
aktualizuję **na końcu rundy**, jednym wpisem.

## 8. Ryzyka i weryfikacja na fizycznym urządzeniu

- **D-Q2 → iPhone, komplet przeglądarek.** Po PR-ze B: DuckDuckGo,
  Firefox, Opera i Edge na obu iPhone'ach (12 mini i 15 Pro) —
  patrz, czy przy chowaniu i pokazywaniu paska napisy stoją nieruchomo
  względem zdjęcia (parallax przy scrollu zostaje — ma jechać płynnie,
  nie skokowo). Regresja do sprawdzenia tam, gdzie dziś jest dobrze:
  **Safari i Chrome na iOS oraz Chrome na Androidzie** — czy hero nie
  urosło/nie skurczyło się i czy CTA nadal mieści się nad paskiem.
- **D-Q2 → pozostali konsumenci `svh`.** Przy okazji tej samej sesji:
  karuzela `/oferta/` i karty kategorii (bottom sheety) w DuckDuckGo —
  czy przy chowaniu paska nie skaczą. Jeśli skaczą, to osobna decyzja
  (ta sama technika, inny zakres).
- **D-Q1 → powtórka na zmergowanym kodzie.** Test na buildzie testowym
  wypadł dobrze, ale po merge'u warto przejechać jeszcze raz: pierwszy
  ekran `/` w Safari po **zimnym starcie przeglądarki** (Mateusz ustalił,
  że to warunek konieczny odtworzenia), sceny przypięte na `/`,
  `/proces-wspolpracy/` i `/o-nas/`, oraz nakładki (detal realizacji,
  karty kategorii, menu mobilne) — bez Lenisa blokadę scrolla trzyma
  ścieżka natywna, więc sprawdzamy powrót na tę samą pozycję.
  Na dotyku nie powinno zmienić się nic (Lenisa tam nigdy nie było) —
  ale jedna kontrola na telefonie po merge'u jest tania.
- **D-Q4 → Android, limit warstw GPU.** Sticky pasek z własnym tłem nad
  długą listą zdjęć bywa miejscem, gdzie Android gubi warstwę: sprawdzić
  na telefonie, czy szyna nie miga i nie „ciągnie smug" przy szybkim
  scrollu, oraz czy poziome przewijanie szyny (kategorie) dalej działa
  po zjechaniu na dół listy.
- **Budżety LHCI**: żaden PR nie dokłada zasobów (zero nowych plików
  graficznych, zero nowych zależności), więc budżetów nie ruszamy.
  Wyjątek: gdyby pomiar D-Q1 wymusił dedykowane, przycięte kadry pod
  maskę tekstu — wtedy najpierw liczę transfer (desktop `total` ma dziś
  ~130 kB zapasu) i wracam z decyzją, zanim cokolwiek dodam.
- **Ryzyko `display: contents`** (D-Q4): technika jest wspierana wszędzie,
  gdzie testujemy, ale bywa źródłem niespodzianek w starszych silnikach
  — dlatego zmiana jest zamknięta w gałęzi <1024 i pilnowana zarówno
  testem e2e (pozycja szyny), jak i wizualnym (brak przesunięć).

## 9. Definition of done rundy

Ten dokument + wpis w `docs/README.md`; dopiski KOREKTA/ROZSZERZENIE
w `analiza-realizacje.md` (D-R7), `analiza-poprawki-wizualne.md` (D-P6)
i `analiza-strona-glowna.md` (hero mobile + hero desktop); zielone
lokalnie `format:check`, `lint`, `typecheck`, `test:unit`, `test:e2e`
(6 profili), `build` + `test:visual`; zero nowych wpisów w allowliście
axe; baseline'y regenerowane wyłącznie tam, gdzie zmiana wyglądu była
zamierzona (oba komplety w jednym PR); PR-y zielone na `quality` + `e2e`
+ `lighthouse`; po merge'u `prod-smoke` zielony; poprawki potwierdzone
przez Mateusza na fizycznych urządzeniach wg §8; `CLAUDE.md`
zaktualizowane (runda + numery PR-ów).

## 10. Rozstrzygnięcia (zamknięte)

1. **Link do opinii (D-Q3)**: wchodzi wariant z Place ID
   (`search.google.com/local/reviews?placeid=…`) — sprawdzony klikiem na
   telefonie (ląduje na wizytówce z opiniami) i na desktopie (panel
   lokalny z opiniami obok wyników). Link po CID zostaje udokumentowanym
   fallbackiem w komentarzu przy stałej.
2. **Sesja diagnostyczna Safari (D-Q1)**: wykonana, decyzja podjęta —
   Lenis wychodzi z projektu (protokół w D-Q1).
3. **Kolejne zgłoszenia**: Mateusz zgłosił dodatkowe problemy z maszyny
   z Windows (niski ekran) — wejdą do tej samej rundy jako **D-Q5+**,
   po zamknięciu D-Q1–D-Q4.
