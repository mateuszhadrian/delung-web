# Panel treści `/admin` — instrukcja operatorska

> **Dla kogo:** Mateusz. To jest dokument, z którego uczysz się panelu
> **przed** szkoleniem klienta i do którego wracasz, gdy coś się wywali.
> Wersja dla klienta (nietechniczna, do wydruku): `instrukcja-panelu-klient.md`.
>
> **Status:** szkielet zweryfikowany maszynowo z repo (etykiety pól, schemat,
> testy, workflow CI) — patrz §14. **Wszystko, czego nie da się sprawdzić
> z repo — czyli wygląd i nawigacja panelu Sveltia — jest oznaczone
> `⟦DO POTWIERDZENIA⟧`.** Po pierwszym realnym przejściu przez panel
> przejdź listę z §13 i zamień te miejsca na to, co faktycznie widziałeś.
> Dopiero wtedy dokument jest prawdziwy.

---

## 1. Co się dzieje pod spodem (model myślowy)

Panel nie ma bazy danych. To aplikacja w przeglądarce, która **pisze pliki
w repozytorium** i **wgrywa media do chmury** — dwa osobne kanały:

```
                    ┌── tekst wpisu ──→ commit JSON na main (GitHub API)
przeglądarka        │                   src/content/realizacje/<slug>.json
z panelem  ─────────┤
/admin              └── zdjęcia/film ─→ Cloudflare R2, bucket delung-media
                                        prefix realizacje/ → media.delung.pl

commit na main ──→ Cloudflare Pages: pnpm build ──→ delung.pl  (~2 min)
                   └─ walidacja Zod: zły wpis = build STOI, deploy NIE leci
```

Konsekwencje, które musisz mieć w głowie:

- **Treść wpisu i pliki media to dwie różne rzeczy w dwóch różnych miejscach.**
  Usunięcie wpisu kasuje JSON-a, ale **nie** kasuje zdjęć i filmów z R2 (§9).
- **Zdjęcie nie leży w repo** — w JSON-ie jest tylko adres
  `https://media.delung.pl/realizacje/…`. Schemat sprawdza, że to napis;
  **nie sprawdza, że plik istnieje** (§11).
- **Wpis niezgodny ze schematem zatrzymuje build.** Strona, która już stoi,
  nie znika — ale kolejne zmiany nie pojadą, dopóki błąd nie zostanie
  naprawiony (§11).
- Panel commituje **wprost na `main`**, z pominięciem PR-a i husky — konto
  `delung-cms` ma User-bypass w rulesecie `main-protection`. Ty i tak
  chodzisz przez PR-y.

Źródła prawdy, na których stoi ten dokument:

| Co | Gdzie |
| --- | --- |
| Etykiety pól, które klient widzi na ekranie | `public/admin/config.yml` |
| Co jest wymagane, co opcjonalne, co ma minimum pozycji | `src/content.schema.ts` |
| Lista kategorii (7 pozycji) | `src/lib/categories.ts` |
| Reguły CMS/media/R2/autoryzacji | `.claude/rules/cms-realizacje.md` |
| Pipeline dodania realizacji (dla sesji z Claude) | `.claude/skills/new-realizacja/SKILL.md` |
| Przygotowanie zdjęć i wideo u klienta | `delung-web-creation-process.md`, Część C |

---

## 2. Logowanie

**Adres:** `https://delung.pl/admin` (lokalnie, przy `pnpm dev`:
`http://localhost:4321/admin/index.html`).

Panel loguje przez GitHuba — kontem technicznym **`delung-cms`**
(collaborator z prawem zapisu wyłącznie do repo `delung-web`). Ty logujesz
się tym samym kontem, nie swoim: bypass w rulesecie ma tylko `delung-cms`,
więc commit z panelu na Twoim koncie odbiłby się od ochrony `main`.

Ścieżka techniczna, gdyby trzeba było diagnozować:

```
panel (delung.pl/admin)
  → Worker sveltia-cms-auth-delung  (https://auth.delung.pl)
  → OAuth App „Panel treści — delung.pl" na koncie mateuszhadrian
  → GitHub: login delung-cms + 2FA (TOTP na telefonie klienta, D3;
    recovery codes w Twoim menedżerze haseł)
  → powrót do panelu z tokenem
```

⟦DO POTWIERDZENIA⟧ Liczba i kolejność ekranów logowania (okienko GitHuba,
ekran zgody na uprawnienia OAuth, powrót do panelu) — opisz po pierwszym
realnym przejściu.

### Panel nie wpuszcza — diagnostyka od najczęstszego

1. **Klient nie ma kodu 2FA** (najczęstszy realny przypadek): telefon
   zgubiony/zmieniony, aplikacja TOTP odinstalowana. Ratunek: recovery codes
   z Twojego menedżera haseł → logowanie → **od razu** rekonfiguracja TOTP na
   nowym telefonie i wymiana zużytego kodu.
2. **Wchodzi z innego adresu niż `delung.pl`.** Worker ma białą listę domen
   (`ALLOWED_DOMAINS`: `delung.pl`, `localhost`, i wąsko
   `delung-web.pages.dev`). Wejście przez adres podglądowy Pages spoza tej
   listy = odbicie. Klientowi dawaj **wyłącznie** `delung.pl/admin`.
3. **Logowanie idzie, ale zapis nie.** Sprawdź, czy `delung-cms` nadal jest
   collaboratorem z prawem zapisu i czy ma wpis User-bypass (tryb Always)
   w rulesecie `main-protection`. Bypass był dodawany **przez API** — UI repo
   osobistego nie wyszukuje userów, więc nie zdziw się, że go tam nie widać
   tak, jak byś oczekiwał.
4. **Worker padł albo wygasł sekret OAuth.** Objaw: logowanie kręci się
   i wraca z błędem, ten sam symptom na Twoim komputerze i na telefonie
   klienta. Sprawdź Workera `sveltia-cms-auth-delung` w Cloudflare
   (zmienne `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, custom domain
   `auth.delung.pl`). To Twoja interwencja, nie klienta.
5. **Panel wygląda na pusty / nie ładuje się.** `public/admin/index.html`
   wciąga Sveltię z jsDelivr z **przypiętą** wersją (dziś `0.170.0`). Awaria
   CDN albo wycofanie wersji = pusty ekran. Nie podbijaj wersji „na szybko"
   przy kliencie na linii — to świadoma zmiana + test `/admin`.

---

## 3. Klucz do wgrywania zdjęć (R2 Secret Access Key)

`config.yml` niesie jawnie `account_id`, `access_key_id`, nazwę bucketa
`delung-media` i publiczny adres `https://media.delung.pl`. **Sekretu w repo
nie ma i nie może być** — Sveltia prosi o niego w panelu przy pierwszym
uploadzie i trzyma go w pamięci przeglądarki.

**Decyzja operacyjna (Etap 7): klucz konfigurujesz raz, sam, przy
przekazaniu.** Klient go nie zna i nie ma go wklejać. W wersji klienckiej
tego kroku nie ma w ogóle.

Praktyczne skutki, o których musisz pamiętać:

- Klucz siedzi **w konkretnej przeglądarce na konkretnym urządzeniu**.
  Nowy telefon, nowy komputer, inna przeglądarka, wyczyszczone dane
  przeglądarki, tryb prywatny → panel **znowu** o niego poprosi.
- Klient ma wtedy zadzwonić, nie szukać. Ty wklejasz klucz z menedżera haseł
  (zdalnie albo na miejscu). Jeżeli robisz to zdalnie — wpisujesz go sam
  przez udostępniony ekran, nie dyktujesz.
- Klient wgrywający zdjęcia z **czterech** urządzeń (Windows, Mac, iPhone,
  Android — tak wynika z ustaleń) to potencjalnie cztery takie telefony do
  Ciebie. Rozważ skonfigurowanie klucza od razu na tych urządzeniach, których
  realnie zamierza używać, zamiast czekać na pierwszy upload.

⟦DO POTWIERDZENIA⟧ Jak dokładnie wygląda prośba o klucz (kiedy się pojawia:
przy wejściu do biblioteki mediów czy przy pierwszym wyborze pliku; czy jest
opcja „zapamiętaj").

---

## 4. Dodanie realizacji — pole po polu

Kolekcja nazywa się **„Realizacje"**, pojedynczy wpis — **„Realizacja"**.
Na liście wpis pokazuje się jako tytuł, a podpisem jest tytuł i rok
w nawiasie (`summary: "{{fields.title}} ({{fields.year}})"`).

⟦DO POTWIERDZENIA⟧ Jak dojść od zalogowania do pustego formularza nowego
wpisu (ile ekranów, jak nazywa się akcja tworzenia nowego wpisu, gdzie leży
zapis).

**Kolejność pól w formularzu jest dokładnie taka jak niżej** — to kolejność
z `config.yml`. Etykiety w cudzysłowach cytuję dosłownie; klient widzi
dokładnie te napisy.

### Tabela sterowa

| # | Etykieta w panelu | Wymagane? | Co gdy puste / źle |
| --- | --- | --- | --- |
| 1 | „Slug (adres, np. kuchnia-kaszmirowa)" | **tak** | brak = wpis nie ma nazwy pliku; duplikat = nadpisanie innego wpisu |
| 2 | „Kolejność (mniejsze = wyżej)" | **tak** (domyślnie `10`) | steruje pozycją na obu listach (§7) |
| 3 | „Tytuł" | **tak** | widoczny na kaflu, w detalu i na liście w panelu |
| 4 | „Kategoria" | **tak** (lista wyboru) | decyduje o filtrze i o tym, gdzie wpis się pokazuje (§7) |
| 5 | „Rok realizacji" | **tak** | tekst, nie liczba — patrz niżej |
| 6 | „Opis" | **tak** | akapit w detalu realizacji |
| 7 | „Kafel (cover)" → „Zdjęcie" | **tak** | zdjęcie kafla na liście `/realizacje/` |
| 8 | „Kafel (cover)" → „Kadr (object-position, np. 50% 42%)" | nie | puste = kadr wyśrodkowany (§5) |
| 9 | „Galeria" | **tak, min. 1 pozycja** | zero pozycji = **build stoi** |
| 9a | pozycja → „Zdjęcie" | **tak** | zdjęcie w galerii detalu; przy filmie pełni rolę plakatu |
| 9b | pozycja → „Kadr (object-position, np. 50% 42%)" | nie | puste = kadr wyśrodkowany |
| 9c | pozycja → „Wideo MP4 (opcjonalne — zdjęcie wyżej staje się posterem)" | nie | puste = zwykłe zdjęcie, bez ikonki kamery |
| 9d | pozycja → „Długość wideo (np. 0:24 — opis przy znaczku play)" | nie | puste = film gra, tylko bez podpisu z czasem |
| 10 | „Parametry (specs)" | **tak jako lista, ale może być pusta** | zero parametrów przechodzi walidację — po prostu nie ma tabelki |
| 10a | parametr → „Etykieta (np. MATERIAŁY / BLAT / ZAKRES)" | **tak** | — |
| 10b | parametr → „Wartość" | **tak** | — |

Kolumna „wymagane" pochodzi ze schematu Zod (`src/content.schema.ts`), nie
z panelu — to schemat rozstrzyga, czy build przejdzie. Sprawdziłem obie
strony: **`required: false` w panelu i `.optional()` w schemacie zgadzają
się co do joty** dla wszystkich czterech pól opcjonalnych (`position`
w kaflu, `position` / `video` / `duration` w galerii). Jedyna asymetria to
domyślna wartość „Kolejność": panel podpowiada `10`, schemat w razie braku
pola przyjąłby `0` — bez znaczenia w praktyce, bo panel zawsze to pole
zapisuje.

### 1. „Slug (adres, np. kuchnia-kaszmirowa)"

Etykieta mówi „adres", ale **realizacje nie mają własnych adresów URL** —
detal otwiera się jako nakładka na `/realizacje/`. Slug robi trzy rzeczy:
jest nazwą pliku (`slug: "{{fields.slug}}"` → `kuchnia-kaszmirowa.json`),
identyfikatorem wpisu w kodzie strony i kluczem, po którym otwiera się detal.

Zasady: **małe litery, bez spacji, bez polskich znaków, myślniki zamiast
spacji.** Schemat tego **nie pilnuje** (przyjmie każdy napis), ale slug ląduje
w atrybutach HTML i w selektorze, którym strona wyszukuje detal — spacja
albo cudzysłów potrafi go rozwalić bez żadnego komunikatu o błędzie.

Testem pilnowana jest **unikalność** slugów. Dwa wpisy z tym samym slugiem to
jeden plik — drugi zapis po cichu nadpisze pierwszy.

### 2. „Kolejność (mniejsze = wyżej)"

Liczba całkowita, domyślnie `10`. Sortuje **obie** listy: pełną listę na
`/realizacje/` i zajawkę na stronie głównej, która bierze **pierwsze trzy**
wpisy po posortowaniu. Czyli: `order` decyduje nie tylko o kolejności, ale
i o tym, **co klient zobaczy na stronie głównej**.

Praktyka: numeruj z przerwami (10, 20, 30…), żeby dało się wcisnąć nową
realizację między dwie istniejące bez przenumerowywania wszystkiego. Dziś
wpisy testowe mają gęste `1–5` — przy wymianie na materiał klienta warto to
rozrzedzić. Dwa wpisy z tą samą liczbą nie wywalą strony, ale ich wzajemna
kolejność przestaje być przewidywalna.

### 3. „Tytuł"

Wolny tekst, wymagany. Wzorzec z istniejących wpisów: rzeczowy opis, nie
nazwa własna — „Kuchnia kaszmirowa z podświetlaną witryną", „Zabudowa
sypialni z tapicerowaną ścianą".

### 4. „Kategoria"

Lista wyboru, **siedem** pozycji — dokładnie te, co w `src/lib/categories.ts`
(spójności pilnuje test kontraktu, §14):

| Napis w panelu | Wartość zapisywana |
| --- | --- |
| „Kuchnie" | `kuchnie` |
| „Szafy i garderoby" | `szafy-garderoby` |
| „Wnętrza komercyjne i biura" | `wnetrza-komercyjne` |
| „Dekoracje okienne" | `dekoracje-okienne` |
| „Zabudowy łazienkowe" | `zabudowy-lazienkowe` |
| „Meble nietypowe" | `meble-nietypowe` |
| „Inne" | `inne` |

Uwaga na „Inne": kategoria istnieje w panelu i w filtrach, ale **celowo nie
ma własnej treści na `/oferta/`** — to worek na to, co nie pasuje nigdzie
indziej. Wpis w „Inne" pokaże się na `/realizacje/` normalnie.

### 5. „Rok realizacji"

To **pole tekstowe**, nie liczba — w JSON-ie zapisuje się jako `"2025"`.
Świadomie: da się wpisać „2024/2025" przy realizacji rozłożonej na dwa lata.
Rok trafia też do podpisu wpisu na liście w panelu.

### 6. „Opis"

Pole wielowierszowe. Trafia do detalu realizacji jako akapit. Wzorzec
z istniejących wpisów: dwa–trzy zdania o materiałach i tym, co było do
zrobienia — bez marketingowego lania wody.

### 7–8. „Kafel (cover)"

Zdjęcie **z listy** `/realizacje/` — pierwsze, co widać. Osobne pole od
galerii, ale w praktyce w czterech z pięciu istniejących wpisów kafel i
pierwsza pozycja galerii to **ten sam plik** (i to samo kadrowanie). To
dobra domyślna praktyka: nie mnóż plików bez potrzeby.

„Kadr (object-position, …)" — patrz §5.

### 9. „Galeria" (pozycja: „Pozycja galerii")

**Minimum jedna pozycja** — i to jest pilnowane po obu stronach: panel ma
`min: 1`, schemat `.min(1)`. Galeria bez pozycji zatrzyma build.

Istniejące wpisy mają 3–5 pozycji. Podpisem pozycji na liście w panelu jest
adres zdjęcia (`summary: "{{fields.image}}"`) — czyli po nazwie pliku
poznajesz, która to pozycja.

**Film jest polem wewnątrz pozycji galerii, nie osobną sekcją** — patrz §6.

### 10. „Parametry (specs)"

Lista par etykieta+wartość, tabelka w detalu. Konwencja z designu:
**etykieta wielkimi literami**. Repertuar z istniejących wpisów:

```
MATERIAŁY        Płyta lakierowana w kolorze kaszmiru, fornir dąb
BLAT             Spiek kwarcowy, łączenie na zamek
SYSTEMY / OKUCIA Zawiasy Blum, prowadnice Legrabox
ZAKRES           Projekt, produkcja, montaż, oświetlenie LED
ROK REALIZACJI   2025
```

Lista **może być pusta** — zero parametrów przechodzi walidację. Ale wtedy
detal traci tabelkę, która jest w tym portfolio najbardziej „stolarską"
częścią wpisu. Traktuj to jako pole do wypełnienia zawsze.

### Kompletny przykład — jak wygląda wynik

Tak wygląda plik, który panel zapisuje (`kuchnia-kaszmirowa.json`, skrót):

```json
{
  "slug": "kuchnia-kaszmirowa",
  "order": 1,
  "title": "Kuchnia kaszmirowa z podświetlaną witryną",
  "category": "kuchnie",
  "year": "2025",
  "description": "Ciepły kaszmir, fornirowana witryna z podświetleniem LED…",
  "cover": {
    "image": "https://media.delung.pl/realizacje/kashmir-01.webp",
    "position": "50% 42%"
  },
  "gallery": [
    { "image": "https://media.delung.pl/realizacje/kashmir-01.webp", "position": "50% 42%" },
    { "image": "https://media.delung.pl/realizacje/kashmir-02.webp", "position": "50% 50%" }
  ],
  "specs": [{ "label": "MATERIAŁY", "value": "Płyta lakierowana…" }]
}
```

Pola opcjonalne zostawione puste **nie pojawiają się** w pliku
(`omit_empty_optional_fields: true`) — dlatego wpisy bez filmu nie mają
w ogóle klucza `video`.

---

## 5. Zdjęcia

### Format

- **JPEG albo WebP.** **HEIC nie przejdzie** — Cloudflare nie przetworzy
  tego formatu i zdjęcie nie pokaże się na stronie. To domyślny format
  iPhone'a, więc jednorazowo na telefonie klienta:
  **Ustawienia → Aparat → Formaty → „Najbardziej zgodne"** (Część C.1).
  Android domyślnie robi JPEG — bez zmian.
- To jest jedyny realny sposób, żeby klient wystrzelił sobie w stopę przy
  zdjęciach. Zrób ten krok razem z nim na szkoleniu, nie zostawiaj jako
  zdanie w instrukcji.

### Rozmiar

Na stronę **nigdy nie trafia oryginał**: adresy przechodzą przez
`imgAt()` → Cloudflare Image Transformations (`/cdn-cgi/image/width=…`),
skalując do **320 px** na telefonie i **960 px** na desktopie, z konwersją
formatu do AVIF/WebP. Do R2 idzie **jeden** plik.

Praktyczna wskazówka dla klienta: **zdjęcie prosto z telefonu jest w sam
raz**, nie trzeba go zmniejszać. Higiena: nie wgrywaj plików grubszo niż
~10 MB — to tylko wolniejszy upload, bez korzyści (Część C.1).

Dla siebie, gdy przygotowujesz materiał: sensowne źródło to ~1920 px
szerokości; konwersja `node scripts/optimize-images.mjs <src> <out.webp> [szer]`.

**W dev/preview transformacje nie działają** (endpoint `/cdn-cgi/image`
istnieje tylko na produkcji) — lokalnie zawsze widzisz oryginał w pełnym
rozmiarze. Nie debuguj „złych rozmiarów obrazków" na localhoście.

### „Kadr (object-position, np. 50% 42%)" — jak dobrać bez zgadywania

Zdjęcie jest **przycinane** do kadru o stałych proporcjach (`object-fit:
cover`) — a proporcje są różne w różnych miejscach:

| Gdzie | Kształt kadru |
| --- | --- |
| kafel na liście, telefon | prawie kwadrat (`aspect-ratio: 1.034`) |
| kafel na liście, desktop | poziomy (`1.384`) |
| galeria detalu | **pionowy** (`330 / 412`) |

Pole „Kadr" mówi, **którą część zdjęcia zachować** przy przycinaniu. Zapis to
dwie liczby procentowe: **poziom, potem pion**.

- puste = `50% 50%` = środek zdjęcia,
- **pierwsza liczba**: `0%` trzyma lewą krawędź, `100%` prawą,
- **druga liczba**: `0%` trzyma **górę** zdjęcia, `100%` **dół**.

Metoda bez zgadywania — trzy kroki:

1. Zapisz wpis **bez** kadru (środek) i zobacz go na stronie.
2. Nazwij problem: „ucina górę szafek" → trzeba pokazać **wyżej** →
   **zmniejsz drugą liczbę**. „Ucina blat / dół zabudowy" → **zwiększ**.
3. Skacz co 10 punktów (`50% 40%`, `50% 30%`), aż będzie dobrze. Wartości
   z istniejących wpisów mieszczą się w `32%–58%` — to realny zakres,
   nie potrzeba tu precyzji co do procenta.

Pierwszą liczbę ruszaj rzadko — kadry na stronie są przycinane głównie
w pionie. Wyjątek to jeden istniejący wpis z `62% 55%`.

⚠️ Kadr kafla i kadr pozycji galerii to **osobne pola** — to samo zdjęcie
w kaflu i w galerii może potrzebować **innych** wartości, bo kadr kafla jest
poziomy, a galerii pionowy. W istniejących wpisach są takie same, bo kadry
były dobierane raz — nie traktuj tego jako reguły.

---

## 6. Wideo

### Przygotowanie (Część C.2)

Telefon nagrywa 100–300 MB na klip — **tego się nie wgrywa**. Klient dostaje
jednorazowo zainstalowanego **HandBrake'a** (darmowy, Windows i Mac)
z Twoim presetem **„Delung – strona www"**:

- kontener MP4, kodek **H.264**, profil High, **web optimized / faststart ✔**
  (bez tego film zacznie grać dopiero po pobraniu całości),
- 1080p, 30 fps, jakość RF 22–23, audio AAC 128 kbps albo bez audio,
- efekt: klip 20–30 s → zwykle **5–15 MB**.

Limit z reguły projektu: **H.264+AAC, 1080p, ≤ ~30 MB na klip.**

**HandBrake jest programem desktopowym.** Klient deklarował też pracę
z telefonu — z telefonu **da się** dodać realizację ze zdjęciami, ale **nie
da się** przygotować filmu. To trzeba powiedzieć wprost, żeby nie próbował
wgrać surowego nagrania z iPhone'a przez pole filmu.

### Zasada pary: film zawsze ze zdjęciem w tej samej pozycji

To najważniejsza rzecz w całym §6.

Film **nie jest osobną pozycją galerii**. Jest **polem wewnątrz** pozycji,
która ma już swoje zdjęcie — i to zdjęcie staje się **plakatem** (kadrem
widocznym, zanim film ruszy). Mówi to sama etykieta pola:
**„Wideo MP4 (opcjonalne — zdjęcie wyżej staje się posterem)"**.

```
Pozycja galerii
├── „Zdjęcie"                 ← WYMAGANE; przy filmie = plakat
├── „Kadr (object-position…)" ← opcjonalne, kadruje też plakat
├── „Wideo MP4 (…)"           ← opcjonalne
└── „Długość wideo (…)"       ← opcjonalne, np. 0:24
```

Konsekwencje:

- Pozycja z filmem, ale bez zdjęcia — **nie przejdzie walidacji** (`image`
  jest wymagane), więc build stanie.
- Film ładuje się dopiero na żądanie (`preload="none"`) — do tego czasu widać
  plakat. Brzydki plakat = brzydki kafel przez cały czas, gdy nikt filmu nie
  włączył. Zrzut ładnej klatki z filmu jest tu lepszy niż przypadkowe zdjęcie.
- Na stronie **nie ma paska odtwarzacza ani przycisku play** — jest ikonka
  kamery w rogu kadru, tap w kadr startuje film i otwiera podgląd
  pełnoekranowy, a w podglądzie tap przełącza pauzę. To celowa decyzja
  projektowa, nie brak — klientowi to pokaż, bo inaczej uzna, że film „nie
  działa".
- „Długość wideo (np. 0:24 — opis przy znaczku play)" to **tylko podpis**.
  Nie ucina filmu, nie steruje niczym. Pusta = brak podpisu.

### Dlaczego NIE wolno wgrywać przez bibliotekę mediów poza polami

Sveltia wgrywa pliki do R2 **tylko wtedy, gdy robi to przez pole wpisu** —
pole zdjęcia albo pole „Wideo MP4". Upload zrobiony w bibliotece mediów
**poza** polami **nie trafia do R2** (potwierdzone w Etapie 2, reguła
`cms-realizacje.md`). Objaw jest podstępny: plik wygląda na wgrany, wpis się
zapisuje, a na stronie nie ma obrazka.

Reguła dla klienta w jednym zdaniu: **zawsze klikaj w pole, do którego plik
ma trafić, i wgrywaj z niego.**

⟦DO POTWIERDZENIA⟧ Jak wygląda biblioteka mediów w tej wersji Sveltii i czy
da się w nią wejść „obok" pola — jeśli tak, opisz klientowi dokładnie, czego
ma nie klikać.

---

## 7. Kolejność i kategorie — co czym steruje

**„Kolejność (mniejsze = wyżej)"** sortuje rosnąco:

- pełną listę na `/realizacje/`,
- zajawkę na stronie głównej, która pokazuje **pierwsze trzy** wpisy z tego
  samego posortowania.

Czyli zmiana `order` w jednym wpisie potrafi wypchnąć inny ze strony głównej.
Powiedz o tym klientowi — to jedyne miejsce, gdzie liczba w formularzu ma
skutek daleko od edytowanego wpisu.

**„Kategoria"** steruje trzema rzeczami:

1. **Szyną filtrów na `/realizacje/`** — „Wszystkie" plus tylko te kategorie,
   które **mają co najmniej jeden wpis**. Kategorie puste **w ogóle się nie
   pokazują** (żadnych „(0)"). Skutek: dodanie pierwszej realizacji w nowej
   kategorii **zmienia szynę filtrów** — pojawia się nowy przycisk. Usunięcie
   ostatniej — znika.
2. **Adresem-skrótem do filtra**: `/realizacje/#kuchnie` otwiera listę od
   razu przefiltrowaną. Z tego korzystają przyciski na `/oferta/`
   i kartach `/kategorie/`.
3. **Zawartością kart kategorii** — przyciski „zobacz realizacje" na
   `/oferta/` prowadzą do przefiltrowanej listy.

**Czego kategoria NIE robi:** nie tworzy nowej sekcji na `/oferta/` ani nie
zmienia menu. Treść oferty żyje w kodzie (`oferta-content.ts`); kategoria
z panelu tylko filtruje realizacje. Nowa kategoria = zmiana w kodzie
(`src/lib/categories.ts` + trzy miejsca schematu, reguła `cms-realizacje.md`)
— **to nigdy nie jest zadanie dla klienta.**

---

## 8. Edycja wpisu i podmiana zdjęcia

**Edycja** to otwarcie istniejącego wpisu, zmiana pól i zapis. Mechanika jak
przy dodawaniu — panel robi kolejny commit na `main`, strona przebudowuje się
w ~2 minuty.

⟦DO POTWIERDZENIA⟧ Jak wygląda lista wpisów i wejście w edycję; czy Sveltia
sygnalizuje niezapisane zmiany przy wyjściu z formularza.

**Podmiana zdjęcia** — dwie różne operacje, których nie wolno mylić:

| Chcę… | Robię | Co zostaje w R2 |
| --- | --- | --- |
| pokazać inne zdjęcie w tej pozycji | wgrywam nowy plik do pola | **stary plik zostaje w R2** — osierocony |
| poprawić kadr istniejącego zdjęcia | zmieniam tylko pole „Kadr" | nic nowego nie przybywa |

Zanim wgrasz nowy plik, sprawdź, czy problemem nie jest **kadr** — połowa
„złych zdjęć" to dobre zdjęcie źle przycięte (§5).

Uwaga na współdzielone pliki: w istniejących wpisach ten sam plik bywa użyty
**w kaflu i w pierwszej pozycji galerii**. Podmiana w jednym miejscu nie
zmienia drugiego — a usunięcie „starego" pliku z R2 zepsuje to drugie
miejsce. Przed sprzątaniem R2 zawsze sprawdź, czy adres nie występuje
w pliku dwa razy (§9).

---

## 9. Usunięcie realizacji + sprzątanie R2

**Panel kasuje wpis. Panel NIE kasuje plików.** To nie jest kosmetyka: przy
zdjęciach to kilkaset kilobajtów, przy filmach — dziesiątki megabajtów za
sztukę, i płacisz za nie w nieskończoność, choć nikt ich nie widzi.

### Procedura, w tej kolejności

1. **Najpierw spisz adresy**, dopóki wpis jeszcze istnieje. Otwórz wpis
   w panelu i wypisz wszystkie adresy `media.delung.pl/realizacje/…`:
   kafel + każda pozycja galerii + każdy film. Albo — szybciej i pewniej —
   z repo:

   ```bash
   git pull
   grep -o 'https://media\.delung\.pl/realizacje/[^"]*' src/content/realizacje/<slug>.json | sort -u
   ```

2. **Sprawdź, czy któryś plik nie jest używany też gdzie indziej:**

   ```bash
   grep -rl '<nazwa-pliku>' src/content/realizacje/
   ```

   Więcej niż jeden plik w wyniku = **nie kasuj** tego pliku z R2.

3. **Usuń wpis w panelu** (kolekcja pozwala na usuwanie: `delete: true`).
4. **Posprzątaj R2** — patrz niżej.
5. `git pull` + `pnpm test:unit` — sanity check, że kolekcja dalej się
   waliduje i nie zostało po wpisie nic dziwnego.

### Gdzie dokładnie w dashboardzie Cloudflare

```
dash.cloudflare.com → R2 (menu po lewej) → bucket „delung-media"
  → zakładka z obiektami → folder „realizacje/"
```

Wszystkie media realizacji leżą **w jednym folderze `realizacje/`** — to
`prefix` z `config.yml`. Po czym poznasz swoje pliki:

- **Po nazwie.** Sveltia wgrywa plik pod nazwą, jaką miał na dysku klienta.
  Adres w JSON-ie `https://media.delung.pl/realizacje/kashmir-02.webp` to
  dokładnie obiekt `realizacje/kashmir-02.webp` w bucketcie — ostatni człon
  adresu to nazwa pliku, nic więcej.
- **Po dacie wgrania**, jeśli kasujesz świeżą pomyłkę.
- **Nigdy „na oko" po miniaturce** — nazwy typu `IMG_4471.jpeg` z telefonu
  klienta będą się powtarzać i mylić.

⚠️ **Higiena nazw.** Jeżeli klient wgra dwa różne zdjęcia o tej samej nazwie
(`IMG_0001.jpeg` z dwóch realizacji), to drugie może nadpisać pierwsze
w tym samym folderze — i zdjęcie w starszym wpisie po cichu się zmieni.
⟦DO POTWIERDZENIA⟧ Czy Sveltia dokleja sufiks przy kolizji nazw, czy
nadpisuje. **Sprawdź to celowo** przy pierwszym przejściu (ćwiczenie 6
w §12) — od odpowiedzi zależy, czy w wersji klienckiej ma być zdanie
„nadawaj plikom własne nazwy".

### Kontrola po sprzątaniu

Ten test przechodzi po każdym adresie z JSON-ów i sprawdza, czy plik istnieje
w R2 — czyli złapie sytuację „skasowałem za dużo":

```bash
CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts
```

Nie złapie sytuacji odwrotnej („zostawiłem śmieci w R2") — na to nie ma
narzędzia, jest tylko ta procedura. Warto raz na jakiś czas przejrzeć folder
`realizacje/` i porównać liczbę plików z liczbą adresów w repo:

```bash
grep -oh 'https://media\.delung\.pl/realizacje/[^"]*' src/content/realizacje/*.json | sort -u | wc -l
```

---

## 10. Co się dzieje po zapisaniu i jak sprawdzić, że wyszło

Kolejność zdarzeń:

1. Panel robi **commit na `main`** przez GitHub API, jako `delung-cms`
   (bypass w rulesecie `main-protection`, z pominięciem PR-a i husky).
2. Push na `main` odpala równolegle:
   - **Cloudflare Pages** — build (`pnpm build`) i deploy na `delung.pl`,
   - **GitHub Actions „CI"** — joby `quality`, `e2e`, `lighthouse`,
   - **GitHub Actions „Prod smoke"** — czeka na świeży deploy, potem puszcza
     testy przeciw `https://delung.pl`.
3. Po **~2 minutach** zmiana jest na produkcji.

**Jak sprawdzić, że wyszło** — od najtańszego:

1. **Otwórz `delung.pl/realizacje/`** i zobacz wpis. Jeśli nie ma, a minęły
   ponad 3 minuty — odśwież z pominięciem cache'u przeglądarki.
2. **`git pull && git log --oneline -3`** — commit od `delung-cms` musi być
   na górze. Nie ma commita = panel **nie zapisał** (to problem z logowaniem
   albo uprawnieniami, nie z buildem).
3. **`pnpm test:unit`** — 2 sekundy, waliduje nowy JSON tą samą schemą, którą
   sprawdza build, i daje czytelny raport zamiast wybuchu w środku builda.
4. **Zakładka Actions na GitHubie** — dwa zielone przebiegi (`CI` i
   `Prod smoke`) przy commicie CMS-a.
5. Przy nowych mediach:
   `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`.

---

## 11. Gdy coś pójdzie nie tak

### Co dokładnie się dzieje przy wpisie niezgodnym ze schematem

Zweryfikowane w `ci.yml`, `prod-smoke.yml` i `content.config.ts`:

- **Strona, która stoi, nie znika.** Cloudflare Pages publikuje **wynik
  udanego builda**; build, który padł, nie nadpisuje poprzedniego deploya.
  Zły wpis = produkcja zostaje na ostatniej dobrej wersji.
- **Ale publikacja staje.** Kolejne zmiany budują się z tego samego `main`,
  który wciąż zawiera zepsuty wpis — więc też padną. Dopóki błąd nie zostanie
  naprawiony, **nic nowego nie wchodzi na stronę**: ani nowe realizacje, ani
  Twoje zmiany w kodzie.
- **Dostaniesz o tym maila.** Push na `main` odpala job `quality`
  (`format:check → lint → typecheck → test:unit → build`) — zły JSON wywali
  się na `test:unit`, a gdyby prześlizgnął się dalej, to na `build`. Równolegle
  `Prod smoke` też buduje projekt i padnie w tym samym miejscu. Dwa czerwone
  przebiegi = dwa powiadomienia z GitHuba.

### Gdzie zobaczyć błąd

| Gdzie | Co pokazuje | Kiedy tam idziesz |
| --- | --- | --- |
| **lokalnie: `git pull && pnpm test:unit`** | dokładne pole i powód, w 2 s | **zawsze najpierw** |
| GitHub → Actions → `CI` → `quality` | to samo, tylko wolniej i przez przeglądarkę | gdy nie masz komputera z repo |
| Cloudflare → Pages → `delung-web` → deploymenty | log builda, „Failed" przy zepsutym | gdy build stoi, a testy są zielone |

Raport z `test:unit` wskazuje **plik i ścieżkę pola** (np. że
`gallery` ma zero pozycji albo że brakuje `cover.image`) — a stąd już wprost
wynika, które pole w panelu poprawić.

### Naprawa — w panelu, nie w repo

**Domyślna ścieżka to poprawka w panelu.** Praktycznie każdy błąd walidacji,
jaki może zrobić klient, jest błędem wypełnienia formularza:

| Objaw w raporcie | Co poprawić w panelu |
| --- | --- |
| `gallery` — za mało pozycji | dodać co najmniej jedną „Pozycję galerii" |
| brak `cover.image` / `gallery[n].image` | wgrać zdjęcie do pola „Zdjęcie" |
| `category` — niedozwolona wartość | wybrać kategorię z listy |
| brak `title` / `year` / `description` | wypełnić pole |
| dwa wpisy, jeden slug | zmienić „Slug" w nowszym wpisie |

Po poprawce panel robi kolejny commit, build rusza, po ~2 min jest czysto.
**Nie ma potrzeby rewertowania niczego** — zły wpis nie zdążył trafić na
produkcję.

### Kiedy potrzebna jest interwencja w repo (Ty, przez PR)

- **Zepsuty JSON na poziomie składni** — sytuacja teoretyczna (panel pisze
  poprawny JSON), ale gdyby ktoś ruszył plik ręcznie, panel może odmówić
  otwarcia wpisu. Wtedy: poprawka w repo przez PR.
- **Klient usunął wpis, który miał zostać** — przywrócenie z historii gita.
- **Trzeba wyprostować `order` w kilkunastu wpisach naraz** — technicznie
  do zrobienia w panelu, ale szybciej przez PR-a. Wyjątek od reguły
  „JSON-ów nie tykamy" wymaga Twojej świadomej decyzji.
- **Nowa kategoria** — zawsze kod (§7).

### Błędy, których walidacja NIE złapie

Ważne, żeby nie mieć fałszywego poczucia bezpieczeństwa:

| Błąd | Co się stanie | Kto to złapie |
| --- | --- | --- |
| zdjęcie skasowane z R2, adres został we wpisie | build zielony, na stronie dziura | tylko ręczne `CHECK_REMOTE_MEDIA=1` |
| zdjęcie w HEIC | build zielony, obrazek się nie wyświetla | oko na stronie |
| film 300 MB, bez faststart | build zielony, film ładuje się wieczność | oko na stronie |
| źle dobrany kadr | build zielony, ucięte zdjęcie | oko na stronie |
| bzdura w opisie, literówka w tytule | build zielony | nikt |

Wniosek operacyjny: **po każdej sesji klienta wejdź na `/realizacje/`
i przeklikaj to, co dodał.** Automat pilnuje kształtu danych, nie sensu.

---

## 12. Trening przed szkoleniem klienta

Ćwiczenia w kolejności rosnącej trudności. Rób je **na produkcji przez
panel** — na tym polega ćwiczenie; przed przekazaniem adres nie jest
upubliczniony (D5), więc nikt tego nie zobaczy. Po każdym ćwiczeniu jest
napisane, **co ma się pojawić** i **jak cofnąć skutki**.

> **Materiał testowy z Etapu 2 — status.** W repo jest dziś **pięć wpisów
> testowych**: cztery kuchnie (`kuchnia-kaszmirowa` `order 1`,
> `kuchnia-orzech-czern` `2`, `kuchnia-monochromatyczna` `4`,
> `biala-kuchnia-zlote-detale` `5`) i jedna zabudowa sypialni
> (`zabudowa-sypialni` `3`, kategoria „Szafy i garderoby"). Teksty pochodzą
> z designu, media to **placeholdery w R2**; `biala-kuchnia-zlote-detale`
> niesie w trzeciej pozycji galerii film `spike-test.mp4` ze spike'u Etapu 2.
> **Wszystkie pięć to materiał treningowy** — zgodnie z D5/D6 przed
> przekazaniem idą do wymiany na materiał klienta (już przez panel, jego
> rękami, z Twoją asystą). Do tego czasu ćwicz **na kopiach, nie na nich**:
> ćwiczenie 1 zakłada dodanie **nowego** wpisu, który potem kasujesz.

### Ćwiczenie 1 — wpis bez filmu, od zera

Dodaj realizację `test-trening-01`, kategoria „Meble nietypowe" (dziś pusta
— to celowe), `order` 90, trzy zdjęcia w galerii, komplet parametrów.

- **Ma się pojawić:** kafel na dole listy `/realizacje/` **oraz nowy przycisk
  „Meble nietypowe" w szynie filtrów** — bo to pierwszy wpis w tej kategorii
  (§7). Detal otwiera się po tapnięciu w kafel.
- **Cofnięcie:** usuń wpis w panelu + skasuj trzy pliki z `realizacje/` w R2
  (§9). Przycisk filtra ma zniknąć.

### Ćwiczenie 2 — wpis z filmem

To samo, ale jedna pozycja galerii dostaje film przepuszczony przez
HandBrake'a Twoim presetem. Ustaw też „Długość wideo".

- **Ma się pojawić:** w galerii detalu ikonka kamery w rogu kadru; tap
  startuje film i otwiera podgląd pełnoekranowy; tap w podglądzie pauzuje.
  Przed odtworzeniem widać zdjęcie z **tej samej** pozycji.
- **Sprawdź świadomie:** czy film startuje szybko (faststart) i ile waży plik
  w R2. To jest ta liczba, którą będziesz cytował klientowi.
- **Cofnięcie:** jak wyżej — **koniecznie z filmem włącznie**. Film jest
  najdroższą rzeczą, jaką można zostawić w buckecie.

### Ćwiczenie 3 — edycja istniejącego wpisu

Na wpisie z ćwiczenia 1: zmień tytuł, dopisz parametr, zmień `order` z 90
na 0 (zero — żeby nie robić remisu z `kuchnia-kaszmirowa`, która ma 1).

- **Ma się pojawić:** wpis skacze na **początek** listy `/realizacje/`
  **i wchodzi do trójki na stronie głównej**, wypychając stamtąd
  `zabudowa-sypialni`. To jest efekt, który musisz umieć klientowi
  przewidzieć na głos, zanim kliknie zapis.
- **Cofnięcie:** wróć z `order` na 90.

### Ćwiczenie 4 — podmiana zdjęcia i dobranie kadru

Na tym samym wpisie: najpierw popraw **kadr** kafla (§5), zobacz efekt.
Dopiero potem podmień plik zdjęcia na inny.

- **Ma się pojawić:** przy zmianie kadru — inny wycinek tego samego zdjęcia,
  bez nowego pliku w R2. Przy podmianie pliku — nowe zdjęcie **i nowy obiekt
  w buckecie**, przy starym wciąż leżącym obok.
- **Do zapamiętania:** to ćwiczenie ma Cię nauczyć odruchu „najpierw kadr,
  potem plik" — połowa telefonów od klienta o „brzydkim zdjęciu" to będzie
  źle dobrany kadr.
- **Cofnięcie:** skasuj z R2 plik, którego już nie ma we wpisie.

### Ćwiczenie 5 — usunięcie razem ze sprzątaniem R2

Usuń wpis z ćwiczeń 1/3/4 pełną procedurą z §9: **najpierw spisz adresy**,
sprawdź, czy nie są używane gdzie indziej, usuń wpis, posprzątaj bucket,
odpal `CHECK_REMOTE_MEDIA=1 …`.

- **Ma się pojawić:** kafel znika z listy, przycisk kategorii znika z szyny,
  a w `realizacje/` nie zostaje ani jeden plik po tym wpisie.
- **Sprawdź świadomie:** policz pliki w buckecie przed i po. Jeśli się nie
  zgadza — masz osierocony plik i właśnie zobaczyłeś, jak łatwo je zostawić.

### Ćwiczenie 6 — celowa kolizja nazw (dochodzenie, nie trening)

Wgraj do dwóch **różnych** wpisów dwa **różne** zdjęcia o tej samej nazwie
pliku (np. dwa razy `IMG_0001.jpeg`).

- **Czego szukasz:** czy w R2 powstały dwa obiekty (Sveltia dokleiła sufiks),
  czy jeden nadpisał drugi — i czy zdjęcie w pierwszym wpisie się zmieniło.
- **Po co:** od wyniku zależy jedno zdanie w wersji klienckiej. Jeśli
  nadpisuje — do instrukcji klienta wchodzi „nadawaj plikom własne nazwy
  przed wgraniem". Wynik wpisz do §9 i skreśl tamten `⟦DO POTWIERDZENIA⟧`.
- **Cofnięcie:** usuń oba wpisy testowe i pliki.

### Kryterium gotowości

Umiesz uczyć klienta, kiedy **wszystkie** te zdania są prawdziwe:

1. Przeszedłeś ćwiczenia 1–6, a bucket `realizacje/` ma po nich **dokładnie
   tyle plików, co przed** — czyli nie zostawiłeś ani jednego sieroty.
2. Potrafisz dodać wpis z filmem **bez zaglądania do tego dokumentu**.
3. Umiesz **z góry powiedzieć**, co zmiana `order` zrobi ze stroną główną —
   i potwierdzić to na ekranie.
4. Widziałeś na własne oczy **czerwony build** po celowo zepsutym wpisie
   (np. usuń wszystkie pozycje galerii), znalazłeś przyczynę w
   `pnpm test:unit` i naprawiłeś ją **w panelu**, nie w repo.
5. Umiesz w jednym zdaniu, bez żargonu, wyjaśnić, dlaczego usunięcie wpisu
   nie usuwa zdjęć.
6. Wszystkie `⟦DO POTWIERDZENIA⟧` z §13 są zamknięte, a wersja kliencka
   opisuje ekrany, które faktycznie widziałeś.

Punkt 4 jest nieoczywisty, a najważniejszy: to jedyna sytuacja, w której
klient zadzwoni **spanikowany** („zepsułem stronę"). Musisz umieć w 30 sekund
powiedzieć „strona działa, nic nie zepsułeś, poprawmy jedno pole".

---

## 13. Lista kontrolna do pierwszego przejścia przez panel

Przejdź panel **raz, na spokojnie**, z tym dokumentem otwartym obok, i zamknij
każdą pozycję. Dopóki są otwarte, dokument jest szkicem.

| # | Do potwierdzenia | Gdzie w dokumencie |
| --- | --- | --- |
| 1 | Ekrany logowania: ile kroków, co pokazuje GitHub, jak wygląda powrót | §2 |
| 2 | Kiedy dokładnie panel prosi o klucz R2 i czy da się go zapamiętać | §3 |
| 3 | Droga od zalogowania do pustego formularza nowej realizacji | §4 |
| 4 | Jak nazywa się akcja zapisu i co panel pokazuje po zapisaniu | §4, §10 |
| 5 | Jak wygląda dodawanie pozycji do listy („Galeria", „Parametry (specs)") i czy da się zmieniać ich kolejność | §4 |
| 6 | Jak wgrywa się plik do pola „Zdjęcie" (wybór z dysku, przeciągnięcie, biblioteka) | §5 |
| 7 | Czy w bibliotekę mediów da się wejść „obok" pola — i jak to wygląda | §6 |
| 8 | Jak wygląda lista wpisów, wejście w edycję i ostrzeżenie o niezapisanych zmianach | §8 |
| 9 | Jak wygląda usuwanie wpisu i czy panel pyta o potwierdzenie | §9 |
| 10 | **Kolizja nazw plików w R2: sufiks czy nadpisanie** (ćwiczenie 6) | §9, §12 |
| 11 | Czy panel działa sensownie na telefonie — i czy da się z niego wgrać zdjęcie z galerii telefonu | wersja kliencka |
| 12 | Realny czas od zapisu do zmiany na `delung.pl` (zmierz zegarkiem, dwa razy) | §10 |

Po zamknięciu listy: popraw oba dokumenty, zrób zrzuty z listy w wersji
klienckiej i dopiero wtedy umawiaj szkolenie.

---

## 14. Weryfikacja maszynowa (stan na 2026-08-04)

Co zostało sprawdzone poleceniem, nie z pamięci:

**Kontrakt CMS i kategorie** — test porównuje opcje selecta w `config.yml`
ze `src/lib/categories.ts` (1:1, z kolejnością) i waliduje każdy JSON schemą
Zod:

```
$ pnpm test:unit
 Test Files  8 passed | 1 skipped (9)
      Tests  67 passed | 1 skipped (68)
   Duration  316ms
```

**Media w R2** — HEAD do każdego adresu `media.delung.pl` z JSON-ów:

```
$ CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  334ms
```

**Pola wymagane vs opcjonalne** — porównane `config.yml` ↔ `content.schema.ts`
pole po polu: zgodne (§4). **Adresy i domeny** — `media.delung.pl`,
`auth.delung.pl`, bucket `delung-media`, prefix `realizacje/` — wzięte
z `config.yml`. **Ścieżka błędnego wpisu** — odczytana z `ci.yml`
(`quality`: `format:check → lint → typecheck → test:unit → build`)
i `prod-smoke.yml` (własny `pnpm build` przed czekaniem na deploy).

⚠️ Świadoma luka: **żaden automat w CI nie sprawdza, czy media istnieją
w R2** — `media-r2.test.ts` odpala się wyłącznie ze zmienną
`CHECK_REMOTE_MEDIA=1`, której nie ustawia ani `ci.yml`, ani
`prod-smoke.yml`. To ręczny krok po sprzątaniu bucketa (§9).

---

## 15. Czego nie ruszać — lista „to zawsze przez Mateusza"

Dla klienta (wchodzi do wersji klienckiej w prostszych słowach):

1. **Plików w repozytorium.** JSON-y realizacji pisze wyłącznie panel.
2. **Ustawień panelu** (`public/admin/config.yml`) — to definicja pól.
   Zmiana bez zmiany schematu w pozostałych dwóch miejscach = build stoi.
3. **Cokolwiek w Cloudflare** — R2, DNS, Pages, Worker.
4. **Haseł i kluczy** — konto `delung-cms`, klucz R2, konto Resend.
   Nic z tego nie jest do samodzielnej zmiany.
5. **Kategorii** — lista jest w kodzie, nie w panelu (§7).

Dla Ciebie — dodatkowo:

6. **Nie edytuj `src/content/realizacje/*.json` ręcznie.** Jest hook-guard,
   pliki są w `.prettierignore` (Sveltia ma własny formater). Wyjątek =
   świadoma decyzja przy naprawie awarii, przez PR.
7. **Zmiana schematu = trzy miejsca naraz**: `src/content.schema.ts`,
   `public/admin/config.yml`, `src/components/sections/work/*`
   (reguła `.claude/rules/cms-realizacje.md`). Niespójność przechodzi
   lokalnie i wybucha w CI przy pierwszym wpisie z panelu.
8. **Nie podbijaj wersji Sveltii** (`public/admin/index.html`, dziś
   `0.170.0`) bez przetestowania `/admin` — i nigdy w dniu szkolenia.
