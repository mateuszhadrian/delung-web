# Prompt startowy: refactor (po rundzie poprawek 3, przed Etapem 7)

> Do wklejenia w ŚWIEŻEJ sesji. Zawiera wszystko, czego nowa sesja
> potrzebuje, żeby pracować bez odtwarzania wiedzy z poprzednich rozmów.
> Zakres refaktoru Mateusz poda OSOBNYM promptem — patrz „Tryb pracy", pkt 2.

---

Pracujemy nad delung.pl. **Zadanie: refactor kodu przed Etapem 7 (przekazanie
klientowi).** Świeża sesja: nie masz kontekstu z poprzednich rozmów, cała
wiedza jest w repo.

Zacznij od `git checkout main && git pull && git status` (drzewo powinno być
czyste), potem wykonaj lekturę niżej W CAŁOŚCI, zanim cokolwiek zaproponujesz.

## OBOWIĄZKOWA LEKTURA (w tej kolejności)

1. `CLAUDE.md` — zasady twarde, stan projektu (Etapy 0–6 + trzy rundy
   poprawek), mapa projektu, komendy.
2. `docs/README.md` — indeks statusów dokumentacji.
3. `.claude/rules/` — WSZYSTKIE pliki: `testing.md`, `sections.md`,
   `scroll.md`, `cms-realizacje.md`, `capture-scripts.md`. To są kontrakty,
   nie sugestie — refactor ma je respektować albo świadomie zmienić RAZEM
   z regułą.
4. `docs/analiza-poprawki-3.md` i `docs/analiza-poprawki-2.md` — dwie
   ostatnie rundy. Czytaj je nie dla samych decyzji, tylko dla **katalogu
   pułapek pomiarowych**: one kosztowały najwięcej czasu i refactor może
   w nie wejść ponownie.
5. Analizy widoków, których dotknie refactor — TYLKO te potrzebne, po
   ustaleniu zakresu: `analiza-chrome-globalny.md`, `analiza-strona-glowna.md`,
   `analiza-oferta-kategorie.md`, `analiza-realizacje.md`,
   `analiza-proces-onas-polityka.md`, `analiza-kontakt.md`,
   `analiza-etap-6.md`, `analiza-poprawki-wizualne.md`.

Decyzje D1–D8 z `docs/delung-web-entrance-analysis.md` są ZAPADŁE — nie
otwieraj ich na nowo.

## STAN, KTÓREGO NIE MUSISZ ODKRYWAĆ

- Astro 6 **static** (bez SSR), PL-only, breakpoint **1024 px**, hosting
  Cloudflare Pages, `main` = produkcja (chroniony; required checks:
  `quality`, `e2e`, `lighthouse`; po merge'u leci `prod-smoke.yml`).
- **Etapy 0–6 zamknięte. Trzy rundy poprawek zamknięte** (PR #20–#22,
  #29–#33, #36–#39). Wszystkie 8 widoków gotowych, formularz działa
  (Resend + Turnstile + KV), CMS Sveltia działa, SEO i pomiar wdrożone.
- **Scroll w całym serwisie jest NATYWNY.** Lenis wyszedł z projektu
  (D-Q1) — powód w `.claude/rules/scroll.md`. **Wróci jakikolwiek
  wygładzacz — wróci klatkowanie hero w Safari.** Postęp `--p` navbara jest
  wygładzany własną pętlą rAF (rekompensata, nie ozdoba).
- Bez GSAP, bez Lenisa, bez ciemnego motywu, bez toastów, bez ambientu.
  Allowlista axe **PUSTA** i taka zostaje.
- Budżety LHCI po zacieśnieniu z rundy 3 (`lighthouserc.cjs` /
  `lighthouserc.desktop.cjs`): mobile perf 0,80 / LCP 5200 / TBT 150 /
  CLS **0,015** / script **20 000** B / total **860 000** B; desktop
  perf 0,9 / LCP **1700** / TBT 200 / CLS 0,01 / script **20 000** B /
  total **1 580 000** B.
- Zmierzone w CI na `main` (dwa zielone przebiegi, runy 30909810628
  i 30911240907): mobile perf 0,88/0,86 · LCP 3838/4062 ms · TBT 0 ·
  CLS 0,0117 · **script 13 659 B** · total 811 389/811 410 B; desktop
  perf 0,94/0,95 · LCP 1566/1541 ms · TBT 89/0 · CLS 0,0042 ·
  script 13 659 B · total 1 514 451/1 514 472 B.
  **Refactor nie ma prawa tych liczb podnieść** — zapas w `total` jest
  najciaśniejszy (~6 % na mobile).
- **Runner GitHuba bywa wolny** — ten sam kod potrafił dać LCP 3918 ms albo
  4890 ms, a TBT desktop 22 albo 138 ms. Czerwony `lighthouse` na metryce
  czasowej przy niezmienionych bajtach = najpierw hipoteza szumu (re-run
  jobu), a NIE ruszanie progów.

## TRYB PRACY

1. **Najpierw lektura**, dopiero potem rozmowa o zakresie.

2. **Poproś Mateusza o jego prompt refaktoru.** Ma go przygotowany (po
   angielsku) i to on definiuje ZAKRES. Nie zgaduj zakresu, nie proponuj
   własnej listy „co by się przydało" przed jego przeczytaniem. Gdy go
   dostaniesz:
   - potraktuj go jako specyfikację celu, ale **zweryfikuj go o stan repo** —
     jeśli coś w nim opisuje kod, którego już nie ma (GSAP, Lenis, toasty,
     ciemny motyw, progi 760/861, `SkeletonPage`, ambient), powiedz to
     wprost zamiast „naprawiać" nieistniejące rzeczy;
   - jeśli jakiś punkt kolidowałby z zapadłą decyzją (lista niżej), zgłoś
     kolizję i zapytaj, zanim cokolwiek ruszysz.

3. **Mierz, nie zgaduj.** Zanim zaproponujesz zmianę „bo tak jest czyściej",
   zbierz fakty: co realnie importuje dany moduł, ile waży, czy ma test,
   czy jest martwy. Twarde dowody: `grep`/`rg` po repo, `pnpm build` i
   porównanie bajtów w `dist/`, sondy w przeglądarce.

4. **Docs-first**: napisz `docs/analiza-refactor.md` (po polsku, wzorzec
   `analiza-poprawki-3.md`, numeracja decyzji **R1, R2, …**): zakres
   z promptu Mateusza → stan zastany Z POMIARU → decyzje z konsekwencjami →
   implementacja (pliki) → testy → rachunek baseline'ów → podział na PR-y →
   ryzyka. Dopisz plik do `docs/README.md`. **Przedstaw do akceptacji, zanim
   ruszysz kod.** Jeśli refactor koryguje wcześniejszą decyzję (D-CH…,
   D-SG…, D-OK…, D-R…, D-K…, D-P…, D-E…, D-Q…, D-T…), opisz ją jako
   **KOREKTA D-…** i zdubluj dopiskiem w odpowiedniej analizie widoku.

5. **Implementacja → testy → PR.** Jeden PR = jedna spójna grupa zmian.
   Kolejność: od najmniej ryzykownych (martwy kod, nazwy, typy) do
   najbardziej (struktura sekcji, mechanika nakładek). Po każdym PR-ze
   pełna bramka lokalnie, zanim ruszysz następny.

6. Po merge'ach zaktualizuj „Stan projektu" w `CLAUDE.md` (data + numery
   PR-ów) i statusy w `docs/README.md`.

## CO ZNACZY „REFACTOR" W TYM PROJEKCIE

- **Zero zmian zachowania i zero zmian wyglądu.** Baseline'y wizualne
  (`tests/visual/__screenshots__/`, 203 zrzuty na 6 profilach) i specy e2e
  (541 testów) są siatką bezpieczeństwa refaktoru. **Czerwony baseline to
  sygnał błędu, a nie zadanie „zaktualizuj zrzuty".** Regeneracja wchodzi
  w grę wyłącznie wtedy, gdy zmiana wyglądu była ZAMIERZONA i Mateusz ją
  zaakceptował po obejrzeniu diffu.
- Pokrycie testami nie maleje. Jeśli kasujesz kod, skasuj też jego testy;
  jeśli przenosisz kod, testy mają iść za nim.
- Bajty nie rosną — patrz liczby wyżej.
- Publiczne kontrakty, których NIE wolno złamać po cichu (każdy ma test):
  - stałe `*_DESKTOP_MIN_PX` w configach sekcji importowane przez testy,
    a `@media` w `.astro` trzymane z nimi W PARZE (CSS nie zaimportuje
    stałej);
  - **antyscraping D-CH5**: telefon i e-mail NIE mogą istnieć w statycznym
    źródle — składa je JS z `src/lib/contact-details.ts`,
    `src/lib/jsonld.ts` celowo ich nie zna, a test grepuje CAŁY katalog
    `dist`;
  - `imgAt()` (`src/lib/img.ts`) = JEDYNE miejsce wiedzy o rozmiarach
    obrazów; wideo bez transformacji, wprost z R2;
  - schemat CMS w TRZECH miejscach naraz (`content.schema.ts` /
    `public/admin/config.yml` / komponenty work) — `.claude/rules/cms-realizacje.md`;
  - bramka fontu hero `html.hero-wait` (D-T1): skrypt `is:inline` stoi
    PRZED markupem hero i musi tam zostać (klasa ma być przed pierwszym
    paintem), a sygnałem jest **`document.fonts.load(font, tekst)`**, nie
    `document.fonts.ready`;
  - `KategorieSheets.astro` jest współdzielony przez `/kategorie/`, `/`
    i `/oferta/`; detal realizacji to JEDEN overlay `#work-detail`;
  - moduły ruchu (`*-motion.ts`, `home-scroll.ts`) ładowane dynamicznie
    TYLKO przy `prefers-reduced-motion: no-preference`; bez JS strona
    renderuje pełną, statyczną treść.

## ZASADY TWARDE

- **NIGDY nie wykonuj `git commit` ani `git push`** — commituje wyłącznie
  Mateusz (blokada też w `.claude/settings.json`). Zostawiasz zmiany
  w working tree i podajesz gotowe komendy.
- Commity: conventional, po angielsku, temat ZAWSZE **małą literą** po
  dwukropku. Commitlint wymusza max 100 znaków na KAŻDĄ linię body.
  SPRAWDZONY SPOSÓB: zapisz komunikat do pliku w katalogu gita
  (np. `.git/msg-a`), zweryfikuj `pnpm exec commitlint < .git/msg-a`,
  a Mateusza poproś o `git add <pliki> && git commit -F .git/msg-a`.
  Pliki w `.git/` nie są śledzone i przeżywają przełączanie gałęzi.
- Komendy dla Mateusza podawaj **JEDNOLINIOWE**. PR-y i merge klika w UI
  GitHuba — opisuj klikami.
- **Kolejność przy każdym PR-ze**: `git checkout main && git pull` →
  `git checkout -b <branch>` → commit → push → PR → **czekaj, aż GitHub
  pokaże PR jako zmergowany** → dopiero wtedy `git checkout main && git pull
&& git branch -d <branch>`. Uwaga z rundy 3: `git branch -d` USUWA gałąź
  także wtedy, gdy nie jest zmergowana do `main`, o ile jest wypchnięta na
  swój upstream — sprzątanie przed merge'em kasuje lokalną gałąź i wygląda
  jak utrata pracy (commit siedzi wtedy na origin, więc nic nie ginie, ale
  robi zamieszanie).
- **Baseline'y wizualne**: NIE aktualizuj bez pokazania diffu OBRAZKIEM
  i zgody Mateusza. Święta kolejność: kod → workflow „Update linux visual
  baselines" z brancha PR-a (Actions → Run workflow → wybierz branch) →
  `git pull` → lokalnie `pnpm test:visual:update` → commit darwin NA KOŃCU
  (bot-push nie wyzwala CI). Komplety darwin i linux mogą różnić się
  LICZBĄ plików.
- Nie edytuj `src/content/realizacje/*.json` (pisze je Sveltia CMS). Nie
  dotykaj `dist/` ani `.astro/`. Sekretów (`.env*`, klucze Resend/
  Turnstile/R2/Cloudflare) nie czytaj i nie loguj.
- Zero nowych wpisów w allowliście axe.
- Zmiana progów LHCI = osobna decyzja Mateusza i OSOBNY commit.

## TESTY (kontrakt: `.claude/rules/testing.md`)

- Warstwy: `pnpm test:unit` / `pnpm test:e2e` (6 profili) /
  `pnpm build && pnpm test:visual` (WYMAGA preview na 4399 — strażnik
  `assertPreview`, nie obchodź go).
- Przed oddaniem PR-a komplet: `format:check`, `lint`, `typecheck`,
  `test:unit`, `test:e2e`, `build` + `test:visual`.
- Profile: chromium-1920 (1920×1080), chromium-1366 (1366×768),
  firefox-desktop (1920×1080), webkit-iphone-se (320×568),
  webkit-iphone-14 (390×844), chromium-pixel-5 (393×727, DPR 2,75).
- **Profile testowe mają tylko dwie szerokości desktopowe.** Bug z rundy 3
  (ucinany opis) żył przy 1024–1280 px i był dla nich NIEWIDOCZNY. Jeśli
  refactor dotyka układu, dokładaj w teście własne przemiatanie szerokości
  i wysokości zamiast ufać profilom.
- Każda zmiana zachowania dostaje test, który złapałby regresję — i sprawdź,
  że go łapie: cofnij zmianę (`git checkout HEAD -- <plik>` z kopią
  zapasową), zobacz czerwony test, przywróć. W ostatnich dwóch rundach
  robiłem to za każdym razem i kilka razy okazało się, że pierwsza wersja
  testu niczego nie pilnowała.
- Testów wizualnych nie „naprawiaj" globalnym progiem — od tego jest
  `{platform}` w ścieżce snapshotów.

## PUŁAPKI, KTÓRE JUŻ RAZ KOSZTOWAŁY CZAS

**Fonty i rasteryzacja (runda 3):**

- **`document.fonts.ready` bywa sygnałem fałszywym.** Rozstrzyga się, gdy
  dokument nie ma W DANEJ CHWILI trwających pobrań fontów — a przy
  `<link rel=preload>` pobranie w rozumieniu Font Loading API może się
  jeszcze nie zacząć. Wiarygodne jest dopiero jawne
  `document.fonts.load(<skrót fontu>, <realny tekst>)`.
- Gecko po podmianie kroju **nie unieważnia rastra** napisów SVG
  rysowanych przez `<use>` i `clip-path` — stąd zdublowane napisy hero
  w Firefoksie. Wymuszone przemalowanie (`display:none` → odczyt →
  przywrócenie) działa TYLKO przy zamrożonej animacji; przy żywej
  animacji duch zostaje. Dlatego stoi tam bramka.

**Pomiar geometrii (rundy 2 i 3):**

- Elementy z `transition` na `transform` (np. `.re-tx`, 0,55 s) kłamią przy
  odczycie tuż po zmianie — mierz z `*{transition:none!important}`.
- Elementy ułożone jedno na drugim z `opacity: 0` **dalej łapią
  kliknięcia** — sprawdzaj `document.elementFromPoint`, nie widoczność.
- Jednostki `cqh` liczą się od **content-boxa** kontenera, nie od jego
  wysokości z ramką i paddingiem. Przeniesienie `container-type` gdzie
  indziej zmienia też CHARAKTER ramp: z reaktywnych (reagujących na nacisk
  układu) na proaktywne (reagujące wprost na rozmiar okna) — i potrafi
  odwrócić zaplanowaną kolejność kurczenia.
- **Długość wpisana z JS nigdy nie jest bit w bit tym, co przeglądarka
  wyliczyła sama** — wpisuj ją tylko tam, gdzie naprawdę trzeba (dwa razy
  wywróciło to testy wizualne o ułamek piksela).
- Playwright liczy różnice **percepcyjnie** (domyślny `threshold: 0.2`) —
  „214 px różnicy" w logu ≠ 214 px w porównaniu bajt po bajcie.
- Zrzut ELEMENTU łapie też to, co się na nim maluje (przyklejony pasek).

**Metodyka:**

- **Wstrzyknięcie CSS po `load` samo działa jak przemalowanie** i potrafi
  „naprawić" objaw, który badasz. Zamrożenia animacji podawaj PRZED startem
  strony (`page.addInitScript`), inaczej mierzysz własne narzędzie.
- Zamrażanie klatek/scen generuje własne artefakty — ostateczną weryfikację
  rób **na żywej stronie, bez wstrzyknięć**.
- Emulacja Playwrighta ≠ prawdziwa przeglądarka. Problem wydajnościowy albo
  zależny od paska przeglądarki mierz **na fizycznym urządzeniu**: zbuduj
  warianty przełączane hashem (`#dbg-…` → klasa na `<html>` z inline'owego
  skryptu), postaw `pnpm preview --port 4399 --host 0.0.0.0` i podaj
  Mateuszowi adres w sieci lokalnej (`ipconfig getifaddr en0`). Zbieraj
  protokół „wariant → działa/nie działa", nie wrażenia. **Rusztowanie usuń
  przed PR-em.**
- Zanim uznasz coś za flake, powtórz test kilka razy na czystym `main`.
  Dwa identyczne przebiegi z identycznymi liczbami to NIE flake.
- Czerwony CI przy zielonym lokalnie: `gh run download <id> -D <katalog>`
  i porównaj `actual` z baseline'em (`playwright-report/data/*.png`).

## NARZĘDZIA, KTÓRE WARTO ZNAĆ OD RAZU

- **Sonda Playwrighta poza repo**: skrypty pomiarowe pisz w katalogu
  scratchpad sesji i importuj Playwrighta ŚCIEŻKĄ BEZWZGLĘDNĄ
  (`/Users/mateuszhadrian/Projects/delung-web/node_modules/playwright/index.mjs`)
  — Node rozwiązuje pakiety względem pliku, nie względem cwd. Mierz na
  `pnpm preview --port 4399` (build, nie dev).
- **Liczby LHCI z CI bez zgadywania**: job `lighthouse` wrzuca medianowy
  raport do publicznego magazynu. Adres:
  `gh api repos/mateuszhadrian/delung-web/actions/jobs/<job_id>/logs | grep "Open the report at"`
  (`job_id` z `gh run view <run_id> --json jobs`). W HTML-u raportu siedzi
  `window.__LIGHTHOUSE_JSON__` — wystarczy wyciągnąć z niego
  `categories.performance.score`, `audits[...]` i `resource-summary`.
  Tak powstały liczby, na których stoją dzisiejsze progi.
- `pnpm exec playwright test <spec> --project=<profil> --grep "<fraza>"` —
  celowany przebieg zamiast pełnych 6 profili przy iteracji.

## CZEGO NIE OTWIERAMY NA NOWO

Lenis i jakiekolwiek wygładzanie scrolla (D-Q1) · GSAP · ciemny motyw ·
toasty · ambient · breakpoint inny niż 1024 px · progi 760/861 · allowlista
axe · deep-link kategorii `/oferta/#<slug>` jako kanoniczny (D-P1) ·
antyscraping D-CH5 · decyzje D1–D8 z analizy wejściowej.

Jeśli prompt refaktoru dotyka któregoś z tych punktów — **zatrzymaj się
i zapytaj**, zamiast zakładać, że to nieaktualne ustalenie.

## DEFINITION OF DONE

`docs/analiza-refactor.md` + wpis w `docs/README.md`; zielone lokalnie
`format:check`, `lint`, `typecheck`, `test:unit`, `test:e2e` (6 profili),
`build` + `test:visual`; **zero regeneracji baseline'ów** (a jeśli
którykolwiek się ruszył — diff pokazany obrazkiem i świadoma zgoda
Mateusza); zero nowych wpisów w allowliście axe; bajty nie wyższe niż
liczby z sekcji „stan"; PR-y zielone na `quality` + `e2e` + `lighthouse`;
po merge'u `prod-smoke` zielony; `CLAUDE.md` i `docs/README.md`
zaktualizowane.

**Zacznij od lektury i `git pull`, a potem poproś mnie o prompt refaktoru —
czekam na to pytanie, zanim zobaczę jakąkolwiek propozycję zakresu.**
