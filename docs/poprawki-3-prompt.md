# Prompt startowy: runda poprawek nr 3 (po rundzie 2, przed Etapem 7)

> Do wklejenia w ŚWIEŻEJ sesji. Zawiera wszystko, czego nowa sesja
> potrzebuje, żeby pracować bez odtwarzania wiedzy z poprzednich rozmów.

---

Pracujemy nad delung.pl. **Runda poprawek nr 3 — jeden poważny bug
zgłoszony przez Mateusza + zacieśnienie budżetów LHCI.** Świeża sesja:
nie masz kontekstu z poprzednich rozmów, cała wiedza jest w repo.

Zacznij od `git checkout main && git pull && git status` (drzewo powinno
być czyste), potem wykonaj lekturę niżej W CAŁOŚCI, zanim cokolwiek
zaproponujesz.

## OBOWIĄZKOWA LEKTURA (w tej kolejności)

1. `CLAUDE.md` — zasady twarde, stan projektu (Etapy 0–6 + dwie rundy
   poprawek), mapa projektu, komendy.
2. `docs/README.md` — indeks statusów dokumentacji.
3. `.claude/rules/` — WSZYSTKIE pliki: `testing.md`, `sections.md`,
   `scroll.md`, `cms-realizacje.md`, `capture-scripts.md`.
4. `docs/analiza-poprawki-2.md` — **wzorzec dokumentu dla tej rundy**
   (poprzednia runda: lista zgłoszeń → stan zastany z pomiaru → decyzje
   D-Q1…D-Q6 → implementacja → testy → rachunek baseline'ów → podział na
   PR-y → ryzyka). Przeczytaj też sekcje o pułapkach pomiarowych — one
   kosztowały najwięcej czasu.
5. Analizy widoków, których dotknie poprawka — TYLKO te potrzebne, po
   ustaleniu zakresu z Mateuszem: `analiza-chrome-globalny.md` (navbar,
   menu, stopka, antyscraping D-CH5), `analiza-strona-glowna.md`,
   `analiza-oferta-kategorie.md`, `analiza-realizacje.md`,
   `analiza-proces-onas-polityka.md`, `analiza-kontakt.md`,
   `analiza-etap-6.md` (ikony, JSON-LD, budżety LHCI),
   `analiza-poprawki-wizualne.md` (runda 1).

Decyzje D1–D8 z `docs/delung-web-entrance-analysis.md` są ZAPADŁE — nie
otwieraj ich na nowo.

## STAN, KTÓREGO NIE MUSISZ ODKRYWAĆ

- Astro 6 static (bez SSR), PL-only, breakpoint **1024 px**, hosting
  Cloudflare Pages, `main` = produkcja (chroniony; required checks:
  `quality`, `e2e`, `lighthouse`; po merge'u leci `prod-smoke.yml`).
- **Etapy 0–6 zamknięte. Runda poprawek 1 (PR #20–#22) i runda 2
  (PR #29–#33) zamknięte.** Wszystkie 8 widoków gotowych, formularz
  działa (Resend + Turnstile + KV), CMS Sveltia działa, SEO i pomiar
  wdrożone.
- **Scroll w całym serwisie jest NATYWNY** — Lenis wyszedł z projektu
  w rundzie 2 (D-Q1). Powód jest ważny i zapisany w `.claude/rules/scroll.md`:
  koszt nie leżał w bibliotece, tylko w spotkaniu JS-owego scrolla
  z warstwą drogą do przemalowania (duże zdjęcie przycinane maską
  w kształcie liter w hero). **Wróci jakikolwiek wygładzacz — wróci
  klatkowanie w Safari.** Postęp `--p` navbara jest wygładzany własną
  pętlą rAF (to rekompensata, nie ozdoba).
- Bez GSAP, bez ciemnego motywu, bez toastów. Allowlista axe **PUSTA**
  i taka zostaje.
- Budżety LHCI (`lighthouserc.cjs` / `lighthouserc.desktop.cjs`) po
  Etapie 6: mobile perf 0,80 / LCP 5200 / TBT 150 / CLS 0,02 /
  script **30 000 B** / total **900 000 B**; desktop perf 0,9 / LCP 1800 /
  TBT 200 / CLS 0,01 / script 30 000 B / total 1 650 000 B.
  Zmierzone w CI po PR #28: mobile perf 0,89 / LCP 3777 ms / TBT 6 ms /
  CLS 0,0117 / script 19 053 B / total 816 496 B; desktop perf 0,94 /
  LCP 1586 ms / TBT 66 ms / CLS 0,0042 / script 19 053 B / total
  1 519 558 B. **Po wyjściu Lenisa skryptów ubyło ~5,3 kB gz** — nowej
  liczby NIE zgaduj, weź ją z zielonego przebiegu `lighthouse` na `main`.
- **Runner GitHuba bywa wolny** — ten sam kod potrafił dać LCP 3918 ms
  albo 4890 ms. Czerwony `lighthouse` na LCP przy niezmienionych bajtach
  = najpierw hipoteza szumu (re-run jobu), a NIE ruszanie progów.

## TRYB PRACY

1. **Najpierw zapytaj Mateusza o opis buga.** Nie zgaduj — on go widział,
   Ty nie. Dopytaj o wszystko, czego nie da się wywnioskować z repo:
   - na jakim urządzeniu i w jakiej przeglądarce (wersja!), po której
     stronie progu 1024 px, jaka wysokość okna, jeśli to desktop,
   - jak dokładnie odtworzyć (od wejścia na stronę, krok po kroku),
   - czy to błąd, czy zmiana designu (jeśli kod rozjechał się
     z eksportem w `docs/design/` — to błąd; jeśli świadomie odchodzimy
     od eksportu — to KOREKTA wcześniejszej decyzji),
   - co dokładnie jest nie tak (za duże / ucięte / nachodzi / nieklikalne
     / zły kolor) — od tego zależy, czy zmiana ruszy geometrię, a więc
     i baseline'y.

   Czego da się dowiedzieć z kodu, designów w `docs/design/` albo analiz —
   **sprawdź sam, nie pytaj**.

2. **Mierz, nie zgaduj.** To jest najważniejsza lekcja rundy 2. Zanim
   zaproponujesz przyczynę, potwierdź ją pomiarem: sondą w przeglądarce
   (`elementFromPoint`, `getBoundingClientRect`, `getComputedStyle`),
   przemiataniem rozmiarów okna przez Playwright, wariantami A/B
   przełączanymi hashem w lokalnym buildzie. W rundzie 2 dwie „oczywiste"
   hipotezy okazały się błędne, a rozstrzygnął dopiero pomiar na
   fizycznym urządzeniu.

3. **Docs-first**: napisz `docs/analiza-poprawki-3.md` (po polsku, wzorzec
   `analiza-poprawki-2.md`, numeracja decyzji **D-T1, D-T2, …**): lista
   zgłoszeń → stan zastany Z POMIARU → decyzje z konsekwencjami →
   implementacja (pliki) → testy → rachunek baseline'ów → podział na PR-y
   → ryzyka i co wymaga testu na fizycznym urządzeniu. Dopisz plik do
   `docs/README.md`. **Przedstaw do akceptacji, zanim ruszysz kod.**
   Jeśli poprawka koryguje wcześniejszą decyzję (D-CH…, D-SG…, D-OK…,
   D-R…, D-K…, D-P…, D-E…, D-Q…), opisz ją jako **KOREKTA D-…**
   i zdubluj dopiskiem w odpowiedniej analizie widoku.

4. **Implementacja → testy → PR.** Jeden PR = jedna spójna grupa zmian.

5. **Po zamknięciu buga: zacieśnienie budżetów LHCI** (osobna decyzja
   Mateusza, osobny commit — tak jak w Etapie 6). Weź liczby z zielonego
   przebiegu na `main`, zostaw rozsądny zapas i uzasadnij każdą wartość
   w komentarzu przy progu. Pamiętaj, że `total` ma najciaśniejszy zapas
   (~9 % na mobile), więc nowe zdjęcie albo font potrafią go zjeść.

6. Po merge'u zaktualizuj „Stan projektu" w `CLAUDE.md` (data + numery
   PR-ów) i statusy w `docs/README.md`.

## ZASADY TWARDE

- **NIGDY nie wykonuj `git commit` ani `git push`** — commituje wyłącznie
  Mateusz (blokada też w `.claude/settings.json`). Zostawiasz zmiany
  w working tree i podajesz gotowe komendy.
- Commity: conventional, po angielsku, temat ZAWSZE **małą literą** po
  dwukropku. Commitlint wymusza max 100 znaków na KAŻDĄ linię body.
  SPRAWDZONY SPOSÓB: zapisz komunikat do pliku w katalogu gita
  (np. `.git/msg-a`), zweryfikuj `pnpm exec commitlint < .git/msg-a`,
  a Mateusza poproś o `git add -A && git commit -F .git/msg-a`. Gdy jeden
  PR ma mieć kilka commitów, a zmiany siedzą w jednym pliku — przygotuj
  łatkę (`git diff --no-index` + `git apply`), bo interaktywne
  `git add -p` jest niedostępne.
- Komendy dla Mateusza podawaj **JEDNOLINIOWE**. PR-y i merge klika w UI
  GitHuba — opisuj klikami.
- **Kolejność przy każdym PR-ze**: `git checkout main && git pull` →
  `git checkout -b <branch>` → commit → push → PR → merge → **od razu**
  `git checkout main && git pull && git branch -d <branch>`. Sprzątanie
  ZARAZ po merge'u; inaczej następny branch rodzi się z nieaktualnego
  `main` i GitHub żąda rebase'u (zdarzyło się dwa razy w rundzie 2).
  Jeśli w drzewie coś leży — `git stash push` przed, `git stash pop` po.
- **Baseline'y wizualne** (`tests/visual/__screenshots__`): NIE aktualizuj
  bez pokazania diffu OBRAZKIEM i zgody Mateusza. Święta kolejność: kod →
  workflow „Update linux visual baselines" z brancha PR-a (Actions → Run
  workflow → wybierz branch) → `git pull` → lokalnie
  `pnpm test:visual:update` (albo celowany przebieg z `--update-snapshots`
  dla konkretnych profili) → commit darwin NA KOŃCU (bot-push nie wyzwala
  CI). Komplety darwin i linux mogą różnić się LICZBĄ plików.
- Nie edytuj `src/content/realizacje/*.json` (pisze je Sveltia CMS). Nie
  dotykaj `dist/` ani `.astro/`. Sekretów (`.env*`, klucze Resend/
  Turnstile/R2/Cloudflare) nie czytaj i nie loguj.
- Zero nowych wpisów w allowliście axe. Schemat CMS — w TRZECH miejscach
  naraz (`.claude/rules/cms-realizacje.md`).
- **Antyscraping D-CH5**: telefon i e-mail NIE mogą istnieć w statycznym
  źródle. Składa je JS z `src/lib/contact-details.ts`; `src/lib/jsonld.ts`
  celowo ich NIE zna. Test `tests/e2e/contact.spec.ts` grepuje CAŁY
  katalog `dist`.

## TESTY (kontrakt: `.claude/rules/testing.md`)

- Warstwy: `pnpm test:unit` / `pnpm test:e2e` (6 profili) /
  `pnpm build && pnpm test:visual` (WYMAGA preview na 4399 — strażnik
  `assertPreview`, nie obchodź go).
- Przed oddaniem PR-a komplet: `format:check`, `lint`, `typecheck`,
  `test:unit`, `test:e2e`, `build` + `test:visual`.
- **Każda poprawka dostaje test, który złapałby ją przy regresji** —
  i sprawdź, że go łapie: cofnij poprawkę (`git stash` albo `git checkout
HEAD -- <plik>` z kopią zapasową), zobacz czerwony test, przywróć.
  W rundzie 2 robiłem to przy każdej poprawce i dwa razy okazało się, że
  pierwsza wersja testu niczego nie pilnowała.
- Profile: chromium-1920 (1920×1080), chromium-1366 (1366×768),
  firefox-desktop (1920×1080), webkit-iphone-se (320×568),
  webkit-iphone-14 (390×844), chromium-pixel-5 (393×727, DPR 2,75).

## PUŁAPKI, KTÓRE JUŻ RAZ KOSZTOWAŁY CZAS

**Pomiar geometrii:**

- `.re-tx` w scenie realizacji ma **przejście `transform 0.55s`** —
  odczyt `getBoundingClientRect()` tuż po ustawieniu `transform: none`
  pokazuje STARĄ wartość i daje fałszywe kolizje rzędu 13 px. Mierz
  z wyłączonymi przejściami (`*{transition:none!important}`).
- Elementy ułożone jedno na drugim (`position: absolute; inset: 0`)
  z `opacity: 0` **dalej łapią kliknięcia** — sprawdzaj
  `document.elementFromPoint`, nie samą widoczność. Tak wyszedł bug D-Q6.
- Zrzut ELEMENTU łapie też to, co się na nim maluje (np. przyklejony
  pasek) — sticky nad listą wchodzi w kadr `toHaveScreenshot` elementu.
- Playwright liczy różnice **percepcyjnie** (domyślny `threshold: 0.2`),
  więc „214 px różnicy" w logu ≠ 214 px w porównaniu bajt po bajcie.

**Wartości liczbowe wpisywane z JS:**

- **Długość wpisana z JS nigdy nie jest bit w bit tym, co przeglądarka
  wyliczyła sama.** WebKit snapuje `height: 100svh` do pełnych pikseli
  (568), ale `calc(100svh - 86px)` liczy w 1/64 px (481,984375). Dwie
  wersje przypinania wysokości hero wywróciły przez to testy wizualne
  (`index-kontakt` na webkit-iphone-se, potem `index-o-nas` na
  chromium-pixel-5 — TYLKO w CI na Linuksie). Wniosek: wpisuj z JS tylko
  tam, gdzie naprawdę trzeba, nigdy „profilaktycznie”.
- Współczynniki `cqh`/`vh` dobieraj tak, żeby przy KAŻDYM rozmiarze
  referencyjnym przegrywały w `min()` z wartością dotychczasową — inaczej
  ruszysz baseline'y. Sprawdź to liczbowo dla 1920×1080, 1366×768 i
  najmniejszego kontenera, jaki występuje.

**Diagnostyka:**

- Emulacja Playwrighta ≠ prawdziwa przeglądarka. Problem wydajnościowy
  albo zależny od paska przeglądarki mierz **na fizycznym urządzeniu**:
  zbuduj lokalnie warianty przełączane hashem (`#dbg-…` → klasa na
  `<html>` z inline'owego skryptu + reguły CSS/JS pod tą klasą), postaw
  `pnpm preview --port 4399 --host 0.0.0.0` i podaj Mateuszowi adres
  w sieci lokalnej (jego IP: `ipconfig getifaddr en0`). Zbieraj protokół
  „wariant → płynnie/klatkuje", nie wrażenia. **Rusztowanie usuń przed
  PR-em.**
- Czerwony CI przy zielonym lokalnie: ściągnij artefakty
  (`gh run download <id> -D <katalog>`) i porównaj zrzut `actual`
  z baseline'em w repo — `playwright-report/data/*.png` zawiera
  expected/actual/diff.
- Zanim uznasz coś za flake, powtórz test kilka razy na czystym `main`.
  Dwa identyczne przebiegi z identycznymi liczbami to NIE flake.
- `git stash` nie ma czego odłożyć, gdy zmiany są już w commicie —
  do porównania A/B używaj `git checkout <ref> -- <pliki>` z kopią
  zapasową, i pamiętaj o przebudowie (`pnpm build`) między pomiarami.

## CZEGO EMULACJA NIE ŁAPIE (proś Mateusza o test na urządzeniu)

Limit warstwy GPU Androida (karuzele, bottom sheety), iOS Low Power Mode
(wideo na tap w detalu realizacji), zwijany pasek przeglądarki (metryki
viewportu, hero), zimny cache + realne łącze, dotyk fizyczny (snap
karuzel, swipe-down sheetów), wydajność Safari na macOS. Przy zmianach
w tych obszarach powiedz wprost, na co ma patrzeć.

## DEFINITION OF DONE RUNDY

`docs/analiza-poprawki-3.md` + wpis w `docs/README.md`; zielone lokalnie
`format:check`, `lint`, `typecheck`, `test:unit`, `test:e2e` (6 profili),
`build` + `test:visual`; zero nowych wpisów w allowliście axe;
baseline'y zaktualizowane TYLKO tam, gdzie zmiana wyglądu była zamierzona
(oba komplety w jednym PR); PR-y zielone na `quality` + `e2e` +
`lighthouse`; po merge'u `prod-smoke` zielony; budżety LHCI zacieśnione
osobnym commitem po decyzji Mateusza; `CLAUDE.md` i `docs/README.md`
zaktualizowane; poprawka potwierdzona przez Mateusza na fizycznym
urządzeniu tam, gdzie emulacja nie wystarcza.

**Zacznij od lektury i `git pull`, a potem zapytaj mnie, na czym polega
bug — czekam na to pytanie, zanim zobaczę jakikolwiek kod.**
