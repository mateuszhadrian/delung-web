# Prompt startowy: instrukcja obsługi CMS (realizacje) — przed Etapem 7

Do wklejenia w ŚWIEŻEJ sesji. Cel: powstaje **instrukcja dodawania,
edytowania i usuwania realizacji przez panel `/admin`** — w dwóch
wersjach (operatorska dla Mateusza, nietechniczna dla klienta). Kod
projektu się NIE zmienia; to sesja dokumentacyjna.

Kolejność w projekcie: ta instrukcja → **trening Mateusza na realnych
wpisach** → dopiero Etap 7 (umowa i przekazanie). Instrukcja klienta jest
pozycją nr 2 checklisty Etapu 7, więc powstaje tutaj, a Etap 7 tylko ją
konsumuje.

---

## Prompt (od tego miejsca w dół — wklej do nowej sesji)

Pracujemy nad delung.pl. Zadanie: napisać instrukcję obsługi CMS-a
(realizacje) — dla mnie i dla klienta. Świeża sesja, cała wiedza jest
w repo. Zacznij od `git checkout main && git pull && git status`
(drzewo ma być czyste).

### OBOWIĄZKOWA LEKTURA (w tej kolejności)

1. `public/admin/config.yml` — **definicja pól panelu, źródło etykiet**.
   Każda nazwa pola, którą wpiszesz do instrukcji, ma pochodzić stąd,
   dosłownie. To jedyne miejsce, które wie, co klient zobaczy na ekranie.
2. `src/content.schema.ts` — schemat Zod: co jest wymagane, co
   opcjonalne, co ma minimalną liczbę pozycji. To on decyduje, czy wpis
   przejdzie build.
3. `.claude/rules/cms-realizacje.md` — kontrakt CMS/media/R2
   (własność plików, zmiana schematu w TRZECH miejscach, limity wideo,
   autoryzacja panelu).
4. `.claude/skills/new-realizacja/SKILL.md` — istniejący pipeline
   dodania realizacji. Instrukcja ma być z nim **spójna**, a nie obok
   niego; rozbieżność = zgłoś ją i zaproponuj poprawkę skilla.
5. `docs/delung-web-creation-process.md` — **Część C** (flow mediów
   klienta: zdjęcia, HandBrake, warianty automatyzacji wideo) oraz
   **Etap 7** (co dokładnie ma zawierać instrukcja panelu i co jest
   przekazywane klientowi).
6. `CLAUDE.md` — zasady twarde, stan projektu (zwłaszcza Etap 2: konto
   `delung-cms`, Worker `auth.delung.pl`, bucket `delung-media`).
7. `src/content/realizacje/*.json` — **czytaj, nie edytuj**. To pięć
   wpisów testowych z Etapu 2; są wzorcem tego, co panel produkuje.
8. `src/lib/categories.ts` + `tests/unit/cms-contract.test.ts` — skąd
   biorą się opcje selecta kategorii i co dokładnie pilnuje test.

### CO MA POWSTAĆ

Dwa dokumenty (obydwa po polsku) + wpisy w `docs/README.md`:

**A. `docs/instrukcja-cms.md` — wersja operatorska (dla Mateusza).**
Pełna: kroki, ale też **co się dzieje pod spodem i co zrobić, gdy pójdzie
nie tak**. To jest dokument, z którego Mateusz uczy się przed szkoleniem
klienta i do którego wraca przy awarii.

**B. `docs/instrukcja-panelu-klient.md` — wersja dla klienta.**
Nietechniczna, krótka, zadaniowa („chcę dodać realizację" → 8 kroków).
Zero żargonu: żadnego „commita", „builda", „schematu Zod", „R2".
Zamiast tego: „panel zapisuje zmiany", „strona odświeża się w ~2 minuty",
„miejsce na zdjęcia". Ma się nadawać do wydrukowania i do pokazania na
telefonie. Przewidziana na przekazanie w Etapie 7 (pkt 2 checklisty).

### ZAKRES MERYTORYCZNY — to musi się znaleźć

Dla obu wersji (w B — uproszczone):

1. **Logowanie**: `delung.pl/admin`, konto `delung-cms` przez GitHub,
   2FA. Co zrobić, gdy panel nie wpuszcza.
2. **Dodanie realizacji** — pole po polu, w kolejności z `config.yml`,
   z przykładem wypełnienia wziętym z istniejącego wpisu. Przy każdym
   polu: czy wymagane, co się stanie, gdy zostanie puste.
3. **Zdjęcia**: skąd, jaki format (HEIC nie przejdzie transformacji —
   Część C.1), jaki rozmiar ma sens, po co jest „Kadr
   (object-position)" i jak go dobrać bez zgadywania.
4. **Wideo**: przygotowanie (HandBrake, Część C.2), limity, **zasada
   pary zdjęcie+wideo w tej samej pozycji galerii** (zdjęcie = poster),
   pole „Długość wideo". Dlaczego NIE wolno wgrywać przez bibliotekę
   Assets poza polami.
5. **Kolejność i kategorie**: jak `order` układa listę, co robi wybór
   kategorii (filtry na `/realizacje/`, karty `/oferta/`).
6. **Edycja** istniejącej realizacji + **podmiana zdjęcia**.
7. **Usunięcie realizacji** — wraz z **osieroconymi plikami w R2**:
   panel ich NIE kasuje, trzeba to zrobić ręcznie w dashboardzie
   Cloudflare. Przy wideo to nie kosmetyka, tylko rachunek za storage.
   Opisz dokładnie, gdzie w dashboardzie i po czym poznać swoje pliki.
8. **Co się dzieje po zapisaniu**: panel commituje na `main` (konto
   `delung-cms` ma bypass w rulesecie), Cloudflare Pages przebudowuje
   stronę, po ~2 min zmiana jest na `delung.pl`. Jak sprawdzić, że
   wyszło.
9. **Gdy coś pójdzie nie tak** (wersja A obowiązkowo, w B — jedno zdanie
   „zadzwoń"): wpis, który nie przechodzi walidacji, nie zepsuje
   działającej strony (poprzedni build zostaje), ale wstrzyma publikację
   kolejnych zmian. **Zweryfikuj to** w `.github/workflows/ci.yml`
   i `prod-smoke.yml` i opisz ścieżkę powrotu: gdzie zobaczyć błąd, jak
   go naprawić W PANELU, kiedy potrzebna jest interwencja w repo.
10. **Czego NIE ruszać**: pliki JSON ręcznie, `config.yml`, ustawienia
    R2, hasła. Krótka lista „to zawsze przez Mateusza".

### ZASADY TWARDE

- **NIGDY nie wykonuj `git commit` ani `git push`** — commituje wyłącznie
  Mateusz. Zostawiasz zmiany w drzewie roboczym i podajesz gotowe
  komendy, jednoliniowe. PR-y i merge klika w UI GitHuba.
- Commity: conventional, po angielsku, temat ZAWSZE małą literą po
  dwukropku, max 100 znaków na KAŻDĄ linię. Sprawdzony sposób: zapisz
  komunikat do pliku w katalogu gita (np. `.git/msg-a`), zweryfikuj
  `pnpm exec commitlint < .git/msg-a`, poproś o
  `git add <pliki> && git commit -F .git/msg-a`.
- **Nie edytuj `src/content/realizacje/*.json`** — pisze je Sveltia
  (hook-guard blokuje edycję). Do instrukcji czytasz je jako wzorzec.
- Sekretów (`.env*`, R2 Secret Access Key, tokeny) nie czytaj i nie
  wpisuj do dokumentów. Do instrukcji trafia wyłącznie informacja, że
  panel poprosi o klucz i skąd go wziąć — nie sam klucz.
- Kod produkcyjny się nie zmienia. Jedyne dopuszczalne zmiany poza
  `docs/` to poprawki nieprawdziwych zdań w `.claude/rules/` i skillu
  (patrz niżej) — każda zgłoszona Mateuszowi przed wykonaniem.
- `docs/README.md`: każdy nowy plik `.md` w `docs/` dostaje wpis
  ze statusem. Bez tego dokument nie istnieje dla następnej sesji.

### REGUŁA ANTYHALUCYNACYJNA — NAJWAŻNIEJSZA W TEJ SESJI

**Nie widzisz interfejsu Sveltii.** Możesz przeczytać, jakie pola są
zdefiniowane, ale NIE wiesz, jak wygląda ekran, jak nazywają się
przyciski, ile kliknięć dzieli login od formularza ani co panel pokazuje
po zapisaniu. Instrukcja z wymyślonymi nazwami przycisków jest gorsza niż
jej brak — klient straci zaufanie do całego dokumentu przy pierwszym
niezgodnym zdaniu.

Dlatego:

- każde zdanie o **treści pola** ma pochodzić z `config.yml` (etykiety
  cytuj dosłownie, w cudzysłowie);
- każde zdanie o **wyglądzie i nawigacji panelu** oznacz znacznikiem
  `⟦DO POTWIERDZENIA⟧` i sformułuj jako opis funkcji, nie kliknięcia
  („otwórz listę realizacji" zamiast „kliknij zielony przycisk w prawym
  górnym rogu");
- na końcu każdego dokumentu daj **listę kontrolną do pierwszego
  przejścia**: co Mateusz ma sprawdzić i poprawić po realnym kliknięciu
  przez panel. To ta lista zamienia dokument w prawdziwy.

### ZRZUTY EKRANU

Etap 7 wymaga instrukcji „ze zrzutami", a zrzutów nie wygenerujesz.
Zamiast tego wstaw w wersji B **placeholdery w formie
`![ZRZUT: <dokładnie co ma być na obrazku>](media/cms-NN-nazwa.png)`**
i zbierz je na końcu w jedną listę do zrobienia — tak, żeby Mateusz mógł
przejść przez panel RAZ i zrobić komplet za jednym posiedzeniem.
Zaproponuj katalog na te pliki i sprawdź, czy nie kolidują z regułami
repo (`docs/design/assets` jest w `.gitignore` — sprawdź, gdzie zrzuty
mają trafić, żeby przetrwały).

### PLAN TRENINGU DLA MATEUSZA

Do wersji A dopisz sekcję **„Trening przed szkoleniem klienta"**:
konkretne ćwiczenia w kolejności rosnącej trudności (wpis bez wideo →
wpis z wideo → edycja → podmiana zdjęcia → usunięcie razem ze
sprzątaniem R2), a przy każdym: **co ma się pojawić na stronie**
i **jak cofnąć skutki ćwiczenia**. W repo są dziś **cztery kuchnie
i jedna zabudowa sypialni** jako wpisy testowe z Etapu 2 (`order` 1–5,
media to placeholdery w R2) — powiedz wprost, które z nich są materiałem
treningowym, a co z nimi zrobić przed przekazaniem (D5/D6: wymiana na
materiał klienta).

Zaproponuj też **kryterium gotowości**: po czym Mateusz pozna, że umie
to na tyle, żeby uczyć klienta.

### WERYFIKACJA PRZED ODDANIEM DOKUMENTU

Nie oddawaj instrukcji, której sam nie sprawdziłeś maszynowo tam, gdzie
się da:

- opcje selecta kategorii w instrukcji = `src/lib/categories.ts`
  (7 pozycji, `inne` też) — porównaj `grep`-em, nie z pamięci;
- pola wymagane vs opcjonalne = `content.schema.ts`, nie `config.yml`
  (`required: false` w panelu i `.optional()` w Zodzie muszą się
  zgadzać — jeśli się nie zgadzają, to znalezisko, zgłoś je);
- komendy weryfikacyjne po zmianie treści (`pnpm test:unit` —
  kontrakt CMS; `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run
  tests/unit/media-r2.test.ts` — media w R2) **uruchom** i wklej
  realny wynik, zamiast obiecywać, że działają;
- ścieżki i domeny (`media.delung.pl`, `auth.delung.pl`, prefix
  `realizacje/`) — z `config.yml`, nie z pamięci.

### ZNANE ZNALEZISKO DO ZWERYFIKOWANIA

`.claude/rules/cms-realizacje.md` niesie zdanie **„Tagi: max 3 (pilnuje
Zod i UI) — nie zwiększaj bez zmiany UI"**. W schemacie (`content.schema
.ts`) ani w `config.yml` **nie ma pola `tags`** — to najprawdopodobniej
pozostałość po szablonie hadrianm-web. Sprawdź to `grep`-em po całym
repo i jeśli się potwierdzi, zaproponuj usunięcie tej linii (reguła ma
być kontraktem, nie życzeniem — projekt właśnie przeszedł rundę
prostowania komentarzy kłamiących o kontrakcie, `docs/analiza-refactor.md`
§R14, i to jest ten sam gatunek błędu). Przy okazji sprawdź, czy skill
`new-realizacja` nie odsyła do rzeczy, których już nie ma.

### ZANIM NAPISZESZ PIERWSZE ZDANIE DOKUMENTU

Zadaj Mateuszowi pytania, których nie da się rozstrzygnąć z repo. Co
najmniej te (jeśli znajdziesz więcej — pytaj):

1. **Kto realnie będzie wgrywał treści po przekazaniu** — klient sam,
   czy Mateusz na jego zlecenie? To zmienia ton i długość wersji B.
2. **Na czym klient pracuje** (telefon / komputer, Windows / Mac) —
   panel na telefonie to inny opis niż na desktopie, a HandBrake
   z Części C.2 jest desktopowy.
3. **Czy R2 Secret Access Key konfigurujesz klientowi raz przy
   przekazaniu**, czy klient ma go wklejać sam na każdym nowym
   urządzeniu (Etap 7 pkt 2 dopuszcza oba warianty — wybór zmienia
   jeden z kroków instrukcji).
4. **Czy wersja B ma opisywać wideo od razu**, czy start ma być bez
   wideo (mniej kroków = większa szansa, że klient w ogóle zacznie).

### DEFINITION OF DONE

Oba dokumenty w `docs/` + wpisy w `docs/README.md`; wszystkie etykiety
pól cytowane z `config.yml`; wszystko, czego nie dało się zweryfikować
z repo, oznaczone `⟦DO POTWIERDZENIA⟧` i zebrane w listę kontrolną;
lista zrzutów do zrobienia; sekcja treningowa z kryterium gotowości;
`pnpm format:check` zielony (Prettier obejmuje `docs/`); komunikaty
commitów przygotowane i zweryfikowane commitlintem; ewentualne poprawki
w regułach/skillu zgłoszone Mateuszowi ZANIM je wykonasz.
