# Prompt startowy: parallax odsłania tło w scenie realizacji (strona główna, desktop)

> Do wklejenia w **świeżej sesji**. Usterka jest wąska i w pełni
> zdiagnozowana pomiarem (§2) — ale naprawa **na pewno ruszy baseline'y
> wizualne**, więc wartość tej sesji leży w kalibracji i w procedurze
> baseline'ów, nie w znalezieniu przyczyny.

---

Na stronie głównej, **na desktopie**, w przypiętej scenie „Nasze realizacje"
parallax wysuwa zdjęcie poza kafel i odsłania tło kafla — kremowy pas nad
zdjęciem przy dojeżdżaniu do sekcji i pod zdjęciem przy odjeżdżaniu od niej.
**Ten obszar nie ma być widoczny nigdy.**

Zgłoszenie Mateusza wraz z pięcioma zrzutami (trzy przy dojeżdżaniu, dwa przy
odjeżdżaniu) — usterka widoczna na produkcji `delung.pl`.

## ZASADY TWARDE

- **NIGDY `git commit` ani `git push`** — commituje wyłącznie Mateusz.
  Zostawiasz zmiany w drzewie i podajesz gotowe komendy. PR-y i merge klika
  w UI GitHuba.
- **Baseline'ów wizualnych NIE regenerujesz bez pokazania diffu i zgody
  Mateusza** (blokada również w `.claude/settings.json`). Ta naprawa zmienia
  kadr zdjęcia, więc baseline'y **muszą** się ruszyć — to jest zmiana
  ZAMIERZONA i idzie przez procedurę z `.claude/rules/testing.md`, a nie
  przez „odświeżenie zrzutów".
- Kolejność baseline'ów NA ZAWSZE: kod → workflow `update-visual-baselines.yml`
  (linux, bot-commit na branch PR-a) → `pnpm test:visual:update` (darwin) na
  końcu. Bot-push nie wyzwala CI.
- **BEZ GSAP i bez Lenisa** — wyszły z projektu (D-Q1). Ruch to własne pętle
  rAF za bramką `html.js-motion`.
- Breakpoint projektu: **1024 px**; stała `HOME_DESKTOP_MIN_PX` w
  `home-config.ts` i `@media` trzymane w parze.
- Commity: conventional, po angielsku, **temat małą literą** po dwukropku,
  max 100 znaków na KAŻDĄ linię. Sprawdzony sposób: zapisz komunikat do
  `.git/msg-a`, zweryfikuj `pnpm exec commitlint < .git/msg-a`, poproś
  o `git add <pliki> && git commit -F .git/msg-a`.

## OBOWIĄZKOWA LEKTURA (w tej kolejności)

1. `CLAUDE.md` — zasady twarde i stan projektu.
2. `docs/analiza-strona-glowna.md` — **czytać PRZED każdą pracą przy stronie
   głównej** (decyzje 4.2 wraz z korektami po testach na fizycznych
   telefonach).
3. `docs/analiza-poprawki-2.md` **D-Q5** i `docs/analiza-poprawki-3.md`
   **D-T3/D-T4** — obie rundy przebudowywały DOKŁADNIE tę scenę
   (`.re-pin` z rzędu flex na siatkę, priorytety kurczenia, wysokość pudełka
   opisu, `row-gap`). Twoja zmiana nie ma prawa tego cofnąć.
4. `.claude/rules/testing.md` — kontrakt warstw i **procedura baseline'ów**.
5. `.claude/rules/sections.md` — gotchas sekcji.
6. `.claude/rules/scroll.md` — scroll w serwisie jest natywny.

## 2. STAN FAKTYCZNY — zmierzony 2026-08-06, NIE hipoteza

Pomiar wykonany na `pnpm preview` (port 4399), okno **1440×900**, przez
porównanie `getBoundingClientRect()` zdjęcia i kafla w trakcie przewijania
całej sekcji. **Metoda nie zależy od tego, czy zdjęcia się zdekodowały** —
szczelina jest faktem układu, nie pikseli (istotne, bo lokalnie endpointy
`/cdn-cgi/` nie istnieją i kadry bywają puste).

### Przyczyna

`.rc` (kafel) ma `overflow: hidden` i `background: #e5e1da` — to jest ten
kremowy pas ze zrzutów.

CSS bazowy (`HomeRealizacje.astro:250`) daje zdjęciu **zapas na parallax**:

```css
.rc img {
  position: absolute;
  top: -76px;
  height: calc(100% + 152px);
  object-fit: cover;
}
```

Ale w scenie przypiętej na desktopie leży override (`HomeRealizacje.astro:562`):

```css
:global(html.js-motion) .rc img {
  top: 0;
  height: 100%;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Zapas jest skasowany do zera**, a atrybut `data-par="0.11"`
(`HomeRealizacje.astro:92`) zostaje. `home-scroll.ts` (funkcja `parPaint`,
linie 67–84) przesuwa zdjęcie o `(0.5 − p) × 2 × amt × wysokość_hosta`, czyli
maksymalnie **±0,11 × wysokość kafla**, przy zerowym zapasie.

| Wielkość | Wartość przy 1440×900 |
| --- | --- |
| Wysokość kafla `.rc` | 900 px (kafel wypełnia przypiętą scenę) |
| Zapas nad/pod zdjęciem | **0 px** (override desktopowy) |
| Maksymalne przesunięcie parallax | ±99 px (0,11 × 900) |
| **Zmierzona najgorsza szczelina** | **96,8 px** |

### Dlaczego tylko desktop

Na mobile obowiązuje reguła bazowa: kafel ma
`height: clamp(420px, 133vw, 560px)`, więc maksymalne przesunięcie to
`0,11 × 560 = 61,6 px` i **mieści się** w 76 px zapasu. Zgadza się ze
zgłoszeniem. Sprawdź to jednak sam po zmianie — poniżej progu nic nie ma
prawa się ruszyć.

### Znaleziska poboczne — ta sama linijka CSS, ta sama sesja

1. **Hover-zoom jest martwy.**
   `:global(html.js-motion) .re-cards:hover .rc img { transform: scale(1.04) }`
   (linia 567) nigdy nie zadziała, gdy parallax pracuje: `parPaint` pisze
   `el.style.transform` **inline**, a styl inline bije regułę arkusza bez
   `!important`. Rozstrzygnij, czy hover ma wrócić (wtedy jako składnik
   transformu pisanego z JS, wzorem `data-par-scale`), czy regułę skasować
   jako martwy kod. **Nie zostawiaj jej w obecnej postaci.**
2. **`transition: transform 0.7s` na elemencie, któremu JS nadpisuje
   `transform` w każdej klatce** (linia 565). Przejście jest bez przerwy
   re-targetowane. Zmierz, co to realnie robi z płynnością i z pozycjami
   skrajnymi, i opisz wynik — jeśli okaże się szkodliwe, kasacja wchodzi do
   tej samej poprawki.

## 3. KIERUNKI NAPRAWY — policz, zmierz, PRZEDSTAW OBA

Mateusz zasugerował: *„trochę bardziej zzoomować to zdjęcie w tym kontenerze
i może trochę zmniejszyć to przesunięcie parallax"*. To trafna intuicja i ma
dokładny wzór — ale są dwie drogi i **wybór należy do Mateusza**.

### Wzór, na którym stoją obie

Przesunięcie sięga `amt × h`. Zapas musi być **nie mniejszy** niż przesunięcie:

- **zapasem jest skala:** obraz skalowany o `s` wystaje o `(s − 1) × h / 2` na
  każdą stronę, więc warunek pokrycia to **`s ≥ 1 + 2 × amt`**,
- **zapasem jest wysokość:** `top: −amt%` + `height: (100 + 2×amt)%` jest
  dopasowane **dokładnie**, bo procenty liczą się od tej samej wysokości
  kontenera, od której liczy się przesunięcie.

Liczby do sprawdzenia: `amt = 0,11` wymaga `s ≥ 1,22` (mocny dodatkowy kadr);
`amt = 0,06` wymaga już tylko `s ≥ 1,12`.

### Wariant A — skala (zgodny z resztą serwisu)

Dodaj `data-par-scale` i zmniejsz `data-par`, np. `0.06` + `1.14`
(margines nad wymaganym 1,12). Tak działa cały serwis: `ContactHero` 1,12,
`OfertaProcesCta` 1,16, `HomeKontakt` 1,1, `KategorieSection` 1,1 — mechanizm
jest już w `parPaint` i nie wymaga nowego kodu.
**Koszt:** zdjęcie traci kadr po bokach (skala działa w obu osiach).

### Wariant B — zapas procentowy zamiast pikselowego

Zamień w overridzie desktopowym `top: 0; height: 100%` na
`top: -11%; height: 122%` (albo wprost pod wybrany `amt`). Zdjęcie zostaje
w skali 1:1, zapas skaluje się razem z oknem, więc usterka nie może wrócić
przy żadnej wysokości okna.
**Koszt:** `object-fit: cover` kadruje wtedy pod wyższy prostokąt, więc kadr
i tak się zmienia — tyle że przez wysokość, nie przez zoom.

**Nie wybieraj sam.** Zbuduj oba, zmierz każdy tą samą sondą, pokaż Mateuszowi
zrzuty przed/po i **liczbę: najgorsza szczelina w całym przebiegu ma być
≤ 0 px**. Dopiero potem implementuj wybrany.

### Czego robić NIE WOLNO

- Nie zmieniaj `.rc { overflow: hidden }` ani tła kafla — tło ma pozostać
  ostatnią linią obrony, a nie sposobem na ukrycie problemu.
- Nie „napraw" tego, wyłączając parallax na desktopie bez decyzji Mateusza —
  to zmiana projektowa, nie techniczna.
- Nie ruszaj geometrii `.re-pin`, pudełka opisu ani rozpórki — to dorobek
  D-Q5, D-T3 i D-T4, okupiony dwiema rundami poprawek.

## 4. JAK WERYFIKOWAĆ

### Sonda (użyj tej samej co w diagnozie)

Na `pnpm preview` przewiń całą sekcję krokiem ~20 px i dla **każdego z trzech
kafli** licz `max(img.top − card.top, card.bottom − img.bottom)`. Wynik
dodatni = odsłonięte tło. **Kryterium: ≤ 0 px w całym przebiegu.**

Powtórz przy co najmniej: **1440×900, 1920×1080, 1366×768** oraz przy niskim
oknie (**1280×560**) — pasmo 1024–1280 px szerokości i niskie okna to miejsca,
w których ta scena psuła się już dwa razy (D-Q5, D-T3).

### Warstwy testów

- `pnpm test:e2e` — scena ma spece funkcjonalne (kafle, detal, „Więcej").
  **Buduj `pnpm build` przed e2e**; `pnpm build:visual` podkłada fixture
  i daje fałszywe czerwone (pułapka zweryfikowana 2026-08-06).
- `pnpm build:visual && pnpm test:visual` — **baseline'y sceny realizacji na
  profilach desktopowych SIĘ RUSZĄ i to jest oczekiwane.** Pokaż Mateuszowi
  diff, uzyskaj zgodę, potem komplet linuksowy z workflow i darwin na końcu.
- Pełna bramka: `format:check`, `lint`, `typecheck`, `test:unit`, `build`.
- Budżety LHCI: zmiana nie dokłada bajtów (atrybuty + CSS), ale sprawdź, czy
  `total` się nie ruszył — zoom nie zmienia pliku, zmiana wysokości też nie.

### Rozważ test-strażnik (opcjonalny, do decyzji Mateusza)

Sonda z §4 jest tanim, deterministycznym niezmiennikiem („zdjęcie zawsze
pokrywa kafel") i łapie regresję lepiej niż pixel-diff, bo nie zależy od
zdekodowanych obrazów. Jeśli go dopiszesz — do `tests/e2e/`, nie do
`tests/visual/`, i **nie zamiast** baseline'ów.

## 5. DEFINITION OF DONE

- Szczelina **≤ 0 px** we wszystkich zmierzonych rozmiarach okna, dla
  wszystkich trzech kafli, w obie strony przewijania.
- Poniżej progu 1024 px **nic się nie zmieniło** (zmierzone, nie założone).
- Oba znaleziska poboczne (martwy hover-zoom, `transition` na nadpisywanym
  transformie) rozstrzygnięte i opisane.
- Wariant naprawy **wybrany przez Mateusza** na podstawie zrzutów i liczb.
- Baseline'y: OBA komplety (linux + darwin) w tym samym PR, po zgodzie na diff.
- Pełna bramka zielona, e2e puszczone na `pnpm build` (nie `build:visual`).
- Mini-analiza w `docs/` wzorem `analiza-*.md` (po polsku): przyczyna, wybrany
  wariant wraz z odrzuconym i powodem, liczby przed/po, wpływ na baseline'y.
- Wpis w `docs/README.md` dla nowego pliku `.md`.
- `CLAUDE.md`: dopisany stan (to korekta ustaleń 4.2 o parallaxie sceny).
- Komunikaty commitów przygotowane i zweryfikowane commitlintem.
