# Prompt startowy: runda poprawek nr 4 (przed Etapem 7)

> Do wklejenia w **świeżej sesji**. Ta sesja NIE ma z góry zdefiniowanego
> zakresu — jej pierwszym zadaniem jest wyciągnąć listę poprawek od Mateusza,
> a dopiero potem cokolwiek robić.

Serwis `delung.pl` jest skończony w zakresie Etapów 0–6 i trzech rund
poprawek. Przed Etapem 7 (umowa → przekazanie klientowi) Mateusz chce
wprowadzić jeszcze kilka zmian. Twoje zadanie: **zebrać je, zrozumieć,
zmierzyć i wykonać w najmniejszej liczbie ruchów.**

---

## 1. PIERWSZA RZECZ, KTÓRĄ MASZ ZROBIĆ

**Nie proponuj żadnych poprawek z siebie i nie otwieraj żadnego pliku
z kodem, dopóki nie dostaniesz listy.** Zacznij od przeczytania lektury
obowiązkowej (§3), a potem zapytaj Mateusza o zakres.

Dla KAŻDEJ zgłoszonej pozycji dopytaj — najlepiej pytaniami z gotowymi
wariantami odpowiedzi, nie ścianą tekstu:

| Co ustalić | Dlaczego to ma znaczenie |
| --- | --- |
| **Widok i miejsce** (`/`, `/oferta/`, detal realizacji…) | każdy widok ma własną analizę w `docs/`, którą trzeba przeczytać PRZED dotknięciem go |
| **Próg**: mobile (<1024) czy desktop (≥1024) czy oba | pół projektu to duplikaty per-breakpoint; poprawka „na oko" psuje drugą stronę |
| **Środowisko**: przeglądarka, system, rozmiar okna | rundy 2 i 3 pokazały, że część usterek żyje TYLKO w Firefoksie albo TYLKO przy niskim oknie |
| **Objaw vs oczekiwanie** — co widzi, a co ma widzieć | „popraw to" bez stanu docelowego kończy się dwiema turami |
| **Czy to defekt, czy zmiana projektowa** | defekt naprawiasz; zmianę projektową (inny układ, inna treść, inne zachowanie) PROJEKTUJESZ i przedstawiasz wariantami |
| **Materiał dowodowy** — zrzut, nagranie, adres | zrzut z telefonu bywa jedynym sposobem zobaczenia usterki, której emulacja nie łapie |

Gdy lista jest kompletna: **uszereguj ją i pokaż Mateuszowi plan** — co
wchodzi do którego PR-a, co wymaga decyzji projektowej, co ruszy baseline'y,
co da się zrobić przy okazji. Dopiero po jego akceptacji zaczynaj kod.

Jeśli któraś pozycja jest w istocie zmianą projektową (nie „coś jest
zepsute", tylko „chcę inaczej") — **zbuduj i zmierz warianty, przedstaw
oba/trzy z kosztem każdego i pozwól Mateuszowi wybrać.** Tak powstały
D-Q5, D-T3 i D-U1; to jest sprawdzony wzorzec tego projektu, nie
uprzejmość.

---

## 2. TRYB PRACY

- **Najpierw pomiar, potem naprawa.** Każda runda poprawek w tym projekcie
  zaczynała się od sondy Playwrighta liczącej geometrię, a nie od czytania
  CSS-a. Kilka razy pomiar obalił hipotezę, która wyglądała na oczywistą
  (patrz §7). Sondy trzymaj POZA repo (katalog scratchpad sesji).
- **Docs-first przy większych zmianach**: mini-analiza `docs/analiza-*.md`
  po polsku (przyczyna z pomiaru → decyzje → implementacja → testy →
  baseline'y), wpis w `docs/README.md`, dopisek w `CLAUDE.md`. Przy drobnej
  poprawce wystarczy sekcja w istniejącej analizie widoku.
- **Jeden PR = jedna spójna porcja.** Nie sklejaj poprawek z różnych
  widoków, jeśli mogą iść osobno — ale nie mnóż PR-ów tam, gdzie zmiany
  dzielą jeden plik i jeden pomiar.
- **Zmiany progów/budżetów zawsze osobnym commitem** i tylko decyzją
  Mateusza (LHCI, allowlista axe, baseline'y).
- Raportuj liczbami, nie wrażeniami: „szczelina 88 px → 0 px przy 1440×900",
  nie „wygląda lepiej".

---

## 3. OBOWIĄZKOWA LEKTURA (w tej kolejności)

1. `CLAUDE.md` — zasady twarde i pełny stan projektu.
2. `docs/README.md` — indeks statusów wszystkich dokumentów.
3. `.claude/rules/` — `testing.md`, `sections.md`, `scroll.md`,
   `cms-realizacje.md`.
4. **Analiza widoku, którego dotyczy poprawka** (czytaj DOPIERO gdy wiesz,
   o który widok chodzi):
   - strona główna → `analiza-strona-glowna.md` + `analiza-poprawki-2.md`
     (D-Q5) + `analiza-poprawki-3.md` (D-T3/D-T4) +
     `analiza-parallax-realizacje.md` (D-U1, D-U5)
   - `/oferta/`, `/kategorie/` → `analiza-oferta-kategorie.md` +
     `analiza-poprawki-wizualne.md`
   - `/realizacje/` i detal → `analiza-realizacje.md` +
     `analiza-remont-panelu.md`
   - `/proces-wspolpracy/`, `/o-nas/`, polityka →
     `analiza-proces-onas-polityka.md`
   - `/kontakt/` i formularz → `analiza-kontakt.md`
   - SEO, ikony, dane strukturalne, budżety → `analiza-etap-6.md`
   - sprzątanie kodu → `analiza-refactor.md` (§2 = strefy no-go, §8 i §14 =
     co ODRZUCONO i dlaczego)
5. Designy-referencje: `docs/design/*.html` (breakpoint 1024, wzorce
   390/1440). **Dewiacje od designu są udokumentowane w analizach** — zanim
   uznasz coś za błąd, sprawdź, czy nie jest świadomą decyzją.

Nie otwieraj na nowo decyzji z `delung-web-entrance-analysis.md`.

---

## 4. STAN, KTÓREGO NIE MUSISZ ODKRYWAĆ (na 2026-08-07)

- Etapy 0–6 wykonane, trzy rundy poprawek + runda „U" (parallax realizacji)
  za nami. Produkcja stoi na `main`, deploy automatyczny z Cloudflare Pages.
- **Bez GSAP, bez Lenisa** — ruch to własne pętle rAF za bramką
  `html.js-motion`, scroll natywny wszędzie (D-Q1).
- Breakpoint **1024 px** w całym serwisie; stałe `*_DESKTOP_MIN_PX`
  i `@media` trzymane w parze (trzy widoki mają na to realny test).
- Treść realizacji pisze klient przez `/admin` (Sveltia) — 9 wpisów.
  **Testy są odporne na treść**: pusta i krótka kolekcja niczego nie
  wywraca, opisy dowolnej długości kończą się wielokropkiem (D-U5, D-U6),
  nazwy plików są zawsze ASCII (`slug: {encoding: ascii, clean_accents}`).
- Testy wizualne stoją na **zamrożonym fixture** (`pnpm build:visual`),
  niezależnym od treści produkcyjnej.
- `ci.yml` i `prod-smoke.yml` mają `workflow_dispatch` — bieg da się kopnąć
  ręcznie z zakładki Actions.
- **Odłożone świadomie** (kandydaci, jeśli Mateusz zechce): zakresy D/E/F
  refaktoru (`MotionGate.astro`, wspólny moduł ruchu, wydzielenie sheeta
  z `Navbar.astro`) — niosą ryzyko wizualne; `pattern` na polu „Slug"
  w CMS; wizytówka Google (należy do Etapu 7).

---

## 5. ZASADY TWARDE

1. **NIGDY `git commit` ani `git push`** — commituje wyłącznie Mateusz.
   Zostawiasz zmiany w drzewie i podajesz gotowe komendy. PR-y i merge
   klika w UI GitHuba.
2. **Nie edytuj `src/content/realizacje/*.json`** — pisze je Sveltia.
   Wyjątek wymaga wyraźnej zgody.
3. **Baseline'ów wizualnych nie regenerujesz bez pokazania diffu i zgody.**
   Kolejność NA ZAWSZE: kod → workflow `update-visual-baselines.yml`
   (linux, bot-commit na branch PR-a) → `pnpm test:visual:update` (darwin)
   na końcu. Bot-push nie wyzwala CI.
4. Sekretów nie czytasz i nie logujesz; `dist/` i `.astro/` nie dotykasz.
5. Schemat CMS zmieniasz w TRZECH miejscach naraz (`content.schema.ts` /
   `public/admin/config.yml` / komponenty work).
6. Commity: conventional, po angielsku, **temat małą literą** po dwukropku,
   max 100 znaków na KAŻDĄ linię. Sprawdzony sposób: zapisz komunikat do
   `.git/msg-x`, zweryfikuj `pnpm exec commitlint < .git/msg-x`, poproś
   o `git add <pliki> && git commit -F .git/msg-x`.
7. **Komendy dla Mateusza pisz w jednej linii.** Łamanie `\` przy wklejaniu
   do terminala potrafi zostawić spację po ukośniku i rozsypać polecenie
   (zdarzyło się przy `mv`).

---

## 6. TESTY (kontrakt: `.claude/rules/testing.md`)

| Zmiana | Co uruchamiasz |
| --- | --- |
| `src/scripts/**`, sekcje, overlaye, formularz | `pnpm build` **potem** `pnpm test:e2e` |
| każda zmiana wyglądu | `pnpm build:visual` potem `pnpm test:visual` |
| `content.schema.ts`, `i18n`, `lib/**` | `pnpm test:unit` |
| przed PR-em | `format:check`, `lint`, `typecheck`, `test:unit`, `build` |

- **e2e buduj `pnpm build`, NIE `build:visual`** — fixture podłożony pod
  testy funkcjonalne daje fałszywe czerwone (pułapka zweryfikowana).
- Testy wizualne WYŁĄCZNIE na preview (port 4399, strażnik `assertPreview`).
- Allowlista axe jest PUSTA i ma taka zostać.
- Nowy niezmiennik lepiej dopisać jako test e2e mierzący układ niż liczyć na
  pixel-diff — patrz pułapka o pustych kadrach w §7.

---

## 7. PUŁAPKI, KTÓRE JUŻ KOSZTOWAŁY CZAS

**Pomiarowe**

- **Przejście CSS fałszuje odczyt geometrii.** Karty sceny realizacji mają
  `transition` 0,55 s; odczyt tuż po ustawieniu `transform: none` pokazuje
  starą wartość. Pomiar robi się z wyłączonymi przejściami.
- **Element z `opacity: 0` dalej łapie kliknięcia** (D-Q6).
- **`document.fonts.ready` jest sygnałem fałszywym** przy preloadowanych
  fontach — rozstrzyga się, zanim pobranie wystartuje. Rozstrzyga jawne
  `document.fonts.load` (D-T1).
- **Długość wpisana z JS nigdy nie jest bit w bit tym, co wyliczyła
  przeglądarka** — przypinanie „profilaktyczne" ruszało rasteryzację
  o ułamek piksela i wywracało testy wizualne (D-Q2).
- **Przeniesienie kontenera zapytań zmienia rampy z reaktywnych na
  proaktywne** i potrafi odwrócić kolejność kurczenia (D-T3).
- **Gecko liczy wysokość wiersza inaczej niż Blink** — kryteria oparte na
  reszcie z dzielenia przez interlinię są fałszywie czerwone.
- **„Tylko w jednej przeglądarce" ≠ „przez tę przeglądarkę"** — raz winny
  był proces Chrome'a po aktualizacji, a nie kod. Najpierw czysty profil
  TEJ SAMEJ przeglądarki.
- **`page.hover()` sam przewija stronę do elementu** — przy mierzeniu
  efektów zależnych od scrolla użyj `mouse.move` na współrzędne.

**Środowiskowe**

- **Preflight Tailwinda ma `img { max-width: 100% }`** — bez `max-width:
  none` „poszerzenie" obrazu robi się tylko w pionie (D-U1).
- **Na preview endpointy `/cdn-cgi/` nie istnieją**, więc kafle realizacji
  są PUSTYMI ramkami. Pixel-diff nie widzi tam ani kadru, ani odsłoniętego
  tła — regresji w tym obszarze pilnują testy e2e mierzące układ. Żeby
  zobaczyć prawdziwe zdjęcia lokalnie, przechwyć `**/cdn-cgi/image/**`
  w Playwrighcie i podstaw oryginał z `media.delung.pl`.
- **CSS nie policzy liczby linii z wysokości** (w `calc()` nie wolno
  dzielić długości przez długość) — stąd limit linii liczony w JS (D-U5).

**Procesowe**

- **Ruleset ma `strict_required_status_checks_policy`** — każdy commit na
  `main` (także zapis klienta w panelu!) unieważnia „up to date" otwartego
  PR-a i wymusza kolejny cykl checków. W trakcie otwartego PR-a nie ruszaj
  treści w panelu.
- **GitHub Actions bywa niedostępny godzinami** (6 h w dniu 2026-08-06),
  a odrzuconych webhooków nie odtwarza: push i otwarcie PR-a NIE tworzą
  wtedy biegu. Ratunek: `workflow_dispatch` (jest w obu workflow) albo
  close/reopen PR-a.
- **macOS pokazuje pliki o nazwach NFD dwa razy** (śledzony + nieśledzony).
  **Nigdy `git add .` ani `git add -A`** w tym repo — dodawaj ścieżki
  jawnie. Konfiguracja panelu wymusza już nazwy ASCII, więc nowe wpisy są
  bezpieczne.

---

## 8. CZEGO EMULACJA NIE ŁAPIE

Limit warstwy GPU Androida (karuzele, sheety, duże zdjęcia w scenach);
iOS Low Power Mode (wideo na tap); zwijany toolbar Safari (metryki
viewportu); zimny cache i realne łącze; dotyk fizyczny (snap karuzel,
swipe-down sheetów, płynność scrolla). Przy zmianach w tych obszarach
poproś Mateusza o test na telefonie i **wskaż dokładnie, na co ma patrzeć**.

---

## 9. DEFINITION OF DONE RUNDY

- Każda zgłoszona pozycja: albo wykonana, albo świadomie odłożona z powodem
  zapisanym w dokumencie.
- Liczby przed/po dla wszystkiego, co dało się zmierzyć.
- Pełna bramka zielona; e2e puszczone na `pnpm build`.
- Baseline'y: OBA komplety (linux + darwin) w tym samym PR, po zgodzie na
  diff. Jeśli się nie ruszyły — napisz to wprost i wyjaśnij dlaczego.
- Mini-analiza w `docs/` (albo sekcja w istniejącej analizie widoku) +
  wpis w `docs/README.md` + dopisek w `CLAUDE.md`.
- Komunikaty commitów przygotowane i zweryfikowane commitlintem, komendy
  gotowe do wklejenia (jedna linia każda).
- Na koniec: krótka lista tego, co Mateusz ma sprawdzić na fizycznym
  telefonie, zanim uzna rundę za zamkniętą.
