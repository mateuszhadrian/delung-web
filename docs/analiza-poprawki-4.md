# Runda poprawek nr 4 (przed Etapem 7) — analiza

> Status: **WYKONANA** (2026-08-07). Decyzje **D-W1–D-W8**.
> Czytać RAZEM z analizami widoków — koryguje ustalenia o miniaturze wideo
> (D-RP4), o zapasie parallaxu (D-U1, rozszerzenie na kolejne trzy miejsca)
> i o zasięgu gestu swipe-down (D-OK5/D-R3).

Zakres zebrany od Mateusza w trakcie sesji (nie z góry): najpierw dwie
pozycje, potem sześć kolejnych. Wszystkie diagnozy poniżej powstały
z **pomiaru sondą Playwrighta poza repo**, nie z czytania CSS-a — w dwóch
przypadkach pomiar obalił hipotezę, która wyglądała na pewnik.

---

## 1. Zdławione obrazy: jedna reguła, cztery miejsca (D-W1)

**Zgłoszenie:** na desktopie przy prawej krawędzi hero widać czarny pas,
który w trakcie pętli Ken Burns raz rośnie, raz znika.

**Przyczyna (zmierzona):** preflight Tailwinda niesie
`img { max-width: 100% }`. Zadeklarowana w hero szerokość `106%` była przez
to **dławiona do 100%**, a obraz przesunięty o `left: -3%` kończył się na
97% i odsłaniał `--bg-dark`. Wysokość działała, bo preflight nie ustawia
`max-height` — stąd pas wyłącznie pionowy. Zmienność w czasie brała się
z tego, że każdy kadr ma własny, niecentralny `transform-origin`: przy
`scale(1.09)` z origin przy lewej krawędzi zdjęcie wsuwało się w szczelinę,
przy origin po prawej — wysuwało z niej.

To **ta sama pułapka co D-U1** (`analiza-parallax-realizacje.md`), więc
zamiast łatać jedno miejsce przemiotłem sondą wszystkie obrazy
pozycjonowane absolutnie na pięciu widokach i dwóch progach.

Szczelina po prawej stronie kadru, stan **przed** naprawą:

| miejsce | próg | szczelina | widoczna |
| --- | --- | --- | --- |
| hero `/` (4 kadry) | desktop | do **43,2 px**, zmienna w cyklu | tak (zgłoszenie) |
| kafle zajawki oferty `/` (6 szt.) | desktop | 30,8 px stałe | tak |
| kafle zespołu `/o-nas/` (3 szt.) | desktop | 17,4 px stałe | tak |
| tła bannera kontaktu `/` i CTA procesu `/oferta/` | mobile | 12,3 px | **nie** |

**Naprawa:** `max-width: none` przy każdej deklaracji szerokości > 100%.
Po naprawie hero jest pokryte na całym cyklu przy czterech rozmiarach okna
(najmniejszy zapas **−35,5 px** przy 1024×768, największy −84,7 px przy
1920×1080), a kafle oferty i zespołu znikają z wyników sondy.

**Świadomie poza zakresem** (decyzja Mateusza): tła bannera kontaktu i CTA
procesu na mobile. Szczelina 12,3 px istnieje, ale obraz jest tam rozmyty
(`blur(7px)`) i przykryty ciemnym tintem, więc kontrast na krawędzi jest
zerowy — naprawa byłaby niewidoczna, a dołożyłaby baseline'y mobilne.
Gdyby kiedyś zniknął blur albo tint, trzeba to domknąć.

**Fałszywe trafienia sondy** (sprawdzone, NIE są defektami): grafika busa
w hero `/o-nas/` i van w sekcji zespołu na mobile — oba mają celowo stałą
szerokość i nie mają pokrywać kadru.

---

## 2. Miniatura filmu nie istniała w Chrome (D-W2)

**Zgłoszenie:** „na dev kafel wideo jest jednokolorowy, a na produkcji jest
miniaturka" — czyli pozornie znany artefakt dev (`/cdn-cgi/media` żyje tylko
na produkcji, `videoFrameAt()` zwraca w dev `undefined`).

**Pomiar obalił to wyjaśnienie.** Licząc żądania klatki na **produkcji**:

| silnik | żądania plakatu | efekt |
| --- | --- | --- |
| Firefox | 7 / 7 | miniaturka jest |
| WebKit (Safari, iOS) | 1 / 1 | miniaturka jest |
| **Chromium (Chrome, Android)** | **0 / 7** | pusty prostokąt |

Przy `preload="none"` Chromium **nie pobiera atrybutu `poster` w ogóle**.
Zmierzone również obejście przez `preload="metadata"` — **nie działa**
(dalej zero żądań), a kosztowałoby pobieranie nagłówków każdego klipu.
Mateusz widział miniaturkę na Safari, sesja nie widziała jej w Chrome —
to była ta sama usterka oglądana z dwóch stron.

**Naprawa:** klatka idzie DWOMA drogami — jako `<img class="dt-poster">`
pod `<video>` i jako atrybut `poster` (ten sam URL, więc jedno pobranie).
Galeria żyje w `<template>`, więc obraz pobiera się dopiero przy otwarciu
detalu — zero kosztu dla listy realizacji.

Po naprawie Chromium pobiera klatkę (200) na mobile i desktopie, a grający
film przykrywa ją (`<video>` jest po `<img>` w DOM — zmierzone:
`currentTime` 1,91 s przy widocznym kadrze filmu).

**Do zapamiętania:** „widzę to tylko u siebie" bywa różnicą silnika, a nie
środowiska. Weryfikacja kosztowała jeden przebieg trzema silnikami.

---

## 3. Podpowiedź na kadrze wideo (D-W3)

Ikonce kamery (lewy górny róg) towarzyszy teraz tekst w prawym górnym rogu:
**„Kliknij, aby obejrzeć"** ≥1024 / **„Stuknij, aby obejrzeć"** <1024.
Wygląd wybrany przez Mateusza: sam biały tekst z cieniem, bez pigułki.

Dwie decyzje konstrukcyjne:

- **Oba warianty treści są w SSR**, przełącza je `@media` (wzorzec
  duplikatów per-breakpoint z 4.5) — nie podmiana tekstu w JS.
- **Hint gaśnie tą samą regułą co ikonka kamery**
  (`.lb-slide.is-playing [data-cam], … [data-cam-hint]`), więc
  synchronizacja jest z konstrukcji, a nie z ustawienia. Działa też
  w podglądzie pełnoekranowym, bo jego kadry to klony miniatur.
- Atrybut jest **osobny** (`data-cam-hint`, nie `data-cam`) — inaczej
  istniejące asercje `[data-cam]` łapałyby dwa elementy i wywracały się
  na strict mode.

---

## 4. Swipe-down w całej treści sheeta (D-W4)

**Zgłoszenie:** gest zamykający łapał się wyłącznie na kreseczce; mocniejszy
ruch palcem w treści **odświeżał stronę** zamiast zamknąć sheet.

**Naprawa — dwie połowy:**

1. `overlay.ts` przejmuje gest także w treści, ale **wyłącznie gdy obszar
   pod palcem jest przewinięty na samą górę** (`scrollTop === 0`). Start
   z treści jest „warunkowy": przejęcie następuje dopiero, gdy palec pójdzie
   w dół o próg 8 px i **bardziej w dół niż w bok** — bez tego pozioma
   karuzela galerii zamykałaby sheet przy każdym przesunięciu kadru.
2. `overscroll-behavior: contain` na `[data-overlay-scroll]`
   i `[data-overlay-panel]` — to ono ubija pull-to-refresh.

Zasięg: **wszystkie sheety** (detal realizacji, karty kategorii, menu
mobilne) — decyzja Mateusza, jeden mechanizm w jednym miejscu.

**Wyjątek `[data-overlay-nodrag]`** nosi podgląd pełnoekranowy: ma własny
swipe-down zamykający sam podgląd, więc dwa mechanizmy nie walczą o ten sam
ruch palca.

---

## 5. CTA realizacji tylko dla niepustych kategorii (D-W5)

Przycisk „Zobacz realizacje z tej kategorii" (karta kategorii) i „Przeglądaj
realizacje z kategorii NAZWA" (panel `/oferta/`, oba duplikaty `--side`
i `--wide`) prowadzą na przefiltrowaną listę — w kategorii bez wpisów
obiecywały pustą stronę.

Źródłem prawdy jest nowa `categoriesWithWork()` w `work-data.ts`, obok
`workRail()`, która liczy to samo dla szyny filtrów. Wynik zależy od treści
z panelu: pierwsza realizacja w danej kategorii przywraca przycisk przy
najbliższym buildzie.

Zmierzone na treści produkcyjnej (5 z 7 kategorii ma wpisy): karty **5 z 6**,
panele `/oferta/` **10 z 12**.

---

## 6. Zapas na parallax w hero `/o-nas/` (D-W6)

Ta sama klasa co D-U1: obraz był dokładnie na wymiar kadru przy ruchu
`data-par="0.1"`, więc scroll odsłaniał kremowe tło.

| viewport | przed | po |
| --- | --- | --- |
| 390×844 | +40,0 px | −12,0 px |
| 360×640 | +36,2 px | −11,8 px |
| 430×932 | +42,5 px | −14,7 px |

Zapas wynosi **13 % z każdej strony** (`top: -13%; height: 126%`), a nie
minimalne 11 % z wzoru — przy 11 % margines wychodził 4 px, czyli na
granicy zaokrągleń. Desktop sprawdzony przy okazji: jego zapas 122 % był
i jest wystarczający (−10,2 px przy 1440×900).

---

## 7. Przyklejona kolumna `/realizacje/` mieści się w oknie (D-W7)

**Zgłoszenie:** przy dużej liczbie kategorii kafel „SZUKASZ CZEGOŚ
PODOBNEGO?" z telefonem wyjeżdżał poza ekran.

Kolumna jest sticky i rośnie z liczbą pozycji szyny (maksimum realne to
„Wszystkie" + 7 kategorii = 8). Nadmiar ponad wysokość okna **przed**
naprawą:

| okno | 6 pozycji | 7 | 8 |
| --- | --- | --- | --- |
| 1920×1080 | mieści | mieści | mieści |
| 1440×900 | mieści | mieści | +45 px |
| 1280×800 | +13 px | +61 px | +109 px |
| 1366×768 | +56 px | +104 px | **+152 px** |

**Naprawa dwustopniowa** (`fitHeadColumn()` w skrypcie strony): stopień 1
chowa opis (~127 px), stopień 2 zacieśnia odstępy szyny (10 px zamiast 15 px
na pozycję). Samo ukrycie opisu **nie wystarczało** przy komplecie kategorii
na 1366×768 — stąd drugi stopień, wybrany przez Mateusza z trzech wariantów.

Po naprawie kolumna mieści się w każdym układzie (najciaśniej −10 px przy
1280×800 z 8 pozycjami), a kafel z telefonem jest widoczny wszędzie.

**Liczy JS, nie CSS** — `@media` na wysokość nie wie, ile kategorii ma
wpisy, a `calc()` nie porówna wysokości treści z wysokością okna. Ta sama
sytuacja co przy limicie linii opisu w scenie realizacji (D-U5).

---

## 8. Centrowanie wybranej kategorii w pasku (D-W8)

Na mobile pasek filtrów przewija się teraz sam tak, by wybrana kategoria
wypadła na środku ekranu. Przy krańcach listy dojeżdża **tylko do swojej
krawędzi** (clamp), więc po bokach nigdy nie powstaje pusty pas — wygląd
paska jest nietknięty, zmienia się wyłącznie jego `scrollLeft`.

Zmierzone (390×844, 6 pozycji, zakres przewijania 482 px):

| kategoria | odchyłka od środka | pasek |
| --- | --- | --- |
| Wszystkie (pierwsza) | −133 px | na krawędzi 0 |
| Szafy i garderoby | **0 px** | 65 / 482 |
| Wnętrza komercyjne | **0 px** | 238 / 482 |
| Dekoracje okienne | **0 px** | 415 / 482 |
| Zabudowy łazienkowe (ostatnia) | +94 px | na krawędzi 482 |

Skrajne pozycje zostają w całości widoczne — to jest kryterium, nie odchyłka.

Deep-link `#<slug>` też centruje, ale **bez animacji**: przejazd paska przy
pierwszym paincie wyglądałby na usterkę. Pionowy scroll strony zostaje bez
zmian, w tym powrót na początek listy z D-T2.

---

## 9. Kolor etykiet parametrów na mobile (D-W3b)

`.dt-spec b` miało `--faint` na mobile i `--accent-ink` na desktopie —
teraz zieleń na obu progach. Reguła bazowa niesie kolor, desktop nadpisuje
już tylko rozmiar i odstępy.

---

## 10. Testy

Nowe kontrakty e2e (wszystkie zweryfikowane, że łapią regresję):

- **hero pokrywa ekran przez całą pętlę** — sonda przewija animację
  `currentTime` co 500 ms przez pełne 26 s zamiast czekać; sprawdzona
  w obie strony (bez `max-width: none` czerwona, z nią zielona),
- **hint wideo**: widoczność razem z ikonką kamery, właściwy wariant
  tekstu per próg (`useInnerText` — oba warianty są w DOM), zgaszenie przy
  grającym filmie i powrót po pauzie,
- **swipe-down w treści**: zamyka przy przewinięciu na górę, NIE zamyka
  przy przewinięciu niżej,
- **CTA per kategoria**: oczekiwanie liczone z kolekcji (`readRealizacje`),
  nie z listy zaszytej w teście — odporne na treść z panelu,
- **kolumna nagłówka**: sonda dokłada pozycje do kompletu 8 i sprawdza
  nadmiar ≤ 0 przy 1440×900, 1280×800 i 1366×768,
- **centrowanie szyny**: odchyłka ≤ 4 px dla środkowej kategorii, dojazd do
  krawędzi + pełna widoczność dla skrajnej,
- **kolor etykiet**: liczony z tokenu `--accent-ink` (nie z literału), bo
  pixel-diff tego nie widzi — patrz niżej.

Wynik: **579 → 582 przebiegi e2e, zero czerwonych.**

## 11. Baseline'y

**15 zrzutów**, każdy z powodem:

| zrzut | profile | powód |
| --- | --- | --- |
| `index-top` | 3 desktop | zapas hero 106 % zamiast 100 % |
| `index-oferta` + sweep sceny `of` | 3 desktop + 1920 | kafle oferty pełnej szerokości |
| `o-nas-team` + sweep toru zespołu | 3 desktop + 1920 | kafle zespołu pełnej szerokości |
| `o-nas-top` | 3 mobile | zapas na parallax (kadr o 13 % szerszy) |
| `oferta-panel-05` | 1920 | znika CTA w kategorii bez wpisów |

Pozostałe **188 zrzutów bez zmian.**

**Dwie zmiany są dla pixel-diffa niewidzialne i to nie przypadek:**
kolor etykiet leży poniżej kadru sheeta (96svh), a zrzut karty kategorii
dotyczy „Kuchni", które wpisy mają. Obie chroni kontrakt e2e — przy zmianach
w tych obszarach nie licz na baseline.

Maski wideo w `tests/visual/work-index.spec.ts` objęły też `.dt-poster`.
Geometria jest identyczna z `video`, więc **zrzuty się od tego nie ruszyły** —
ale klatka filmu jest równie niedeterministyczna co samo wideo i regułę
„wideo zawsze pod maską" trzeba było rozciągnąć.
