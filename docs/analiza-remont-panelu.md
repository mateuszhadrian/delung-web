# Remont ścieżki wgrywania treści przez panel `/admin`

Status: **WYKONANE** (2026-08-05; zaakceptowane przez Mateusza, wdrożone
w gałęzi `feat/remont-panelu`). Zakres: schemat kolekcji realizacji,
pola panelu Sveltia, walidacja, miniatura wideo i to, co klient widzi na
ekranie. Poprzedza Etap 7 (umowa i przekazanie) — instrukcje panelu są
pozycją nr 2 checklisty tego etapu, więc rozjazd dokumentu z rzeczywistością
jest tu droższy niż gdziekolwiek indziej.

Numeracja decyzji: **D-RP1 …** (RP = remont panelu).

Dokumenty, które ten remont **koryguje**:

- `instrukcja-cms.md` §4 (tabela sterowa, pola 7–8), §5 (dwa osobne kadry),
  §6 („zasada pary" — przestaje obowiązywać), §11 (katalog błędów),
- `instrukcja-panelu-klient.md` kroki 5–7,
- `.claude/rules/cms-realizacje.md` (schemat docelowy),
- `.claude/rules/sections.md` (galeria detalu, poster wideo).

---

## 1. Lista wejściowa

### 1.1. Zgłoszenia Mateusza (po realnym przeklikaniu panelu)

| #   | Zgłoszenie                                                                                                 | Gdzie boli                     |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------ |
| M1  | Pierwsza pozycja galerii ma **zawsze** być kaflem — koniec osobnego pola „Kafel (cover)"                      | panel, schemat                 |
| M2  | Na pierwszą pozycję **nie da się** wrzucić filmu                                                             | panel, walidacja               |
| M3  | Miniatura filmu ma powstawać **automatycznie ze środkowej klatki**                                           | panel, strona                  |
| M4  | Pozycja galerii to **albo zdjęcie, albo film** — wrzucenie filmu ma wykluczyć zdjęcie i odwrotnie             | panel                          |
| M5  | Etykieta parametru ma się pokazywać na stronie **zawsze wielkimi literami**, cokolwiek wpisze klient          | strona                         |
| M6  | Plakat wideo pokazujący jednolity ekran — **odłożone świadomie**, wracamy po M3                               | `/realizacje/`, desktop Chrome |

Mateusz zastrzegł, że po wdrożeniu przetestuje wgrywanie ponownie i lista
może się jeszcze wydłużyć. Ten dokument opisuje rundę pierwszą.

### 1.2. Zestawienie z zakresem znanym z promptu (A–D)

| Zakres z promptu                    | Odpowiednik na liście Mateusza | Status                                                      |
| ----------------------------------- | ------------------------------ | ----------------------------------------------------------- |
| A — miniatura wideo z klatki         | M3                             | wchodzi, i to jako **fundament**, nie ozdoba (patrz §3.4)     |
| B — koniec pola „Kafel (cover)"      | M1                             | wchodzi                                                      |
| C — pierwsza pozycja bez wideo       | M2                             | wchodzi                                                      |
| D — plakat = jednolity ekran         | M6                             | **odłożone** decyzją Mateusza (D-RP9)                         |
| —                                    | **M4** (XOR zdjęcia i filmu)   | **nowe** — najgłębsza zmiana schematu w całej rundzie          |
| —                                    | **M5** (etykiety wielkimi)     | **nowe** — jedyna pozycja niezwiązana ze schematem            |

M4 zmienia model danych mocniej niż A–C razem wzięte: pozycja galerii
przestaje być „zdjęcie plus opcjonalny film", a staje się **jednym z dwóch
wykluczających się wariantów**. To dlatego A przestaje być udogodnieniem —
pozycja z filmem nie ma już zdjęcia, więc klatka z `/cdn-cgi/media` zostaje
**jedynym** źródłem miniatury.

---

## 2. Stan zastany — z pomiaru, nie z pamięci

### 2.1. Co naprawdę siedzi w danych

Zrzut wszystkich dziesięciu wpisów (5 produkcyjnych + 5 fixture'owych):

| Wpis                                | `cover`                  | `gallery[0]`                   | zgodne? |
| ----------------------------------- | ------------------------ | ------------------------------ | ------- |
| `kuchnia-kaszmirowa`                | kashmir-01 `50% 42%`     | kashmir-01 `50% 42%`           | ✅      |
| `kuchnia-monochromatyczna`          | mono-01 `50% 55%`        | mono-01 `50% 55%`              | ✅      |
| `kuchnia-orzech-czern`              | orzech-01 `50% 58%`      | orzech-01 `50% 58%`            | ✅      |
| `zabudowa-sypialni`                 | sypialnia-01 `50% 32%`   | sypialnia-01 `50% 32%`         | ✅      |
| **`kuchnia-biala-testowa`**         | kuchnia-biala1.png       | kuchnia-biala1.png **+ WIDEO** | ⚠️ §6.2 |
| _fixture_ `biala-kuchnia-zlote-detale` | white-01 `50% 52%`    | **white-02 `62% 55%`**         | ⚠️ §6.3 |
| _fixture_ pozostałe cztery          | = `gallery[0]`           | = `cover`                      | ✅      |

Dwa wnioski, które sterują decyzjami:

1. **Pułapka dwóch kadrów jest hipotetyczna, nie zastana.** Instrukcja
   ostrzega (słusznie), że kadr kafla i kadr galerii to osobne pola, bo
   proporcje są różne: kafel mobile prawie kwadratowy (`1.034`), kafel desktop
   poziomy (`1.384`), galeria **pionowa** (`330/412`). Mimo tego **w ośmiu na
   dziewięć porównywalnych przypadków obie wartości są identyczne** — jedyny
   wyjątek jest w fixture, czyli w materiale, który sam kontroluję. Klient nie
   dobierał dwóch kadrów ani razu.
2. **M1 i M2 zderzają się na realnym wpisie klienta.** `kuchnia-biala-testowa`
   (dodany 2026-08-05, commit `f4a8a02`) ma film dokładnie na pierwszej pozycji
   galerii. Wpis dziś poprawny stanie się po remoncie niepoprawny — migracja
   tego jednego wpisu to nie przepisanie pola, tylko przebudowa galerii.

### 2.2. Cloudflare Media Transformations — zmierzone na produkcji

| Sprawdzenie                              | Wynik                                                       |
| ---------------------------------------- | ----------------------------------------------------------- |
| `mode=frame,time=1s,width=960`           | **200**, `image/jpeg`, 27 714 B                              |
| `time=3s` / `time=5s`                    | 200, JPEG, 40 565 B / 43 364 B — czyli `time` realnie działa |
| `cache-control`                          | `public, max-age=1728000` (20 dni), `cf-cache-status: HIT`   |
| `time=600s` (poza długością klipu)        | **400** `text/plain` — czytelny błąd, nie zepsuty obrazek    |
| host `media.delung.pl` zamiast `delung.pl` | 200 — endpoint działa na obu                                 |

Czyli: bez Cloudflare Stream, bez ffmpeg, bez zmian w infrastrukturze —
dokładnie na zasadzie `imgAt()`. Klatka jest **JPEG-iem**, cache'owanym po
stronie Cloudflare, więc koszt drugiego i kolejnych wyświetleń jest zerowy.

### 2.3. Negocjacja formatu obrazów (kontekst pod M6)

`format=auto` wybiera format po nagłówku `Accept` żądania:

| `Accept` żądania              | Co wraca            | Rozmiar     |
| ----------------------------- | ------------------- | ----------- |
| `image/avif,image/webp,…`     | **AVIF**            | 24 667 B    |
| `image/webp,*/*`              | WebP                | 583 408 B   |
| `*/*`                         | oryginalny PNG      | 1 276 811 B |

### 2.4. Próba odtworzenia M6 — nieudana, i to jest wynik

Otwarcie modala `kuchnia-biala-testowa` na produkcji, pomiar odchylenia
standardowego pikseli kadru (jednolite pole = odchylenie bliskie zeru):

| Środowisko                              | Kadr z wideo                | Werdykt          |
| --------------------------------------- | --------------------------- | ---------------- |
| headless Chromium 1440×900              | odchylenie 29,6 · średnia 210 | poster maluje się |
| **prawdziwy Chrome, okno, czysty profil** | odchylenie 53,0 · średnia 132 | poster maluje się |
| kontrola: sąsiednie kadry-zdjęcia       | 55,5 i 59,1                 | tak samo          |

Odpadły przy okazji dwie hipotezy, które wyglądały obiecująco:

- **format nie ma z tym nic wspólnego** — osobna sonda z czterema wariantami
  (`format=auto`/AVIF, `format=webp`, klatka JPEG, kontrolny `<img>`) pokazała
  poprawny render we wszystkich czterech,
- **klonowanie kadrów też nie** — modal buduje galerię `cloneNode`-em
  i mimo to poster jest na miejscu.

Zostaje więc środowisko Mateusza (profil, rozszerzenia, cache albo sprzętowa
warstwa kompozycji wideo, która przed pierwszą klatką potrafi wyjść jako
jednolity prostokąt). Decyzja: **nie zgadujemy dalej** — patrz D-RP9.

### 2.5. Co obsługuje przypięta Sveltia 0.170.0

Sprawdzone **w binarium z jsDelivr**, nie w dokumentacji najnowszej wersji
(docs projektu zwracają dziś 404 na stronach widgetów):

- **warianty pozycji listy** — `types` + `typeKey` (domyślnie `type`),
  w kodzie flaga `hasVariableTypes`: obecne i używane przez widget listy,
- `min` / `max` listy z walidacją (`rangeUnderflow` / `rangeOverflow`).

To jest klucz do M4: panel potrafi wymusić „albo zdjęcie, albo film"
**sam z siebie**, bez czekania na build.

---

## 3. Decyzje

### D-RP1 — pozycja galerii to WARIANT: „Zdjęcie" albo „Film"

Pozycja przestaje być obiektem `{image, position?, video?, duration?}`.
Staje się jednym z dwóch wariantów, rozróżnianych kluczem `type`:

```jsonc
{ "type": "photo", "image": "https://media.delung.pl/…/kashmir-01.webp", "position": "50% 42%" }
{ "type": "video", "video": "https://media.delung.pl/…/klip.mp4", "duration": "0:24" }
```

W panelu klient przy dodawaniu pozycji wybiera jej rodzaj i widzi **tylko
pola tego rodzaju**. Wykluczenie z M4 jest wtedy własnością formularza, a nie
regułą, o której trzeba pamiętać — **nie da się** wypełnić obu naraz, więc
nie ma czego walidować po fakcie.

**Dlaczego nie prościej** (dwa opcjonalne pola + kontrola w Zodzie): bo
kontrola w Zodzie działa dopiero w buildzie, czyli minuty po tym, jak klient
zamknął panel i wyszedł. Wariant przenosi tę regułę o cały etap wcześniej —
do momentu, w którym klient jeszcze patrzy na formularz. To jest dokładnie ta
różnica, o którą prosi M4 („żeby w panelu było tak, że…").

**Koszt:** klucz `type` musi trafić do **wszystkich** pozycji galerii we
wszystkich dziesięciu wpisach — czyli migracja (D-RP7).

### D-RP2 — pierwsza pozycja galerii JEST kaflem; pole `cover` znika

Realizuje M1. `cover` wypada ze schematu, z panelu i z instrukcji.

**Jeden kadr, bez `coverPosition`.** Rozważyłem dodanie drugiej, opcjonalnej
wartości kadru na pierwszej pozycji (bo proporcje kafla i galerii naprawdę są
różne — §2.1). Odrzucam:

- w zastanych danych **nikt nigdy nie potrzebował dwóch różnych wartości** —
  osiem na dziewięć par jest identycznych, dziewiąta jest w moim fixture;
- pole, które w praktyce zostaje puste, jest w formularzu **czystym kosztem** —
  klient musi je zobaczyć, zrozumieć i pominąć, przy każdym wpisie;
- cała rzecz jest odwracalna w pięć minut, gdyby realny materiał klienta
  zaczął tego wymagać. Ryzyko jest **ciche** (nic nie pada, kafel jest po
  prostu źle przycięty), więc wchodzi na listę rzeczy do obejrzenia okiem po
  pierwszej sesji klienta — a nie do zabezpieczania polem na zapas.

**Konsumenci zostają nietknięci.** `viewProject()` w `work-data.ts` policzy
`cover` z pierwszej pozycji galerii i poda komponentom w tym samym kształcie
co dziś. Dzięki temu `WorkIndexCard.astro` i `HomeRealizacje.astro` nie
zmieniają ani linijki — a to są dokładnie te dwa miejsca, które pilnują
baseline'y wizualne siatki i sceny na stronie głównej.

### D-RP3 — pierwsza pozycja musi być zdjęciem (Zod + komunikat po ludzku)

Realizuje M2. Panel tego nie wymusi — Sveltia nie ma walidacji warunkowej
zależnej od **pozycji** elementu na liście. Łapie to `.superRefine`, czyli
`pnpm test:unit` w 2 sekundy i build w CI.

Komunikat ma mówić o polu i czynności, nie o ścieżce Zoda:

> Pierwsza pozycja galerii jest kaflem realizacji na liście — musi być
> zdjęciem. Przenieś film na dalszą pozycję.

Trzy rzeczy zmniejszające szansę, że klient w to wejdzie:

1. etykieta pola niesie regułę: **„Galeria (pierwsza pozycja = kafel na
   liście)"**,
2. w liście wariantów **„Zdjęcie" stoi pierwsze**, więc domyślny wybór jest
   poprawny,
3. oba dokumenty opisują to jako znany przypadek (`instrukcja-cms.md` §11 —
   tabela „objaw → co poprawić w panelu").

### D-RP4 — miniatura filmu = klatka ze środka, `videoFrameAt()` w `img.ts`

Realizuje M3. Siostrzana funkcja obok `imgAt()`, w tym samym pliku — bo
`src/lib/img.ts` jest **jedynym miejscem wiedzy o adresach mediów** i ta
zasada zostaje:

```ts
videoFrameAt(videoSrc, duration?) → https://…/cdn-cgi/media/mode=frame,time=<t>s,width=960/<videoSrc>
```

- **skąd „środek":** z pola „Długość wideo". `"0:24"` → 24 s → `time=12s`.
- **brak długości:** `time=1s` (zmierzony, działa). Film bez podanej długości
  dostaje klatkę z pierwszej sekundy — gorszą, ale zawsze jakąś.
- **nieparsowalna wartość** (`"ok. pół minuty"`): tak samo jak brak — `1s`.
- **dev:** endpoint nie istnieje lokalnie, więc funkcja nie zwraca postera
  (kadr jest pusty). To samo zachowanie co `imgAt()`, które w dev oddaje
  oryginał — i ten sam wniosek: **nie debuguj miniatur wideo na localhoście.**

Funkcja jest czysta, więc dostaje własny test jednostkowy (kształt URL-a,
parsowanie `m:ss`, oba fallbacki).

### D-RP5 — „Długość wideo" zostaje OPCJONALNA i steruje klatką

Zgodnie z wyborem Mateusza. Wypełniona → lepsza miniatura **i** podpis przy
znaczku play (jak dziś). Pusta → klatka z 1 s, bez podpisu. Nic nowego nie
staje się wymagane, a wypełnienie pola daje klientowi widoczną korzyść — to
lepsza zachęta niż druga w kolejności przyczyna czerwonego builda.

**Ryzyko:** długość wpisana z sufitu (`5:00` dla klipu 20-sekundowego) →
`time=150s` → Cloudflare zwraca **400** → pusty poster. Nie pada nic poza
miniaturą, ale objaw jest cichy. Zapis w obu instrukcjach: podawaj realną
długość, bo strona liczy z niej klatkę.

### D-RP6 — w galerii zostaje `<video poster>`, tylko źródło postera się zmienia

Najmniejsza możliwa zmiana po stronie renderu: `poster` przestaje wskazywać
`imgAt(item.image)` (którego dla filmu już nie ma), a zaczyna
`videoFrameAt(item.video, item.duration)`. Reszta mechaniki 4.4 —
`preload="none"`, brak `controls`, ikonka kamery, tap w kadr, podgląd
pełnoekranowy, tap = pauza — **zostaje nietknięta**.

Rozważyłem wariant dalej idący: kadr w galerii jako zwykły `<img>` z klatką,
a `<video>` tworzony dopiero w podglądzie, gdy film ma zagrać. To likwiduje
całą klasę usterek plakatu naraz (łącznie z M6, niezależnie od jego
przyczyny) i oszczędza pobieranie metadanych wideo. **Odkładam to**, bo:

- Mateusz świadomie odłożył M6 do czasu, aż zobaczy efekt samej podmiany
  klatki — a ten wariant przebudowałby `open-detail.ts` (klonowanie kadrów,
  start odtwarzania w geście użytkownika, maski w testach wizualnych, spec
  e2e sprawdzający `paused === false`), czyli wniósłby ryzyko do PR-a, który
  ma być przede wszystkim zmianą schematu;
- jeśli M6 przeżyje podmianę klatki, ten wariant jest gotową odpowiedzią
  i wraca jako osobna, wąska zmiana.

### D-RP7 — etykiety parametrów wielkimi literami: CSS, nie dane

Realizuje M5. `text-transform: uppercase` na `.dt-spec b` w `WorkDetail.astro`
(oba progi — mobile i desktop mają osobne reguły).

**Dlaczego nie w danych ani nie przy renderze:** wielkie litery są tu decyzją
**typograficzną** (design ma `letter-spacing: .18em` i wagę 500 — to jest
kapitalik z makiety), a nie faktem o treści. Zapis w CSS zostawia dane
nietknięte, nie psuje czytników ekranu (odczytają oryginał, nie literowanie)
i nie wymaga migracji. Zastane etykiety już są wielkimi literami, więc
**zero zmian na zrzutach** — reguła zadziała dopiero, gdy klient wpisze coś
małą literą.

### D-RP8 — migracja skryptem, jednorazowo, za zgodą Mateusza

Zgodnie z wyborem Mateusza (opcja „skryptem, za Twoją zgodą"). To świadomy
wyjątek od zasady twardej nr 2 (`src/content/realizacje/*.json` pisze
wyłącznie Sveltia) — traktowany jak wyjątek: jeden commit, tylko migracja,
opisany w PR-ze. Szczegóły i weryfikacja w §6.

### D-RP9 — M6 (plakat) odłożony do czasu wdrożenia klatki

Zgodnie z decyzją Mateusza. Po wdrożeniu D-RP4/D-RP6 poster przestaje być
AVIF-em wyliczanym z osobnego zdjęcia, a staje się **JPEG-iem z klatki filmu**
— zmienia się i format, i adres, i moment powstania. Jeśli objaw zniknie,
temat jest zamknięty bez dochodzenia. Jeśli przeżyje, wracamy z materiałem
dowodowym (zrzut z kolorem tła, wersja Chrome'a, powtarzalność, skutek
twardego odświeżenia) i z gotowym wariantem `<img>` z D-RP6.

### D-RP10 — podbicie Sveltii PO remoncie, osobną gałęzią

Zgodnie z wyborem Mateusza. Remont wchodzi na znanej wersji **0.170.0** —
tej, w której warianty listy zostały zweryfikowane w binarium. Podbicie do
~0.180.0 to osobna gałąź, osobne przeklikanie `/admin` i **nigdy w dniu
szkolenia klienta**.

---

## 4. Jak to wygląda po zmianie — trzy miejsca naraz

Reguła `.claude/rules/cms-realizacje.md`: schemat zmienia się **jednocześnie**
w Zodzie, w panelu i u konsumentów.

### 4.1. `src/content.schema.ts`

```ts
const photoItem = z.object({
  type: z.literal("photo"),
  image: z.string(),
  position,
});
const videoItem = z.object({
  type: z.literal("video"),
  video: z.string(),
  duration: z.string().optional(),
  position,
});

gallery: z
  .array(z.discriminatedUnion("type", [photoItem, videoItem]))
  .min(1)
  .superRefine((items, ctx) => {
    if (items[0]?.type !== "photo") ctx.addIssue({ … });
  });
```

`cover` znika. Reszta pól bez zmian.

### 4.2. `public/admin/config.yml`

```yaml
- label: "Galeria (pierwsza pozycja = kafel na liście)"
  name: "gallery"
  widget: "list"
  label_singular: "Pozycja galerii"
  min: 1
  types:
    - label: "Zdjęcie"
      name: "photo"
      summary: "{{fields.image}}"
      fields: [ Zdjęcie, Kadr ]
    - label: "Film"
      name: "video"
      summary: "{{fields.video}}"
      fields: [ Wideo MP4, Długość wideo, Kadr ]
```

Sekcja „Kafel (cover)" wypada w całości. Etykieta pola „Wideo MP4" traci
dopisek „zdjęcie wyżej staje się posterem" (przestaje być prawdą) i dostaje
w zamian informację o automatycznej miniaturze.

### 4.3. Konsumenci (`src/components/sections/work/*`)

| Plik                   | Zmiana                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `work-data.ts`         | typy wariantów; `viewProject()` **wylicza** `cover` z `gallery[0]`                           |
| `WorkDetail.astro`     | rozgałęzienie po `type` zamiast po obecności `video`; `poster` z `videoFrameAt()`; uppercase etykiet specs |
| `WorkIndexCard.astro`  | **bez zmian** (dostaje `cover` w tym samym kształcie)                                        |
| `HomeRealizacje.astro` | **bez zmian** (jw.)                                                                          |
| `open-detail.ts`       | **bez zmian** (D-RP6 zostawia `<video>` w kadrze)                                             |
| `src/lib/img.ts`       | nowa `videoFrameAt()`                                                                        |

---

## 5. Wpływ na testy

| Warstwa                                   | Co się zmienia                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `tests/unit/cms-contract.test.ts`         | walidacja wszystkich JSON-ów nową schemą; **nowy kontrakt**: `config.yml` ma oba warianty o nazwach `photo`/`video` (wzorzec istniejącego testu selecta kategorii) |
| `tests/unit/` (nowy)                      | `videoFrameAt()`: kształt URL-a, `m:ss` → środek, fallback przy braku i przy śmieciu                                  |
| `tests/unit/` (nowy)                      | pierwsza pozycja galerii = zdjęcie: schemat **odrzuca** wpis z filmem na pozycji 1 (weryfikacja w obie strony)        |
| `tests/e2e/work.spec.ts`                  | do przejrzenia: odtwarzanie wideo (`paused === false`) — mechanika nietknięta, ale wpis fixture zmienia kształt        |
| `tests/visual/work-index.spec.ts`         | **maski** celują dziś w `locator("video")` — po D-RP6 element wideo zostaje, więc maski działają dalej; do potwierdzenia przy przebiegu |
| `tests/fixtures/realizacje/`              | migracja pięciu wpisów (§6.3)                                                                                        |

**Baseline'y — prognoza i to, co wyszło z pomiaru.** Zakładałem, że zmiana
dotknie zrzutów wpisu fixture z filmem (`biala-kuchnia-zlote-detale`), bo
w galerii detalu ubywa zdjęcie `white-03`. **Prognoza była błędna:
`pnpm build:visual && pnpm test:visual` to 203 zielone testy i ZERO nowych
baseline'ów.**

Powód jest pouczający i warto go pamiętać przy każdej przyszłej zmianie
treści realizacji: **na preview endpointy `/cdn-cgi/` nie istnieją**, więc
wszystkie zdjęcia realizacji są pustymi kadrami — o pikselach decyduje
wyłącznie LAYOUT, a nie to, który plik jest podpięty. Przetasowanie zdjęć
między pozycjami jest dla testu wizualnego niewidzialne; zobaczyłby dopiero
zmianę liczby kadrów (licznik, dashes) albo geometrii. Fixture celowo
zachował cztery pozycje, więc nawet licznik `01/04` został ten sam.

Wniosek operacyjny: **testy wizualne nie chronią doboru zdjęć ani kadrów** —
to zostaje na oku, na produkcji.

---

## 6. Plan migracji

### 6.1. Kształt operacji

Jednorazowy skrypt (`scripts/`, kasowany po użyciu albo zostawiony
z komentarzem — do ustalenia), dla każdego pliku:

1. usuń klucz `cover`,
2. dopisz `"type": "photo"` do każdej pozycji galerii,
3. wpisy z filmem — rozbij pozycję na dwie (§6.2),
4. zachowaj formatowanie zgodne z tym, co pisze Sveltia (tablice
   wielolinijkowe) — pliki są w `.prettierignore`, więc formater ich nie
   wyrówna.

**Weryfikacja:** `pnpm test:unit` (kontrakt CMS nową schemą) + `pnpm build`
+ `pnpm build:visual`, a na koniec `CHECK_REMOTE_MEDIA=1` — bo migracja
przestawia adresy mediów między kluczami i warto potwierdzić, że wszystkie
nadal wskazują na istniejące obiekty w R2.

### 6.2. Wpis klienta z filmem na pierwszej pozycji

`kuchnia-biala-testowa` dziś:

```
cover:      kuchnia-biala1.png
gallery[0]: kuchnia-biala1.png + WIDEO kuchnia-zielona-vid.mp4 (0:10)
gallery[1]: kuchnia-biala2.png
gallery[2]: kuchnia-biala3.png
```

Po migracji — pozycja zerowa rozdziela się na zdjęcie i film, czyli **nic nie
ginie**, a film przesuwa się o jedno miejsce:

```
gallery[0]: photo  kuchnia-biala1.png      ← kafel, ten sam plik co dotąd
gallery[1]: video  kuchnia-zielona-vid.mp4 (0:10) ← miniatura z klatki 5 s
gallery[2]: photo  kuchnia-biala2.png
gallery[3]: photo  kuchnia-biala3.png
```

Kafel na liście zostaje bez zmian, galeria zyskuje jedną pozycję, film dalej
jest w realizacji. To najbardziej zachowawcze rozwiązanie z możliwych — ale
dotyka treści klienta, więc **wymaga osobnego potwierdzenia** (§8).

### 6.3. Fixture wizualny

`biala-kuchnia-zlote-detale` jest dziś jedynym wpisem, w którym kafel i
pierwsza pozycja galerii to **inny plik i inny kadr** — czyli jedyne miejsce,
gdzie scalenie pól coś realnie zmienia. Propozycja docelowego kształtu:

```
gallery[0]: photo  white-01  50% 52%   ← kafel bez zmian (był w cover)
gallery[1]: photo  white-02  62% 55%
gallery[2]: video  spike-test.mp4 (0:25)
gallery[3]: photo  white-04  50% 55%
```

Cztery pozycje, tyle samo co dziś. Kafel zostaje identyczny (siatka i scena
na `/` bez ruchu), a fixture **celowo ćwiczy nowy kształt**: zdjęcie na
pierwszej pozycji, film w środku. Znika `white-03` (było zdjęciem-plakatem
filmu) i duplikat `white-01` z końca.

Przypomnienie z kontraktu testów: fixture jest **niezależny od treści
produkcyjnej** — nie synchronizuję go z `src/content/realizacje`, zmieniam
tylko dlatego, że zrzut ma świadomie pokazać inny układ. Stąd baseline'y
w tym samym PR-ze.

---

## 7. Podział na PR-y

| PR      | Zakres                                                                                                  | Baseline'y      |
| ------- | --------------------------------------------------------------------------------------------------------- | --------------- |
| **A**   | M5 — etykiety parametrów wielkimi literami (CSS, dwa progi)                                                | brak (dane już są wielkimi) |
| **B**   | M1+M2+M3+M4 razem: schemat w trzech miejscach, `videoFrameAt()`, migracja treści i fixture, testy, **obie instrukcje** | brak (zmierzone, §5) |

**Jak weszło w praktyce.** Mateusz zdecydował o jednej gałęzi
(`feat/remont-panelu`) i wszystkich commitach naraz, więc podział A/B stracił
sens organizacyjny: M5 to trzy linie CSS **w tym samym pliku**
(`WorkDetail.astro`), który zmienia też M3 — rozdzielanie ich na osobne
commity wymagałoby dzielenia jednego pliku między commity bez żadnego zysku.
Weszły jako jeden commit implementacyjny, poprzedzony osobnym commitem
z tym dokumentem.

**Dlaczego B jest jednym PR-em, a nie czterema.** M4 zmienia kształt pozycji
galerii; M1 zmienia to, czym jest pozycja pierwsza; M2 nakłada na nią warunek;
M3 daje miniaturę pozycji, która po M4 nie ma już zdjęcia. Każde z nich
osobno zostawiłoby repo w stanie, w którym schemat, panel i treść mówią co
innego — a to jest dokładnie ta niespójność, przed którą ostrzega reguła CMS
(„przechodzi lokalnie, wybucha w CI przy pierwszym wpisie z panelu").
Rozdzielać można to, co da się wdrożyć niezależnie; tutaj się nie da.

PR A idzie pierwszy, bo jest niezależny i zeruje ryzyko — dzięki temu diff
PR-a B zostaje czysto schematyczny.

Po obu PR-ach: aktualizacja `docs/README.md` (wpis dla tego pliku) i sekcji
„Stan projektu" w `CLAUDE.md`.

---

## 8. Rozstrzygnięcia Mateusza (2026-08-05)

1. **Zgoda na tknięcie `src/content/realizacje/*.json`** skryptem
   migracyjnym — udzielona wprost. Skrypt: `scripts/migrate-realizacje-gallery.mjs`
   (idempotentny, z trybem `--dry`), zostaje w repo jako zapis tego, co
   dokładnie stało się z treścią klienta.
2. **Film w `kuchnia-biala-testowa` zostaje jako druga pozycja** (§6.2) —
   kafel bez zmian, nic nie ginie.
3. **Kadr w wariancie „Film" zostaje.**

Do rozstrzygnięcia po remoncie, zgodnie z decyzją Mateusza: M6 (D-RP9)
i podbicie Sveltii (D-RP10). Mateusz zapowiedział ponowne przeklikanie
wgrywania — lista może się jeszcze wydłużyć.

## 9. Ryzyka

| Ryzyko                                                                                          | Waga    | Co z tym robimy                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| ~~UI wariantów listy w Sveltii 0.170 zachowuje się inaczej, niż zakłada projekt~~                  | **ZAMKNIĘTE** | przeklikane 2026-08-05 — §10                                                                            |
| Klient wpisze nieprawdziwą długość → klatka spoza filmu → 400 → pusty poster                      | średnia | zapis w obu instrukcjach; objaw widoczny okiem od razu po zapisie                                            |
| Migracja psuje formatowanie JSON-ów i Sveltia pokazuje wpis inaczej                                | średnia | skrypt trzyma konwencję Sveltii; kontrola = otwarcie zmigrowanego wpisu w panelu                             |
| Cichy błąd kadru po scaleniu pól (D-RP2)                                                          | niska   | zastane dane nie korzystały z dwóch kadrów; obejrzeć okiem po pierwszej sesji klienta                        |
| M6 przeżyje podmianę klatki                                                                       | niska   | gotowy wariant `<img>` z D-RP6, wraca jako wąska zmiana                                                      |

---

## 10. Weryfikacja w panelu (Mateusz, 2026-08-05)

Przeklikane w **trybie lokalnego repozytorium** Sveltii („Work with Local
Repository", `showDirectoryPicker` — Chromium), czyli bez commitów na
GitHub. To jest właściwy sposób testowania zmian schematu: zwykłe logowanie
pisze wprost na `main` (`branch: main` w `config.yml`), więc zapis nowego
kształtu na niezmergowanej gałęzi zatrzymałby build produkcji.

| Co sprawdzone | Wynik |
| --- | --- |
| Panel rozumie zmigrowane wpisy (klucz `type`) | ✅ pozycje z podpisami, film rozpoznany |
| Dodanie pozycji pyta o rodzaj („Zdjęcie" / „Film") | ✅ dwie opcje, pola tylko wybranego rodzaju |
| Zmiana rodzaju **istniejącej** pozycji | ❌ **nie da się** — trzeba usunąć i dodać nową |
| Zmiana kolejności pozycji | ✅ przeciąganiem |
| **Co Sveltia zapisuje do JSON-a** | ✅ **dokładnie `"type": "photo"` / `"type": "video"`** — diff pokazał wyłącznie przestawienie pozycji, klucze nietknięte |
| Strażnik pierwszej pozycji | ✅ film na pozycji 1 → `test:unit` czerwony, komunikat po polsku |

**Brak możliwości zmiany rodzaju uznany za zaletę** (decyzja Mateusza):
pozycja jest tym, czym została utworzona, więc nie ma stanu pośredniego,
w którym pola jednego rodzaju zostają po drugim. Do obu instrukcji dopisane
jako znany przypadek („usuń i dodaj nową").

### Dlaczego panel nie blokuje zapisu z filmem na pierwszej pozycji

Pytanie Mateusza po teście: skoro to błąd, czemu panel pozwala zapisać?

Sprawdzone w binarium 0.170.0: Sveltia waliduje **wyłącznie pojedyncze
pola** — `valueMissing` (wymagane) i `patternMismatch` (wzorzec regex).
**Nie ma żadnego hooka walidacji całego wpisu**, więc reguła zależna od
tego, co stoi na której pozycji listy, nie ma się gdzie zaczepić.

Rozważona alternatywa (**odrzucona**): kod przestaje być wybredny i bierze
za kafel pierwsze ZDJĘCIE znalezione gdziekolwiek w galerii, więc build
nigdy nie staje. Odrzucone, bo zamienia błąd głośny i jednorazowy na cichy
i powtarzalny: klient stawia film na początku, na liście pojawia się kafel
z **innego zdjęcia** niż to, które widzi na górze formularza, i uczy się, że
„strona wybiera sobie sama". Traci też ważność zdanie, które ma paść na
szkoleniu — „pierwsza pozycja to okładka".

Zostaje więc: schemat zatrzymuje build (produkcja stoi na ostatniej dobrej
wersji, nic nie ginie, naprawa = przeciągnięcie pozycji), a panel **ostrzega
zawczasu** tekstem `hint` pod polem galerii — jedynym środkiem, jaki tu ma.
