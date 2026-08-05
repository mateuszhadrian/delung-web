# Delung Meble — jak dodać realizację na stronę

Krótka instrukcja obsługi panelu `delung.pl/admin`.
Możesz ją wydrukować albo trzymać otwartą w telefonie.

---

## Co to jest panel

Panel to strona, na której dodajesz swoje realizacje: zdjęcia, filmy i opisy.
Wszystko, co w nim zapiszesz, **pojawia się na `delung.pl` po około
2 minutach** — sama strona odświeża się w tle, nic więcej nie trzeba robić.

Nie da się w nim „zepsuć strony". Jeśli czegoś zabraknie, strona po prostu
zostaje taka, jaka była, a Mateusz dostaje o tym powiadomienie.

---

## Zanim dodasz pierwszą realizację

Dwie rzeczy do zrobienia **raz w życiu**:

1. **Jeśli robisz zdjęcia iPhone'em:** wejdź w *Ustawienia → Aparat →
   Formaty* i wybierz **„Najbardziej zgodne"**. Bez tego telefon zapisuje
   zdjęcia w formacie, którego strona nie wyświetli.
   Na Androidzie nic nie trzeba zmieniać.
2. **Jeśli chcesz dodawać filmy:** potrzebujesz komputera z programem
   **HandBrake** — Mateusz instaluje go i ustawia przy przekazaniu strony.
   Filmu nie da się przygotować na samym telefonie.

Zdjęcia możesz dodawać skąd chcesz: z komputera i z telefonu.

---

## Logowanie

1. Wejdź na **`delung.pl/admin`**.
2. Zaloguj się kontem, które dostałeś od Mateusza (`delung-cms`).
3. Przepisz kod z aplikacji na telefonie.

![ZRZUT: ekran logowania panelu — pierwsze, co widać po wejściu na delung.pl/admin, z przyciskiem logowania przez GitHub](media/cms-01-logowanie.png)

Po zalogowaniu widzisz **listę swoich realizacji**.

![ZRZUT: lista realizacji po zalogowaniu, z widocznym miejscem, w którym zaczyna się nową realizację](media/cms-02-lista.png)

> Wchodź zawsze przez adres **`delung.pl/admin`**. Z innych adresów panel
> nie wpuści.

---

## Chcę dodać realizację — 7 kroków

### Krok 1. Zacznij nową realizację

Otwórz listę realizacji i zacznij nową.

![ZRZUT: pusty formularz nowej realizacji, widoczna góra z pierwszymi polami](media/cms-03-nowy-wpis.png)

### Krok 2. Wpisz podstawy

Cztery pola u góry:

| Pole | Co wpisać | Przykład |
| --- | --- | --- |
| **„Slug (adres, np. kuchnia-kaszmirowa)"** | krótka nazwa **małymi literami, bez spacji i bez polskich znaków** — słowa łącz myślnikiem | `kuchnia-orzech-czern` |
| **„Kolejność (mniejsze = wyżej)"** | liczba; im mniejsza, tym wyżej realizacja stoi na stronie | `10` |
| **„Tytuł"** | tak, jak chcesz to nazwać na stronie | `Kuchnia z orzechem i czarnymi akcentami` |
| **„Rok realizacji"** | rok, w którym to zrobiłeś | `2025` |

### Krok 3. Wybierz kategorię

Pole **„Kategoria"** to lista do wyboru. Jest **siedem** możliwości:

- „Kuchnie"
- „Szafy i garderoby"
- „Wnętrza komercyjne i biura"
- „Dekoracje okienne"
- „Zabudowy łazienkowe"
- „Meble nietypowe"
- „Inne"

![ZRZUT: rozwinięta lista wyboru w polu „Kategoria" z widocznymi wszystkimi siedmioma pozycjami](media/cms-04-kategoria.png)

Kategoria decyduje, pod którym filtrem realizacja pokaże się na stronie
`delung.pl/realizacje/`. Jeśli nic nie pasuje — wybierz „Inne".

### Krok 4. Napisz opis

Pole **„Opis"** — dwa, trzy zdania o tym, co to za realizacja: materiały,
co było do zrobienia, co w niej ciekawego.

> Przykład z istniejącej realizacji:
> *„Ciepły kaszmir, fornirowana witryna z podświetleniem LED i blat
> spiekowy. Cała zabudowa pod sufit, z ukrytymi uchwytami wlotowymi."*

![ZRZUT: wypełnione pola „Rok realizacji" i „Opis"](media/cms-05-opis.png)

### Krok 5. Dodaj zdjęcia (i film, jeśli masz)

Sekcja **„Galeria (pierwsza pozycja = kafel na liście)"** to wszystkie
zdjęcia i filmy realizacji. **Musisz dodać co najmniej jedno zdjęcie.**
W praktyce dobrze wygląda 3–5.

Dodajesz je pojedynczo — każde to jedna **„Pozycja galerii"**. Przy dodawaniu
wybierasz, **co to za pozycja**: **„Zdjęcie"** albo **„Film"**.

![ZRZUT: moment dodawania pozycji galerii — widoczny wybór rodzaju: „Zdjęcie" albo „Film"](media/cms-06-rodzaj-pozycji.png)

> ### ⭐ Pierwsze zdjęcie to okładka
>
> **Pierwsza pozycja galerii pokazuje się na liście realizacji** — to ją
> ludzie zobaczą jako pierwszą. Daj tam najładniejsze, ogólne ujęcie.
>
> Z tego samego powodu **pierwsza pozycja nie może być filmem**. Jeśli
> zaczniesz galerię od filmu, strona się nie zaktualizuje, a Mateusz dostanie
> powiadomienie — wtedy wystarczy przesunąć film niżej.

![ZRZUT: sekcja „Galeria" z trzema dodanymi pozycjami, widoczne nazwy plików](media/cms-08-galeria.png)

Pole **„Kadr (object-position, np. 50% 42%)"** możesz **zostawić puste** —
wróć do niego dopiero, jeśli po zobaczeniu strony okaże się, że zdjęcie jest
przycięte nie tak, jak chcesz. Wtedy patrz na koniec instrukcji:
*„Zdjęcie jest ucięte"*.

**Jeśli chcesz dodać film:**

> ### 🎥 Film to osobna pozycja — miniaturka zrobi się sama
>
> Dodaj pozycję rodzaju **„Film"**. Nie wgrywasz do niej żadnego zdjęcia —
> obrazek, który widać przed odtworzeniem, strona **wycina sama z Twojego
> filmu**, ze środka.
>
> Wypełniasz dwa pola:
>
> 1. **„Wideo MP4 (miniatura powstanie sama z klatki filmu)"** — tu wgrywasz
>    film **przepuszczony przez HandBrake'a** (nie surowy plik z telefonu —
>    jest za ciężki i strona będzie się wlokła).
> 2. **„Długość wideo (np. 0:24 — podpis i środek miniatury)"** — wpisz, ile
>    film **naprawdę** trwa, np. `0:24`.
>
> ⚠️ **Podaj prawdziwą długość.** Strona liczy z niej, z którego momentu wziąć
> obrazek. Jeśli wpiszesz `5:00` przy filmie na pół minuty, obrazka nie będzie
> wcale — zostanie puste miejsce.

![ZRZUT: rozwinięta pozycja galerii rodzaju „Film" z polami „Wideo MP4" i „Długość wideo"](media/cms-09-pozycja-z-filmem.png)

**Jak przygotować film (na komputerze):**

1. Przegraj film z telefonu na komputer (kabel, AirDrop albo Zdjęcia Google).
2. Otwórz **HandBrake**, przeciągnij do niego plik.
3. U góry wybierz ustawienie **„Delung – strona www"**.
4. Kliknij **Start** i poczekaj.
5. Gotowy, mały plik `.mp4` wgraj w panelu do pola **„Wideo MP4…"**.

Na stronie film **nie ma paska odtwarzacza** — w rogu miniaturki jest mała
ikonka kamery, a film włącza się po jej dotknięciu. Tak ma być.

### Krok 6. Wypełnij parametry

Sekcja **„Parametry (specs)"** — to tabelka pod opisem realizacji. Każdy
wiersz to **„Etykieta (np. MATERIAŁY / BLAT / ZAKRES)"** i **„Wartość"**.

Etykiety **strona i tak pokaże wielkimi literami**, więc nie musisz się tym
przejmować — `blat` wyświetli się jako `BLAT`. Sprawdzony zestaw:

| Etykieta | Wartość — przykład |
| --- | --- |
| `MATERIAŁY` | Płyta lakierowana w kolorze kaszmiru, fornir dąb |
| `BLAT` | Spiek kwarcowy, łączenie na zamek |
| `SYSTEMY / OKUCIA` | Zawiasy Blum, prowadnice Legrabox |
| `ZAKRES` | Projekt, produkcja, montaż, oświetlenie LED |
| `ROK REALIZACJI` | 2025 |

![ZRZUT: sekcja „Parametry (specs)" z pięcioma wypełnionymi wierszami](media/cms-10-parametry.png)

Ta tabelka robi w portfolio duże wrażenie — warto ją wypełniać zawsze.

### Krok 7. Zapisz i poczekaj

Zapisz realizację.

![ZRZUT: moment zapisu — widoczne miejsce zapisu i to, co panel pokazuje zaraz po zapisaniu](media/cms-11-zapis.png)

**Po około 2 minutach** wejdź na **`delung.pl/realizacje/`** i sprawdź, czy
wszystko wygląda tak, jak chciałeś: zdjęcie na kafelku, opis, galeria, film.

![ZRZUT: gotowa realizacja na delung.pl/realizacje/ — kafelek na liście i otwarty szczegół](media/cms-12-na-stronie.png)

**To wszystko. Zrobione.**

---

## Chcę poprawić gotową realizację

Otwórz ją na liście w panelu, zmień, co trzeba, i zapisz. Po 2 minutach
zmiana jest na stronie. Możesz poprawiać ile chcesz i kiedy chcesz.

![ZRZUT: lista realizacji w panelu z zaznaczonym miejscem wejścia w edycję](media/cms-13-edycja.png)

### Zdjęcie jest ucięte

Zanim wymienisz zdjęcie — spróbuj **przesunąć kadr**. Strona przycina każde
zdjęcie do swojego kształtu, a pole **„Kadr (object-position, np. 50% 42%)"**
mówi jej, którą część zdjęcia zachować.

Wpisujesz **dwie liczby z procentami**. Ważna jest **druga**:

| Wpisz | Efekt |
| --- | --- |
| `50% 50%` | środek zdjęcia (tak jest, gdy pole jest puste) |
| `50% 30%` | pokazuje **wyżej** — gdy ucina górę szafek |
| `50% 70%` | pokazuje **niżej** — gdy ucina blat albo dół zabudowy |

Zmieniaj co 10 i sprawdzaj na stronie. Dwa, trzy podejścia wystarczą.

### Chcę zmienić zdjęcie na inne

Wgraj nowy plik do tego samego pola. Stare zdjęcie zniknie ze strony.

### Chcę zmienić kolejność realizacji

Pole **„Kolejność (mniejsze = wyżej)"**. Realizacja z liczbą `1` stoi na
samej górze, z `50` — niżej.

> **Uwaga:** na stronie głównej Delunga pokazują się **trzy pierwsze**
> realizacje z tej kolejności. Jeśli chcesz, żeby coś było na stronie
> głównej — daj mu małą liczbę.

---

## Chcę usunąć realizację

Usuń ją w panelu — zniknie ze strony po 2 minutach.

![ZRZUT: usuwanie realizacji — widoczna akcja usunięcia i pytanie o potwierdzenie, jeśli panel je zadaje](media/cms-14-usuwanie.png)

> **Powiedz o tym Mateuszowi.** Sam wpis znika ze strony od razu, ale
> **zdjęcia i filmy zostają w miejscu, gdzie strona trzyma pliki** — i ktoś
> musi je stamtąd usunąć ręcznie. Przy filmach to realne pieniądze za
> przechowywanie, więc lepiej nie zbierać śmieci.

---

## Gdy coś nie działa

**Zadzwoń do Mateusza.** Serio — nie ma tu nic, co dałoby się zepsuć na
stałe, a zgadywanie zajmie więcej czasu niż telefon.

Najczęstsze sytuacje i co warto powiedzieć przez telefon:

| Co się dzieje | Co powiedzieć |
| --- | --- |
| Panel nie wpuszcza / nie ma kodu z aplikacji | „nie mogę się zalogować" |
| Panel prosi o jakiś klucz albo hasło do zdjęć | „panel prosi mnie o klucz" — to normalne na nowym urządzeniu, Mateusz to wpisuje |
| Zapisałem, minęło 10 minut i nic się nie zmieniło | „zapisałem realizację, nie widać jej na stronie" |
| Zdjęcie się nie wyświetla (puste miejsce) | „zdjęcie się nie pokazuje" — najczęściej format z iPhone'a, patrz początek instrukcji |
| Film się nie włącza albo ładuje w nieskończoność | „film nie działa" — najczęściej plik nie przeszedł przez HandBrake'a |

---

## Czego lepiej nie ruszać

Krótka lista rzeczy, które zawsze idą **przez Mateusza**:

1. **Ustawień samego panelu** — czyli tego, jakie pola są w formularzu.
2. **Listy kategorii** — nowej kategorii nie da się dodać z panelu.
3. **Haseł, kluczy i ustawień konta.**
4. **Czegokolwiek poza panelem** — jeśli trafiłeś na ekran, którego nie ma
   w tej instrukcji, to nie jest miejsce dla Ciebie.

Wszystko inne — zdjęcia, opisy, filmy, kolejność, usuwanie — jest Twoje
i możesz z tym robić, co chcesz.

---

<!-- ─────────────────────────────────────────────────────────────────────
     PONIŻSZA CZĘŚĆ JEST DLA MATEUSZA — USUŃ JĄ PRZED WYDRUKIEM
     I PRZED PRZEKAZANIEM DOKUMENTU KLIENTOWI.
     ───────────────────────────────────────────────────────────────────── -->

## ⚙️ Dla Mateusza — zrzuty do zrobienia

Zrzuty zapisz jako `docs/media/cms-NN-nazwa.png` (katalog `docs/media/` nie
jest ignorowany przez repo — przetrwa; `docs/design/assets/` **jest**
ignorowany, więc tam ich nie kładź).

Komplet da się zrobić **za jednym przejściem przez panel** — kolejność niżej
jest kolejnością klikania. Rób je na wpisie treningowym, nie na docelowym
materiale klienta.

| Plik | Co ma być na obrazku |
| --- | --- |
| `cms-01-logowanie.png` | ekran logowania panelu — pierwsze, co widać na `delung.pl/admin` |
| `cms-02-lista.png` | lista realizacji po zalogowaniu, z widocznym miejscem rozpoczęcia nowej |
| `cms-03-nowy-wpis.png` | pusty formularz nowej realizacji, górna część |
| `cms-04-kategoria.png` | rozwinięta lista „Kategoria" — wszystkie siedem pozycji naraz |
| `cms-05-opis.png` | wypełnione „Rok realizacji" i „Opis" |
| `cms-06-rodzaj-pozycji.png` | moment dodawania pozycji galerii — wybór rodzaju „Zdjęcie" / „Film" |
| `cms-08-galeria.png` | „Galeria" z trzema pozycjami (w tym jedną rodzaju „Film") |
| `cms-09-pozycja-z-filmem.png` | rozwinięta pozycja rodzaju „Film": „Wideo MP4" + „Długość wideo" |
| `cms-10-parametry.png` | „Parametry (specs)" z pięcioma wierszami |
| `cms-11-zapis.png` | moment zapisu i to, co panel pokazuje zaraz po nim |
| `cms-12-na-stronie.png` | efekt na `delung.pl/realizacje/` — kafelek + otwarty szczegół |
| `cms-13-edycja.png` | lista w panelu z zaznaczonym wejściem w edycję |
| `cms-14-usuwanie.png` | usuwanie wpisu wraz z ewentualnym pytaniem o potwierdzenie |

Zrzuty rób **na tym urządzeniu, na którym klient będzie realnie pracował**
(albo zrób dwa komplety: komputer i telefon — panel na telefonie wygląda
inaczej i to jest najczęstsze źródło „u mnie tego nie ma").

## ⚙️ Dla Mateusza — lista kontrolna do pierwszego przejścia

Ten dokument jest napisany **bez oglądania panelu**. Poniższe rzeczy trzeba
sprawdzić klikając i poprawić w tekście — dopóki tego nie zrobisz, nie
oddawaj instrukcji klientowi.

| # | Do sprawdzenia | Gdzie w tekście |
| --- | --- | --- |
| 1 | Ile kroków ma logowanie i co dokładnie widać po drodze | *Logowanie* |
| 2 | Jak nazywa się akcja rozpoczęcia nowej realizacji — wstaw prawdziwą nazwę | Krok 1 |
| 3 | Czy pola stoją w tej kolejności co w instrukcji | Kroki 2–6 |
| 4 | **Jak wygląda wybór rodzaju pozycji („Zdjęcie" / „Film") i czy da się zmienić rodzaj już dodanej pozycji** | Krok 5 |
| 5 | Jak wgrywa się plik: z dysku, przeciągnięciem, czy przez wspólną bibliotekę | Krok 5 |
| 6 | Jak nazywa się akcja zapisu i co panel pokazuje po zapisaniu | Krok 7 |
| 7 | Czy panel pyta o potwierdzenie przy usuwaniu | *Chcę usunąć realizację* |
| 8 | Czy panel da się sensownie obsłużyć na telefonie — jeśli nie, dopisz to wprost | cały dokument |
| 9 | Realny czas od zapisu do zmiany na stronie (zmierz dwa razy) — popraw „2 minuty", jeśli wychodzi inaczej | cały dokument |
| 10 | Czy przy wgraniu dwóch plików o tej samej nazwie nic się nie nadpisuje — jeśli nadpisuje, dopisz „nadawaj plikom własne nazwy" | Krok 5 |

Szczegóły techniczne, awarie i sprzątanie plików: `docs/instrukcja-cms.md`.
