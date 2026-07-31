# Etap 4 — prompty startowe per część

Etap 4 (widoki) prowadzimy **po jednej części na sesję Claude Code** —
każda część startuje osobnym promptem z tego pliku, w ŚWIEŻEJ sesji.
Po merge'u części Mateusz testuje widok sam (preview PR-a + produkcja +
fizyczny telefon) i ewentualne poprawki zleca krótkim promptem korekty
(szablon na dole). Dzięki temu sesje są małe, a między częściami jest
naturalna bramka QA.

Kolejność części (zgodna z instrukcją wykonawczą, część B → Etap 4):

| Część | Zakres                                                  | Prompt |
| ----- | ------------------------------------------------------- | ------ |
| 4.1   | Chrome globalny: navbar, menu bottom sheet, footer, BackButton | §4.1 |
| 4.2   | Strona główna                                            | §4.2   |
| 4.3   | `/oferta/` + `/kategorie/`                               | §4.3   |
| 4.4   | `/realizacje/` (filtry, detal, wideo)                    | §4.4   |
| 4.5   | `/proces-wspolpracy/` + `/o-nas/` + `/polityka-prywatnosci/` + domknięcie etapu | §4.5 |

---

## Kontekst wspólny (KAŻDA sesja czyta tę sekcję na starcie)

Obowiązkowa lektura przed pracą: `docs/README.md` (indeks) → sekcja
Etapu 4 z `docs/delung-web-creation-process.md` → `.claude/rules/testing.md`
i `.claude/rules/sections.md` (w całości) → `docs/design/README.md` +
plik(i) HTML designu danej części → mini-analizy `docs/analiza-*.md`
z poprzednich części (spójność decyzji!). Decyzje D1–D8
z `docs/delung-web-entrance-analysis.md` są zapadłe — nie otwierać.

**Pętla części** (docs-first): mini-analiza `docs/analiza-*.md` (po polsku,
decyzje portu z referencji; przedstawiona Mateuszowi PRZED implementacją)
→ implementacja → testy → baseline'y → PR. Po merge'u: aktualizacja
„Stanu projektu" w CLAUDE.md (która część wykonana, numer PR-a) — kolejna
sesja musi wiedzieć, gdzie jesteśmy.

**Podział ról**: kod pisze Claude, commituje WYŁĄCZNIE Mateusz (Claude
proponuje treści commitów: conventional, po angielsku, temat ZAWSZE małą
literą po dwukropku — commitlint odrzuca wielką literę/skrót na starcie).
Kroki w chmurze klika Mateusz — instrukcje do PR-ów i workflowów podawać
jako kliki w UI GitHuba, NIE komendy `gh`.

**Lekcje z Etapu 3** (nie ma ich w innych dokumentach):

1. Astro inlinuje małe pliki CSS w `<style>` PRZED linkowanymi bundlami —
   override tokenów zwykłym `:root` PRZEGRYWA kolejnością (stąd
   `html:root` w `legacy-dark.css`). Przy porcie widoku USUŃ z niego
   import `legacy-dark.css`; po ostatnim porcie (4.5) skasuj cały plik.
2. Allowlista axe (`tests/e2e/a11y.spec.ts`) jest PUSTA i tak ma zostać.
   Drobny tekst na jasnym tle: `--accent-ink` (#256f47), nie `--accent`
   (#2f8f5b ma na bieli ~4.0:1 — za mało); `--faint` = 0.64 (AA także na
   cream). Każdy nowy widok przechodzi skan bez wpisów.
3. Testy sekcji strony głównej czekają na odskipowanie (szukać
   `test.skip(() => true` z komentarzem „Etap 4"): cały
   `tests/e2e/work.spec.ts`, describe „banner na stronie głównej"
   w `contact-index.spec.ts`, describe „dojście ze strony głównej"
   w `work-index.spec.ts` (w środku test z resztkami EN — przepisać
   PL-only). Selektory adaptować do nowych widoków.
4. Smoke i navigation używają celowo OGÓLNYCH asercji (`main h1`,
   `#contact .kt-form`) — nowe widoki muszą je spełniać; smoke nie
   zmieniać bez potrzeby.
5. Test „pasek chowa się przy scrollu" liczy pozycje z realnej wysokości
   `/realizacje/`; test BackButton biega na `/kontakt/` — po portach
   podstron przenieść/uogólnić wg komentarzy w specach.
6. Baseline'y wizualne: istnieją dla `work-index` i `contact-index`
   (36 linux + 36 darwin). Każda zmiana wyglądu = OBA komplety w tym
   samym PR, kolejność NA ZAWSZE: kod → workflow „Update linux visual
   baselines" z brancha PR (Actions → Run workflow → wybrać branch) →
   `git pull` → lokalny `pnpm test:visual:update` i commit darwin NA
   KOŃCU (bot-push nie wyzwala CI). Nowe widoki dostają własne specy
   w `tests/visual/`.
7. Budżety LHCI (`lighthouserc*.cjs`) mają zapas na przyrost sekcji
   (baseline szkieletu w komentarzach). Zbliżanie się do progów zgłaszać
   Mateuszowi (zmiana progu = jego decyzja, osobny commit). Zacieśnienie
   do nowego baseline'u = domknięcie etapu (4.5).
8. Breakpoint delung: **1024 px**. Odziedziczone komponenty mają 760/861 —
   przy porcie widoku wyrównać (stała w configu + `@media` w parze).
9. Po zmianach wymagających fizycznego telefonu (karuzele, sheety, wideo
   na tap, Lenis feel) — wskazać Mateuszowi wprost, co sprawdzić na
   urządzeniu.

**Definition of done części**: mini-analiza w `docs/` + wpis
w `docs/README.md`; lokalnie zielone `pnpm typecheck`, `lint`,
`test:unit`, `test:e2e` (6 profili) i `test:visual`; oba komplety
baseline'ów w PR; zero nowych wpisów w allowliście axe; breakpoint 1024
w portowanym widoku; import `legacy-dark.css` usunięty z portowanego
widoku; PR zielony na 3 required checkach; po merge'u prod-smoke zielony;
CLAUDE.md zaktualizowane.

---

## §4.1 — Prompt: chrome globalny

```
Kontynuujemy budowę delung.pl — Etap 4, CZĘŚĆ 4.1: chrome globalny.
Najpierw przeczytaj sekcję „Kontekst wspólny" z docs/etap-4-prompty.md
i wykonaj wskazaną tam lekturę. Zacznij od git pull na main.

Zakres (instrukcja, Etap 4 pkt 1): navbar wg designów (hdr/hdr-nav,
warianty plain/dark), menu mobile jako BOTTOM SHEET (wzorzec sheet-*
z eksportów, na szkielecie overlay.ts — focus-trap, Esc, swipe-down,
blokada scrolla za darmo), footer (ft: Instagram delung_meble, BEZ
Facebooka, link polityki), BackButton + data-back na podstronach.

Uwagi specyficzne:
- Chrome jest wspólny dla wszystkich stron → zmiana wyglądu dotknie
  istniejących baseline'ów work-index/contact-index — w PR muszą się
  zaktualizować (święta kolejność z kontekstu wspólnego).
- tests/e2e/navigation.spec.ts opiera się na kontraktach selektorów
  (data-nav, data-burger, .m-link, .brand-menu, .bkb, data-hidden,
  data-open) — utrzymaj je albo zaadaptuj spec w tym samym PR.
- Menu mobile przechodzi z panelu na bottom sheet — zaktualizuj testy
  otwierania/zamykania (Esc, fokus) i dodaj e2e swipe-down, jeśli
  wzorzec overlay.ts na to pozwala.
- Breakpoint chrome'u: 1024 px (stała + @media w parze).

Zacznij od mini-analizy docs/analiza-chrome-globalny.md i przedstaw mi
ją do akceptacji, zanim cokolwiek zmienisz w kodzie.
```

## §4.2 — Prompt: strona główna

```
Kontynuujemy budowę delung.pl — Etap 4, CZĘŚĆ 4.2: strona główna.
Najpierw przeczytaj sekcję „Kontekst wspólny" z docs/etap-4-prompty.md
i wykonaj wskazaną tam lekturę (w tym docs/analiza-chrome-globalny.md
z części 4.1). Zacznij od git pull na main.

Zakres (instrukcja, Etap 4 pkt 2, referencja docs/design/index.html):
hero z umiarkowanymi animacjami (reveal/parallax; BEZ sceny urządzeń),
zajawki oferta/proces/realizacje/o-nas, opinie, CTA kontaktu (banner
z kotwicą #contact), crossfade tła jeśli design go wymaga.

Uwagi specyficzne:
- Odskipuj i zaadaptuj testy sekcji strony głównej (lekcja 3 kontekstu
  wspólnego): work.spec.ts, banner w contact-index.spec.ts, dojście
  w work-index.spec.ts (przepisz test z EN na PL-only).
- Smoke asertuje `main h1` na / — hero musi go renderować.
- Sekcja realizacji na głównej: max 3 wpisy, kafle → Modal/BottomSheet
  przez overlay.ts (wzorce w src/components/sections/work/).
- Test polityki „strzałka wstecz wraca w zapamiętane miejsce" porównuje
  scroll z zapamiętanym — długa strona główna naturalnie go zaostrzy.
- Nowy spec visual strony głównej w tests/visual/ + baseline'y.
- Obserwuj budżety LHCI (hero = LCP!) — zbliżenie do progów zgłoś.

Zacznij od mini-analizy docs/analiza-strona-glowna.md i przedstaw mi ją
do akceptacji, zanim cokolwiek zmienisz w kodzie.
```

## §4.3 — Prompt: /oferta/ + /kategorie/

```
Kontynuujemy budowę delung.pl — Etap 4, CZĘŚĆ 4.3: /oferta/ i
/kategorie/. Najpierw przeczytaj sekcję „Kontekst wspólny"
z docs/etap-4-prompty.md i wykonaj wskazaną tam lekturę (w tym
mini-analizy części 4.1–4.2). Zacznij od git pull na main.

Zakres (instrukcja, Etap 4 pkt 3; referencje docs/design/oferta.html
i kategorie.html): wspólne dane z src/lib/categories.ts (JEDNO źródło
prawdy) + treści oferty; desktop zakładki+panel, mobile karuzela 3 kafli
+ „zobacz pełną ofertę" → /kategorie/; /kategorie/ zostaje mobile-only
z client-side redirectem desktop → /oferta/ przed paintem (mechanizm
z Etapu 0 — nie ruszać).

Uwagi specyficzne:
- Gotchas karuzel (sections.md): data-lenis-prevent-horizontal (NIE
  data-lenis-prevent!) + scroll-snap-stop: always.
- a11y skanuje /kategorie/ tylko na profilu pixel (redirect na desktopie)
  — już tak jest w a11y.spec.ts, nie zmieniaj.
- navigation.spec: klik „Oferta" asertuje main h1 — nowy widok musi
  spełniać; dodaj specy e2e zakładek/karuzeli i specy visual obu stron.
- Kontrakt selecta kategorii w CMS (test kontraktu) zależy od
  categories.ts — treści oferty NIE zmieniają slugów.

Zacznij od mini-analizy docs/analiza-oferta-kategorie.md i przedstaw mi
ją do akceptacji, zanim cokolwiek zmienisz w kodzie.
```

## §4.4 — Prompt: /realizacje/

```
Kontynuujemy budowę delung.pl — Etap 4, CZĘŚĆ 4.4: /realizacje/.
Najpierw przeczytaj sekcję „Kontekst wspólny" z docs/etap-4-prompty.md
i wykonaj wskazaną tam lekturę (w tym mini-analizy części 4.1–4.3
i .claude/rules/cms-realizacje.md). Zacznij od git pull na main.

Zakres (instrukcja, Etap 4 pkt 4; referencja docs/design/realizacje.html):
szyna filtrów (tylko kategorie z wpisami — puste ukryte), siatka kafli
z Content Collections, detal = Modal (desktop) / BottomSheet (mobile)
przez overlay.ts; galeria detalu: zdjęcia przez imgAt(), wideo
<video preload="none" poster={imgAt(...)} playsinline controls>
odtwarzane na tap (badge play + duration wg designu).

Uwagi specyficzne:
- To jest port istniejącego przejściowego widoku: usuń z niego import
  legacy-dark.css (jasny design docelowy) i wyrównaj breakpointy
  760→1024 (razem ze stałą sheetMQ, jeśli dotyczy).
- E2E: filtrowanie, otwarcie/zamknięcie detalu, odtworzenie wideo
  FUNKCJONALNIE (nie na zrzutach); wideo na zrzutach visual ZAWSZE przez
  maskę (testing.md). work-index.spec.ts adaptuj do nowego widoku.
- Media żyją w R2 (media.delung.pl) — lokalne 404 obrazów na preview to
  znany artefakt (collectPageIssues już je filtruje); rozmiary obrazów
  WYŁĄCZNIE przez imgAt().
- Zmiana schematu CMS (gdyby była potrzebna) = TRZY miejsca naraz
  (cms-realizacje.md) — ale schemat jest docelowy od Etapu 2, więc
  raczej NIE będzie potrzebna.
- Po implementacji wskaż mi, co sprawdzić na fizycznym telefonie
  (sheet, wideo na tap przy Low Power Mode, snap karuzeli galerii).

Zacznij od mini-analizy docs/analiza-realizacje.md i przedstaw mi ją
do akceptacji, zanim cokolwiek zmienisz w kodzie.
```

## §4.5 — Prompt: proces + o-nas + polityka + domknięcie etapu

```
Kontynuujemy budowę delung.pl — Etap 4, CZĘŚĆ 4.5 (ostatnia):
/proces-wspolpracy/, /o-nas/, /polityka-prywatnosci/ + domknięcie etapu.
Najpierw przeczytaj sekcję „Kontekst wspólny" z docs/etap-4-prompty.md
i wykonaj wskazaną tam lekturę (w tym mini-analizy 4.1–4.4). Zacznij od
git pull na main. UWAGA: w tej części każdy widok = OSOBNY PR (trzy małe
PR-y po kolei), domknięcie etapu = czwarty, porządkowy.

Zakres (instrukcja, Etap 4 pkt 5; referencje proces-wspolpracy.html,
o-nas.html, polityka-prywatnosci.html):
- /proces-wspolpracy/: hero + 4 kroki + efekt + CTA.
- /o-nas/: manifest, zespół, opinie.
- /polityka-prywatnosci/: TREŚĆ zostaje (jest docelowa, z designu D4;
  e-mail i telefon składane w JS — NIE psuć kontraktu antyscrapingowego)
  — port dotyczy tylko chrome'u/motywu na jasny design.

Domknięcie etapu (po merge'u trzech widoków):
- Skasuj src/styles/legacy-dark.css (ostatni użytkownik = polityka).
- Uogólnij testy z lekcji 5 kontekstu wspólnego (BackButton na
  wszystkich podstronach).
- Zaproponuj zacieśnienie budżetów LHCI do nowego baseline'u pełnej
  strony (pomiar z CI → osobny commit, decyzja Mateusza).
- Zaktualizuj CLAUDE.md: Etap 4 — WYKONANY (data, numery PR-ów),
  wykreśl wpis o przejściowym dziedzictwie szablonu.

Zacznij od mini-analizy docs/analiza-proces-onas-polityka.md (może być
jedna wspólna dla trzech prostych widoków) i przedstaw mi ją do
akceptacji, zanim cokolwiek zmienisz w kodzie.
```

---

## Szablon promptu korekty (po własnych testach części)

```
Poprawki do części 4.X (widok <ścieżka>) po moich testach. Przeczytaj
sekcję „Kontekst wspólny" z docs/etap-4-prompty.md oraz
docs/analiza-<część>.md. Zacznij od git pull na main. Lista uwag:

1. <urządzenie/viewport, strona, co jest nie tak, oczekiwane zachowanie>
2. ...

Pracuj na feature branchu (fix/<część>-poprawki); jeśli zmieniasz
wygląd — baseline'y w świętej kolejności; commituję ja.
```
