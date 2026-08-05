# Prompt startowy — sesja remontowa panelu treści

> Do wklejenia w ŚWIEŻEJ sesji. Powstał 2026-08-05 na końcu sesji
> dokumentacyjnej (`instrukcja-cms.md` / `instrukcja-panelu-klient.md`), po
> pierwszych realnych wpisach klienta przez panel. Zawiera **fakty
> zweryfikowane maszynowo** — nie sprawdzaj ich od nowa, chyba że coś nie
> zagra.

---

Pracujemy nad delung.pl. Zadanie: **remont ścieżki wgrywania treści przez
panel `/admin`** — schemat, media, walidacja i to, co klient widzi na ekranie.
Świeża sesja, cała wiedza jest w repo. Zacznij od
`git checkout main && git pull && git status` (drzewo ma być czyste).

## OBOWIĄZKOWA LEKTURA (w tej kolejności)

1. `CLAUDE.md` — zasady twarde i stan projektu (Etapy 0–6 zamknięte, przed
   Etapem 7 = umowa i przekazanie).
2. `public/admin/config.yml` — definicja pól panelu, **źródło etykiet**.
3. `src/content.schema.ts` — schemat Zod: co wymagane, co opcjonalne.
4. `.claude/rules/cms-realizacje.md` — kontrakt CMS/media/R2, w tym reguła
   **zmiany schematu w TRZECH miejscach naraz**.
5. `.claude/rules/testing.md` — kontrakt testów, w tym **zamrożona treść dla
   testów wizualnych** (`tests/fixtures/realizacje`, `pnpm build:visual`).
6. `docs/instrukcja-cms.md` — instrukcja operatorska panelu; **każda zmiana
   schematu lub zachowania panelu musi się w niej znaleźć**, razem z wersją
   kliencką `docs/instrukcja-panelu-klient.md`.
7. `docs/delung-web-creation-process.md` — Część C (flow mediów klienta) i
   Etap 7 (przekazanie).
8. `src/components/sections/work/*` — konsumenci schematu (kafel, detal,
   overlay, dane).

## ZANIM COKOLWIEK ZAPROJEKTUJESZ

**Poproś Mateusza o jego listę znalezisk.** Przeklikał panel realnie i zebrał
uwagi, których w repo nie ma — to one wyznaczają pełny zakres remontu. Zakres
opisany niżej jest **znany, ale niekompletny**. Nie zaczynaj implementacji,
zanim nie zestawisz obu list i nie ustalicie kolejności.

Zapytaj też o rzeczy, których nie da się rozstrzygnąć z repo — co najmniej:

- czy migrację istniejących wpisów robimy skryptem (wymaga zgody na tknięcie
  `src/content/realizacje/*.json`), czy ręcznie przez panel,
- czy przy okazji podbijamy Sveltię (dziś **0.170.0**, aktualna ~0.180.0 —
  patrz „znany błąd panelu" niżej),
- czy pole „Długość wideo" ma zostać opisowe, czy stać się źródłem czasu
  klatki (zadanie A).

## ZAKRES ZNANY

### A. Miniatura wideo generowana automatycznie

Dziś plakat klipu to **osobne pole „Zdjęcie"** w tej samej pozycji galerii
(zasada pary). Docelowo ma to być **klatka z samego filmu, ze środka**.

**Fakt zweryfikowany 2026-08-05** — Cloudflare **Media Transformations** są
włączone na strefie `delung.pl` i działają na plikach z R2:

```
GET https://delung.pl/cdn-cgi/media/mode=frame,time=1s,width=960/\
https://media.delung.pl/realizacje/kuchnia-zielona-vid.mp4
→ 200, 27 714 B, image/jpeg
```

Czyli: bez Cloudflare Stream, bez ffmpeg, bez zmian w infrastrukturze — jeden
URL, dokładnie na zasadzie `imgAt()` (`src/lib/img.ts` = JEDYNE miejsce wiedzy
o URL-ach mediów; klatki wideo powinny dostać tam siostrzaną funkcję).

Do rozstrzygnięcia w analizie:

- **Skąd „środek"** — `time=` przyjmuje sekundy, więc trzeba znać długość.
  Pole **„Długość wideo (np. 0:24 — opis przy znaczku play)"** już istnieje
  (`duration`, opcjonalne, dziś czysto opisowe). Jeśli ma sterować klatką,
  zdecyduj: wymagane czy nadal opcjonalne, i jaki fallback przy braku
  (np. `time=1s`).
- **Dev/preview**: `/cdn-cgi/media` nie istnieje lokalnie, tak samo jak
  `/cdn-cgi/image` (dziś `imgAt()` zwraca oryginał). Klatka wymaga własnego
  fallbacku — i **testy wizualne nie mogą zacząć zależeć od sieci**
  (wideo na zrzutach zawsze pod maską — `.claude/rules/testing.md`).
- **Czy pole „Zdjęcie" w pozycji z wideo zostaje** jako ręczne nadpisanie
  klatki, czy znika. To wiąże się bezpośrednio z zadaniem B — rozstrzygnijcie
  oba naraz, nie osobno.

### B. Koniec pola „Kafel (cover)" — kafel = pierwsza pozycja galerii

Panel ma przestać pytać o osobny kafel; okładką realizacji ma być **pierwsza
pozycja galerii**.

To zmiana schematu, czyli **TRZY miejsca naraz** (`content.schema.ts` /
`public/admin/config.yml` / `src/components/sections/work/*`) plus:

- **migracja treści** — dziś `cover` mają wszystkie wpisy: **5 produkcyjnych**
  (`src/content/realizacje/`) **i 5 fixture'owych**
  (`tests/fixtures/realizacje/` — zamrożony zestaw testów wizualnych,
  o którym łatwo zapomnieć),
- `tests/unit/cms-contract.test.ts` — kontrakt schematu i selecta,
- `docs/instrukcja-cms.md` §4 (tabela sterowa, pola 7–8) i wersja kliencka
  (krok 5 „Dodaj zdjęcie główne" znika albo się zmienia).

**PUŁAPKA, której nie wolno przeoczyć** — dziś kafel i galeria mają **osobne
pola kadru**, i to nie jest przypadek: kadry mają różne proporcje.

| Gdzie | Kształt kadru |
| --- | --- |
| kafel na liście, mobile | prawie kwadrat (`aspect-ratio: 1.034`) |
| kafel na liście, desktop | poziomy (`1.384`) |
| galeria detalu | **pionowy** (`330 / 412`) |

Jedno zdjęcie użyte w obu miejscach może wymagać **dwóch różnych wartości
`object-position`**. Po scaleniu pól zostanie jedna — zdecyduj świadomie
(np. `position` dla galerii + opcjonalny `coverPosition` na pierwszej pozycji)
i **sprawdź na realnych zdjęciach**, zanim uznasz temat za zamknięty.
Regresja tutaj jest cicha: nic nie pada, po prostu kafle są źle przycięte.

### C. Pierwsza pozycja galerii nie może być wideo

Skoro pierwsza pozycja jest okładką, nie może nią być klip.

Uwaga projektowa: **Sveltia nie wymusi takiej reguły** — `config.yml` nie ma
walidacji warunkowej. Zod (`.superRefine`) złapie to dopiero **w buildzie**,
czyli po zapisie z panelu, gdy klient już wyszedł. Zaprojektuj to tak, żeby:

- komunikat błędu wskazywał **pole i czynność** („pierwsza pozycja galerii nie
  może mieć filmu — przenieś go na dalszą pozycję"), nie ścieżkę Zoda,
- `docs/instrukcja-cms.md` §11 i wersja kliencka opisywały to jako znany
  przypadek,
- rozważyć, czy da się zmniejszyć szansę błędu układem pól w panelu.

### D. Plakat wideo pokazuje jednokolorowy ekran (do diagnozy)

Objaw zgłoszony przez Mateusza: w detalu realizacji zamiast plakatu widać
jednolite tło.

**Fakt zweryfikowany 2026-08-05 — to NIE jest problem CMS-a ani danych:**

```
<video src="…/kuchnia-zielona-vid.mp4"
       poster="/cdn-cgi/image/width=960,format=auto/…/kuchnia-biala1.png"
       preload="none" playsinline>

poster → 200, 24 667 B, image/avif        (ładuje się poprawnie)
```

Atrybut jest na miejscu, obraz istnieje i zwraca się w dobrym formacie.
**Szukaj w CSS/renderze** (`WorkDetail.astro` — `object-fit`, tło slajdu,
zachowanie `poster` przy `preload="none"` w konkretnej przeglądarce), nie
w schemacie ani w R2. Zapytaj Mateusza, na czym to widział (przeglądarka,
urządzenie, desktop czy mobile) — to zawęzi obszar.

Rozstrzygnij też, czy po wdrożeniu zadania A ten problem w ogóle zostaje —
klatka z `/cdn-cgi/media` może go wyprzeć.

## ZASADY TWARDE

- **NIGDY nie wykonuj `git commit` ani `git push`** — commituje wyłącznie
  Mateusz. Zostawiasz zmiany w drzewie roboczym i podajesz gotowe komendy,
  jednoliniowe. PR-y i merge klika w UI GitHuba.
- Commity: conventional, po angielsku, temat ZAWSZE małą literą po dwukropku,
  max 100 znaków na KAŻDĄ linię. Sprawdzony sposób: zapisz komunikat do pliku
  w katalogu gita (np. `.git/msg-a`), zweryfikuj
  `pnpm exec commitlint < .git/msg-a`, poproś o
  `git add <pliki> && git commit -F .git/msg-a`.
- **`src/content/realizacje/*.json` pisze Sveltia** — ręczna edycja zabroniona
  (hook-guard). Migracja schematu to wyjątek wymagający **wyraźnej zgody
  Mateusza**; `tests/fixtures/realizacje/` tej blokadzie nie podlega.
- **Baseline'ów wizualnych nie regenerujesz bez pokazania diffu i zgody.**
  Kolejność NA ZAWSZE: kod → workflow linux → commit darwin na końcu.
- Sekretów (`.env*`, klucze R2, tokeny) nie czytaj i nie wpisuj do dokumentów.
- Ruch bez GSAP, scroll natywny (`.claude/rules/scroll.md`), breakpoint 1024.

## KONTRAKT TESTÓW — RZECZ NOWA I ŁATWA DO PRZEOCZENIA

Od 2026-08-05 (PR #48) **testy wizualne stoją na zamrożonej treści**:

- `pnpm build:visual` przestawia kolekcję na `tests/fixtures/realizacje`
  (`REALIZACJE_DIR` w `src/content.config.ts`),
- `pnpm build && pnpm test:visual` **nie zadziała** — strażnik
  `assertVisualFixture` przerwie z instrukcją,
- fixture jest **niezależny od treści produkcyjnej** — nie synchronizuj go
  z `src/content/realizacje` „dla porządku"; zmieniasz go tylko wtedy, gdy
  zrzut ma świadomie pokazać inny UKŁAD (wtedy = nowe baseline'y w tym samym PR),
- powód: baseline to obraz, więc realizacja dodana przez klienta rozjeżdżała
  zrzuty siatki, szyny, liczników, sceny na `/` i detalu — i blokowała
  WSZYSTKIE PR-y (zdarzyło się realnie).

**Zadanie B tego dotyka wprost**: zmiana schematu = zmiana fixture'u = możliwa
regeneracja baseline'ów. Zaplanuj to od początku, nie na końcu.

Warstwy: `pnpm test:unit` (kontrakt CMS, sekundy), `pnpm test:e2e`,
`pnpm build:visual && pnpm test:visual`, `/release-check` przed wydaniem.
Media w R2: `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`
— **żaden workflow tego nie odpala**, to krok ręczny.

## ZNANY BŁĄD PANELU (kontekst, nie zadanie)

Sveltia bywa wyszarza przycisk wstawiania zasobu w trakcie sesji — objaw
pojawił się trzykrotnie, w różnych momentach (raz przy drugiej pozycji
galerii, raz przy pierwszej, bez związku z wideo). **Twarde odświeżenie
strony i przywrócenie sesji naprawia problem bez utraty pracy.** Diagnoza:
zepsuty stan aplikacji w przeglądarce; dane i konfiguracja są w porządku.
W changelogach Sveltii 0.171–0.180 nie ma wprost naprawy tego objawu.

Jeśli remont obejmie podbicie wersji — to osobna gałąź, przeklikanie `/admin`
i **nigdy w dniu szkolenia klienta**.

## KOLEJNOŚĆ PRACY

Konwencja projektu to **docs-first**:

1. Zbierz listę Mateusza, zestaw z zakresem A–D, ustal kolejność i podział
   na PR-y (jeden PR = jedna spójna zmiana).
2. Napisz mini-analizę `docs/analiza-remont-panelu.md` (po polsku, wzorzec
   `analiza-*.md`): decyzje z uzasadnieniem, wpływ na schemat/testy/instrukcje,
   plan migracji, ryzyka. **Poczekaj na akceptację Mateusza.**
3. Dopiero potem implementacja, PR po PR-ze, każdy z własnym kompletem testów.
4. Po każdej zmianie schematu lub zachowania panelu — **aktualizacja obu
   instrukcji** (`instrukcja-cms.md` i `instrukcja-panelu-klient.md`) w tym
   samym PR-ze. Instrukcje są pozycją nr 2 checklisty Etapu 7; rozjazd
   z rzeczywistością jest tu droższy niż gdziekolwiek indziej.
5. Wpisy w `docs/README.md` dla każdego nowego pliku `.md`.
6. Aktualizacja sekcji „Stan projektu" w `CLAUDE.md` po domknięciu remontu.

## DEFINITION OF DONE

- Zakres z obu list domknięty albo świadomie odłożony (z powodem w analizie).
- Schemat spójny w TRZECH miejscach; `pnpm test:unit` zielony.
- Treść produkcyjna i fixture zmigrowane; `pnpm build` i `pnpm build:visual`
  przechodzą.
- Pełna bramka zielona: `format:check`, `lint`, `typecheck`, `test:unit`,
  `test:e2e`, `build:visual` + `test:visual`.
- Obie instrukcje opisują stan faktyczny panelu po remoncie.
- Komunikaty commitów przygotowane i zweryfikowane commitlintem.
- Nowe/zmienione baseline'y wizualne: komplet linux + darwin, w świętej
  kolejności, za zgodą Mateusza.
