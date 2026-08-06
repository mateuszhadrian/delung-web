# Analiza — parallax odsłania tło w scenie realizacji (strona główna, desktop)

Wąska poprawka po zgłoszeniu z produkcji: w przypiętej scenie „Nasze
realizacje" parallax wysuwa zdjęcie poza kafel i odsłania jego kremowe tło —
pas nad zdjęciem przy dojeżdżaniu do sekcji i pod zdjęciem przy odjeżdżaniu.
Prompt startowy: `docs/parallax-realizacje-prompt.md` (diagnoza w nim była
trafna; ten dokument ją domyka, koryguje jedną liczbę i **obala założenie
o baseline'ach**).

Numeracja decyzji: **D-U1 …** (U = usterka parallaxu; poprzednie rundy
zajęły P, Q, T).

Czytać razem z: `docs/analiza-strona-glowna.md` (D-SG6/D-SG9),
`docs/analiza-poprawki-2.md` (D-Q5) i `docs/analiza-poprawki-3.md`
(D-T3/D-T4) — te dwie rundy przebudowywały tę samą scenę i ich dorobek
został tu NIETKNIĘTY (żadna zmiana nie dotyka `.re-pin`, pudełka opisu ani
rozpórki).

---

## 1. Stan zastany — z pomiaru, nie z oka

### 1.1. Metoda

Sonda Playwrighta na `pnpm preview` (port 4399): przewijanie całej sekcji
krokiem 10 px i dla każdego z trzech kafli odczyt
`max(img.top − card.top, card.bottom − img.bottom)`, czyli pasa kafla
**niepokrytego zdjęciem**. Osobno liczony jest pas realnie **widoczny
w oknie** (część wspólna z viewportem) — bo w chwili, gdy kafel wyjeżdża
poza ekran, `parPaint` przestaje go przemalowywać i sam odczyt geometrii
przestaje cokolwiek znaczyć dla użytkownika.

Metoda **nie zależy od stanu dekodowania obrazów** — szczelina jest faktem
układu, nie pikseli. To istotne, bo lokalnie endpoint `/cdn-cgi/image` nie
istnieje i kadry realizacji są puste (patrz §5).

### 1.2. Przyczyna

Kafel `.rc` ma `overflow: hidden` i `background: #e5e1da` — to jest ten
kremowy pas ze zrzutów. Reguła bazowa daje zdjęciu zapas na parallax
(`top: -76px; height: calc(100% + 152px)`), ale desktopowy override sceny
przypiętej **kasował go do zera**, zostawiając ruch:

```css
:global(html.js-motion) .rc img {
  top: 0;
  height: 100%;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
```

`home-scroll.ts` (`parPaint`) przesuwa zdjęcie o `(0.5 − p) × 2 × amt × h`,
gdzie `h` to wysokość hosta, a `amt` = `data-par` = 0,11. W scenie przypiętej
kafel ma wysokość CAŁEGO OKNA, więc 0,11 znaczy tam ±99 px przy oknie 900 px
— przy zapasie zerowym.

Poniżej progu desktop reguła bazowa obowiązuje dalej i kafel ma najwyżej
560 px, czyli ruch 62 px przy 76 px zapasu. Zgadza się ze zgłoszeniem
(usterka wyłącznie na desktopie), ale **margines jest tam cienki: 15–19 px**
— warto o tym pamiętać przy zmianie wysokości kafla mobilnego.

### 1.3. Liczby przed naprawą

| Okno | pas niepokryty (układ) | pas WIDOCZNY w oknie |
| --- | --- | --- |
| 1920×1080 | 114,2 px | **106,9 px** |
| 1440×900 | 94,4 px | **87,7 px** |
| 1366×768 | 80,8 px | **73,7 px** |
| 1280×560 | 58,1 px | **51,5 px** |
| 1024×900 | 95,5 px | **86,6 px** |
| 1152×720 | 74,6 px | **68,6 px** |
| 1440×600 | 61,4 px | **56,1 px** |
| 390×844 (mobile) | −19,0 px | 0 px |
| 768×1024 (mobile) | −14,8 px | 0 px |

Prompt szacował 96,8 px przy 1440×900 — pomiar dał 94,4 px układu / 87,7 px
widocznego pasa. Różnica bierze się z `transition` (patrz D-U3): rysowana
pozycja jest o kilka pikseli za celem zapisanym przez `parPaint`.

**Gdzie to widać:** przez cały czas stania sceny przesunięcie jest ZEROWE —
kafel jest wtedy przyklejony do okna, więc `p` z `parPaint` wynosi dokładnie
0,5. Pas odsłania się wyłącznie na wjeździe w sekcję i wyjeździe z niej. Ta
obserwacja jest kluczowa dla wyboru wariantu naprawy.

---

## 2. Wzór, na którym stoi naprawa

Zapas musi być **nie mniejszy** niż przesunięcie (`amt × h`):

- **zapasem jest kadr (zoom):** obraz powiększony o `s` wystaje o
  `(s − 1) × h / 2` na stronę → warunek **`s ≥ 1 + 2 × amt`**,
- **zapasem jest wysokość:** `top: −amt%` + `height: (100 + 2·amt)%` jest
  dopasowane dokładnie, bo oba procenty liczą się od tej samej wysokości
  kontenera, od której liczy się przesunięcie.

Obie drogi zostały zbudowane i zmierzone tą samą sondą; obie schodzą do
0 px widocznego pasa. **Różnią się wyłącznie ceną w kadrze zdjęcia**, bo
`object-fit: cover` przy większym boksie skaluje obraz mocniej.

Koszt policzony dla kafla 780×900 (scena przypięta przy 1440×900)
i zdjęcia 4:3 — takie robi klient telefonem (`IMG_2690.jpeg` to 4032×3024):

| | ruch parallaxu | wymagana skala | widać szerokości zdjęcia |
| --- | --- | --- | --- |
| dziś (zepsute) | ±99 px | — | 65 % |
| **A — ruch 0,06 + zoom 1,14** | ±54 px | 1,12 | **57 %** |
| B — ruch 0,11 + `height: 124%` | ±99 px | — | 52 % |
| A-lite — ruch 0,04 + zoom 1,08 | ±36 px | 1,08 | 60 % |

Niuans wariantu B, wart zapamiętania: dla zdjęć **pionowych** (jak
`kuchnia-biala1.png` 768×1365) nie zmienia on kadru ani o piksel — takie
zdjęcia już dziś wystają poza kafel w pionie, więc podniesienie boksu nic
nie skaluje. Cała jego cena dotyczy zdjęć poziomych, czyli tych typowych.

---

## 3. Decyzje

### D-U1. Zapasem jest KADR, ruch na desktopie osobny (wariant A)

Decyzja Mateusza po zobaczeniu zrzutów i liczb z §2. Uzasadnienie: skoro
w przypiętej scenie parallax stoi przez cały czas jej trwania (§1.3), to
osłabienie ruchu kosztuje mało, a kupuje 8 punktów procentowych kadru.

```css
:global(html.js-motion) .rc img {
  left: -7%;
  top: -7%;
  max-width: none;
  width: 114%;
  height: 114%;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
```

- `data-par-d="0.06"` na kafelku (obok `data-par="0.11"`) — **nowy atrybut
  czytany tylko na desktopie**. Ten sam ułamek znaczy po obu stronach progu
  zupełnie inną liczbę pikseli, więc jedna wartość dla obu breakpointów jest
  z natury źle postawionym pytaniem. Element bez tego atrybutu zachowuje się
  dokładnie jak dotąd — zmiana w `parPaint` jest wstecznie zgodna i nie
  dotyka pozostałych sekcji (`ContactHero`, `OfertaProcesCta`, `HomeKontakt`,
  `KategorieSection`, `ProcesHero`, `ProcesCta`, `OnasHero`).
- Skala 1,14 przy wymaganej 1,12 → margines 1 % wysokości kafla.
- **`max-width: none` jest KONIECZNE.** Preflight Tailwinda ma
  `img { max-width: 100% }`, więc bez tego szerokość zostaje przycięta do
  kafla, zapas powstaje tylko w pionie, a z prawej strony kafla pojawia się
  beżowy pas szerokości 7 % (zmierzone — pierwsza wersja wariantu A wyglądała
  dokładnie tak).

**Czego NIE zrobiono i dlaczego:** nie ruszono `overflow: hidden` ani tła
kafla (tło ma zostać ostatnią linią obrony, a nie sposobem na ukrycie
problemu), nie wyłączono parallaxu na desktopie (to zmiana projektowa, nie
techniczna), nie ruszono geometrii `.re-pin`, pudełka opisu ani rozpórki
(dorobek D-Q5, D-T3, D-T4).

### D-U2. Martwy hover-zoom skasowany

```css
/* USUNIĘTE */
:global(html.js-motion) .re-cards:hover .rc img {
  transform: scale(1.04);
}
```

Reguła nie działała nigdy przy włączonym ruchu: `parPaint` pisze
`el.style.transform` **inline**, a styl inline bije arkusz bez `!important`.
Potwierdzone pomiarem — po najechaniu kursorem BEZ przewijania (pierwsza
próba użyła `page.hover()`, które samo przewija stronę do elementu i dawało
fałszywe „działa") transform nie drgnął: `translate3d(0px, 33px, 0px)
scale(1)` przed i po.

Afordancja najechania zostaje: lupa w rogu kafla jaśnieje
(`.re-cards:hover .re-lupa`) — ta reguła działa, bo nie dotyczy elementu
nadpisywanego z JS. Przywracania zoomu hoveru przez JS świadomie nie robimy:
dokładałby się do zoomu-zapasu, czyli przycinał kadr jeszcze mocniej.

### D-U3. `transition` zostaje (zmierzone: nieszkodliwy)

`transition: transform 0.7s` na elemencie, któremu JS nadpisuje `transform`
w każdej klatce, jest bez przerwy re-targetowane. Pomiar (przewijanie
24 px/klatkę, odczyt celu ze stylu inline i stanu rysowanego z
`getComputedStyle`):

- największe opóźnienie rysowanej pozycji względem celu: **8,5 px**,
- stan rysowany **nigdy nie wychodzi poza zapas** — zawsze leży między
  poprzednią pozycją a bieżącym celem, a cele są ograniczone przez `amt × h`.

Skutkiem ubocznym jest wygładzenie parallaxu przy natywnym scrollu — ta sama
rola, jaką pełni pętla lerpa `--p` w navbarze (`.claude/rules/scroll.md`).
Kasacja zmieniłaby „feel" ruchu bez żadnego zysku, więc reguła zostaje,
z komentarzem opisującym ten pomiar.

Uwaga metodologiczna: to opóźnienie jest też powodem, dla którego zmierzone
szczeliny (§1.3, §4) są o kilka pikseli mniejsze od arytmetyki `amt × h` —
sonda czyta stan RYSOWANY, czyli to, co widzi użytkownik.

---

## 4. Wynik

| Okno | przed (widoczny pas) | po (układ) | po (widoczny pas) |
| --- | --- | --- | --- |
| 1920×1080 | 106,9 px | −13,3 px | **0 px** |
| 1440×900 | 87,7 px | −11,5 px | **0 px** |
| 1366×768 | 73,7 px | −9,7 px | **0 px** |
| 1280×560 | 51,5 px | −7,5 px | **0 px** |
| 1024×900 | 86,6 px | −10,9 px | **0 px** |
| 1152×720 | 68,6 px | −9,7 px | **0 px** |
| 1440×600 | 56,1 px | −8,5 px | **0 px** |
| 390×844 | 0 px | **−19,0 px** | 0 px |
| 768×1024 | 0 px | **−14,8 px** | 0 px |

Dwa ostatnie wiersze to dowód, że **poniżej progu nie zmieniło się nic** —
liczby są identyczne co do dziesiątej części piksela z pomiarem sprzed
naprawy (§1.3).

Waga (build produkcyjny, przed → po): `index.html` 127 603 → 127 657 B
(trzy atrybuty `data-par-d`), JS 35 494 → 35 540 B, CSS 208 574 →
208 475 B (skasowana reguła hoveru waży więcej niż dodane właściwości).
Bilans: **+1 B na całą stronę**. Budżety LHCI zostają nietknięte.

---

## 5. Baseline'y wizualne — NIE ruszyły się i to nie jest przypadek

Prompt startowy zakładał, że naprawa „na pewno ruszy baseline'y", bo zmienia
kadr zdjęcia. **Pełne `pnpm build:visual && pnpm test:visual` przeszło
zielone bez jednej regeneracji** (203 zrzuty).

Powód jest ten sam, co przy remoncie panelu (`analiza-remont-panelu.md`):
baseline'y powstają na preview, gdzie endpoint `/cdn-cgi/image` **nie
istnieje**, więc kafle realizacji są pustymi ramkami na tle `#e5e1da`.
Pixel-diff nie widzi ani kadru zdjęcia, ani odsłoniętego tła — bo tło jest
tam widoczne ZAWSZE. Zmieniłby zrzut dopiero inny układ (liczba kadrów,
geometria kafla), a tego ta poprawka nie robi.

Konsekwencja, którą trzeba wypowiedzieć wprost: **testy wizualne nie są
i nie były ochroną przed tą klasą usterki.** Stąd D-U4.

### D-U4. Strażnik w `tests/e2e/`, nie w `tests/visual/`

`tests/e2e/index.spec.ts` dostaje describe „scena realizacji: zdjęcie zawsze
pokrywa kafel (D-U1)" — ta sama sonda co w diagnozie, jako niezmiennik:

1. **wszystkie 6 profili**: przejazd przez całą sekcję krokiem 24 px, dla
   każdego kafla `max(img.top − card.top, card.bottom − img.bottom) ≤ 0`;
   kafle poza oknem pomijane (tam `parPaint` nie przemalowuje),
2. **chromium-1920**: ten sam pomiar przy 1024×900, 1152×720, 1280×560
   i 1440×600 — pasmo 1024–1280 px i niskie okna to miejsca, w których ta
   scena psuła się już dwa razy (D-Q5, D-T3).

Weryfikacja „test łapie regresję" wykonana **w obie strony**: na kodzie
sprzed naprawy 4 przebiegi desktopowe czerwone (chromium-1920 ×2,
chromium-1366, firefox-desktop), profile mobilne zielone — czyli test
lokalizuje usterkę dokładnie tam, gdzie ona jest. Po naprawie 7 zielonych,
5 pominiętych.

---

## 6. Zmienione pliki

| Plik | Zmiana |
| --- | --- |
| `src/components/sections/home/HomeRealizacje.astro` | `data-par-d="0.06"` na kafelku; desktopowy override zdjęcia = zapas w kadrze (`left/top −7%`, `width/height 114%`, `max-width: none`); kasacja martwej reguły hover-zoom; komentarz przy regule bazowej o marginesie mobilnym |
| `src/components/sections/home/home-scroll.ts` | `parPaint` czyta `data-par-d` powyżej progu desktop (wstecznie zgodne — element bez atrybutu bez zmian) |
| `tests/e2e/index.spec.ts` | strażnik D-U1 (2 testy: wszystkie profile + sweep rozmiarów okna na chromium-1920) |
| `docs/analiza-parallax-realizacje.md` | ten dokument |
| `docs/README.md`, `CLAUDE.md` | wpis i stan |

Zero nowych baseline'ów. Zero zmian poniżej progu 1024 px.

---

## 7. Do sprawdzenia na fizycznym urządzeniu

Emulacja tego nie wykryje (`.claude/rules/testing.md`):

- **desktop, prawdziwy scroll kółkiem i trackpadem** — czy kremowy pas nie
  pojawia się przy szybkim „rzucie" strony (sonda jedzie krokiem 24 px;
  szarpnięcie trackpadem to setki pikseli na klatkę). Teoria mówi, że jest
  bezpiecznie, bo cele parallaxu są ograniczone zapasem niezależnie od
  prędkości — ale to jedyne miejsce, gdzie teoria może się rozminąć
  z kompozytorem.
- **kadr zdjęć po zoomie** — czy w scenie przypiętej wszystkie trzy kafle
  nadal pokazują to, co mają pokazywać (zoom 14 % przycina po 7 % z każdej
  strony). Zdjęcia idą z CMS-a, więc to ocena Mateusza, nie testu.
- **Android, warstwy GPU** — kafel ma teraz obraz o 14 % większy od okna;
  czy scena dalej przewija się płynnie.
