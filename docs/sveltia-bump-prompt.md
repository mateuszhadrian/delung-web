# Prompt startowy: podbicie Sveltia CMS 0.170.0 → 0.180.x

> Do wklejenia w **świeżej sesji**. Zadanie jest wąskie i z natury odwracalne
> (jedna linia w jednym pliku), ale dotyka narzędzia, którym klient wgrywa
> treść — dlatego cała wartość tej sesji leży w **weryfikacji**, nie
> w edycji. Decyzja odłożona świadomie: D-RP10 w `docs/analiza-remont-panelu.md`.

---

Podbijamy wersję panelu Sveltia CMS na `delung.pl/admin`.

## ZASADA NADRZĘDNA

**Nigdy w dniu szkolenia klienta i nigdy „na szybko" przy kliencie na
linii.** Jeśli szkolenie jest dziś albo jutro — powiedz to Mateuszowi
i zaproponuj przełożenie. To jedyna zasada, która unieważnia całą resztę
promptu.

## OBOWIĄZKOWA LEKTURA (w tej kolejności)

1. `CLAUDE.md` — zasady twarde i stan projektu (Etapy 0–6 zamknięte, remont
   panelu wykonany, przed nami Etap 7 = umowa i przekazanie).
2. `docs/analiza-remont-panelu.md` — **§10 (co dokładnie przeklikano
   w panelu i jak) oraz §11 (M6)**. §10 jest gotową checklistą regresji dla
   tej sesji; nie wymyślaj własnej, zanim jej nie przeczytasz.
3. `.claude/rules/cms-realizacje.md` — kontrakt CMS/media/R2 i reguła
   „schemat w TRZECH miejscach naraz".
4. `public/admin/config.yml` — **na czym stoi nasza konfiguracja**: warianty
   listy (`types`/`typeKey`), `hint`, `min`, `summary` per wariant,
   `media_libraries.cloudflare_r2`, `site_domain`, `output.omit_empty_optional_fields`.
5. `docs/instrukcja-cms.md` §2 (diagnostyka logowania) i §3 (klucz R2).

## STAN FAKTYCZNY (zweryfikowany 2026-08-05 — SPRAWDŹ PONOWNIE)

Wersje wychodzą tu bardzo szybko (**28 wydań w miesiąc**), więc traktuj
poniższe jako punkt wyjścia i **odśwież dane na starcie sesji**:

| Fakt | Stan na 2026-08-05 |
| --- | --- |
| Wersja przypięta w repo | **0.170.0** (`public/admin/index.html`, jsDelivr) |
| Najnowsza na npm | **0.180.0**, wydana **tego samego dnia** (13:11 UTC) |
| Wydań pomiędzy | 27 |
| Pozycji w changelogach | 49 |

Przegląd changelogów pod kątem rzeczy, **na których stoi nasz panel** —
w 27 wydaniach po 0.170.0:

| Obszar | Zmiany |
| --- | --- |
| Warianty listy (`types`/`typeKey`) | **żadnych** |
| `media_libraries` / Cloudflare R2 | **żadnych** |
| `hint` pod polem | **żadnych** |
| Backend GitHub / logowanie | **żadnych** |
| Tryb lokalnego repozytorium | **żadnych** |

Jedyna zmiana łamiąca (v0.174.0): **Google Fonts → Fontsource**, ze skutkiem
wyłącznie dla stron z Content Security Policy. **Sprawdzone: nie mamy CSP**
(ani `public/_headers`, ani meta w `public/admin/index.html`) — czyli nas nie
dotyczy. Potwierdź to jednym grepem, nie przyjmuj na wiarę.

Znany błąd panelu (wyszarzony przycisk wstawiania zasobu, 3 wystąpienia
u Mateusza, leczony twardym odświeżeniem): **w changelogach 0.171–0.180 nie
ma wprost jego naprawy.** Nie obiecuj Mateuszowi, że podbicie to naprawi —
jeśli objaw zniknie, to bonus, a nie cel.

### Rekomendacja co do wyboru wersji

0.180.0 wyszło **tego samego dnia**, w którym powstał ten prompt. Przy
tempie 28 wydań miesięcznie łatki `.1` pojawiają się szybko. Na starcie
sesji sprawdź, czy nie ma czegoś nowszego i **preferuj wersję, która żyje
od co najmniej kilku dni**, zamiast najświeższej z dziś. Wybór uzasadnij
Mateuszowi liczbami, nie przeczuciem.

## ZAKRES ZMIANY W KODZIE

Dokładnie **jedna linia**:

```html
<!-- public/admin/index.html -->
<script src="https://cdn.jsdelivr.net/npm/@sveltia/cms@0.170.0/dist/sveltia-cms.js"></script>
```

Nie ma lockfile'a, nie ma zależności npm, nie ma nic więcej do podniesienia.

Numer wersji jest jednak **cytowany w dokumentacji** i tam też musi się
zgadzać — rozjazd jest groźniejszy niż zwykle, bo to dokumenty, z których
Mateusz diagnozuje awarie. Zrób `grep -rn "0\.170\.0" --include="*.html"
--include="*.md" . | grep -v node_modules` i rozdziel wyniki na dwie grupy:

**Do zaktualizowania** (mówią „dziś używamy wersji X"):

- `public/admin/index.html` — sam skrypt,
- `docs/instrukcja-cms.md` §2 pkt 5 („wciąga Sveltię z jsDelivr
  z **przypiętą** wersją (dziś `0.170.0`)") oraz §15 pkt 8 („Nie podbijaj
  wersji Sveltii…"),
- `CLAUDE.md` — wpis o odłożonym D-RP10 (przepisz na wykonane).

**Do ZOSTAWIENIA w spokoju** (to zapisy historyczne — mówią „sprawdzone
w binarium 0.170.0", czyli w wersji, w której faktycznie to sprawdzano):

- `docs/instrukcja-cms.md` §4 (o braku hooka walidacji całego wpisu),
- `CLAUDE.md` w akapicie o remoncie panelu (o wariantach listy),
- `docs/analiza-remont-panelu.md` i `docs/remont-panelu-prompt.md` — całe
  dokumenty są zapisem stanu z konkretnego dnia; nie przepisuj ich wstecz.

Jeśli po podbiciu sprawdzisz któryś z tych mechanizmów w nowej wersji,
**dopisz nową obserwację**, zamiast podmieniać starą liczbę.

## JAK TESTOWAĆ — TO JEST WŁAŚCIWA TREŚĆ ZADANIA

### ⚠️ Pułapka, która może zatrzymać produkcję

`config.yml` ma `branch: main`, więc **panel odpalony lokalnie i tak
commituje na `main`**. Zapis podczas testu poszedłby wprost na produkcję.

**Testuj w trybie lokalnego repozytorium**: `pnpm dev` →
`http://localhost:4321/admin/index.html` → na ekranie logowania
**„Work with Local Repository"** (wymaga przeglądarki na Chromium) → wskaż
katalog projektu. Panel edytuje wtedy pliki w drzewie roboczym, bez ani
jednego commita na GitHub, a wszystko cofasz przez `git checkout --`.
Ta ścieżka jest sprawdzona — tak testowano remont (§10 analizy).

### Checklista regresji (minimum)

Po każdym punkcie zapisz wynik — to materiał do PR-a i do §10 analizy.

1. **Panel w ogóle wstaje** i pokazuje listę realizacji (dziś 6 wpisów).
2. **Wpis się otwiera**, a galeria pokazuje pozycje z podpisami; wpis
   `kuchnia-zmigrodzka` ma film na drugiej pozycji — ma być rozpoznany jako
   „Film", bez pola na zdjęcie.
3. **Dodanie pozycji pyta o rodzaj** („Zdjęcie" / „Film"), pokazuje pola
   tylko wybranego wariantu.
4. **`hint` pod polem galerii się renderuje** (w 0.170.0 nie zdążyliśmy tego
   sprawdzić — jeśli nie widać go także po podbiciu, zgłoś to Mateuszowi
   jako osobne znalezisko, nie jako regresję).
5. **Zapis nie psuje kształtu danych** — zmień drobiazg, zapisz, potem
   `git diff src/content/realizacje/` i `pnpm test:unit`. Klucze `type`
   mają zostać nietknięte. **To jest najważniejszy punkt całej listy.**
6. **Kolejność pozycji** da się zmienić przeciąganiem.
7. **Upload do R2** — jedyna rzecz, której tryb lokalny może nie oddać
   wiernie. Jeśli zachowa się dziwnie, NIE traktuj tego jako regresji:
   zanotuj i zweryfikuj po merge'u na produkcji, na wpisie testowym.
8. Na koniec: `git checkout -- src/content/realizacje/` i `git status`
   czysty.

### Bramka i zakres testów automatycznych

Podbicie wersji panelu **nie dotyka builda strony** (`public/admin/` to
statyczne pliki kopiowane do `dist`), więc testy wizualne i e2e nie mają
tu czego złapać — ale przepuść pełną bramkę mimo to:
`format:check`, `lint`, `typecheck`, `test:unit`, `build`. Nie regeneruj
żadnych baseline'ów; jeśli którykolwiek zrzut się ruszy, to znaczy, że coś
poszło nie tak — zatrzymaj się i zgłoś.

## PO MERGE'U

1. Wejdź na `https://delung.pl/admin` (twarde odświeżenie) i przejdź punkty
   1–3 checklisty **na produkcji**, logując się kontem `delung-cms`.
2. Dodaj i skasuj jeden wpis testowy z **uploadem zdjęcia do R2** — to
   domyka punkt 7, którego tryb lokalny nie pokrywa. Po skasowaniu wpisu
   posprzątaj plik w R2 (`instrukcja-cms.md` §9) i odpal
   `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`.
3. Uprzedź Mateusza, żeby klient **odświeżył kartę panelu**, jeśli miał ją
   otwartą.

## WYCOFANIE

Gdyby cokolwiek było nie tak: przywrócenie numeru wersji w jednej linii,
PR, merge — panel wraca do 0.170.0 w ~2 minuty od merge'a. **Żadne dane nie
są zagrożone**: wersja panelu nie ma wpływu na treść już zapisaną w repo ani
na pliki w R2. Powiedz to Mateuszowi wprost na starcie — to jest powód, dla
którego ta zmiana jest bezpieczna mimo pozornie dużego skoku wersji.

## ZASADY TWARDE

- **NIGDY `git commit` ani `git push`** — commituje wyłącznie Mateusz.
  Zostawiasz zmiany w drzewie i podajesz gotowe, jednoliniowe komendy.
  PR-y i merge klika w UI GitHuba.
- Commity: conventional, po angielsku, **temat małą literą** po dwukropku,
  max 100 znaków na KAŻDĄ linię. Sprawdzony sposób: zapisz komunikat do
  pliku w katalogu gita (np. `.git/msg-a`), zweryfikuj
  `pnpm exec commitlint < .git/msg-a`, poproś o
  `git add <pliki> && git commit -F .git/msg-a`.
- **`src/content/realizacje/*.json` pisze Sveltia** — ręczna edycja
  zabroniona (hook-guard). W tej sesji nie ma powodu ich dotykać.
- **Baseline'ów wizualnych nie regenerujesz.** Jeśli kusi — to sygnał, że
  coś jest nie tak, a nie że trzeba je odświeżyć.
- Sekretów (`.env*`, klucz R2, tokeny) nie czytaj i nie wpisuj do dokumentów.
- `main` = produkcja; zmiany idą przez feature branch → PR → zielone checki
  → merge.

## DEFINITION OF DONE

- Wersja podbita w `public/admin/index.html` **i** we wszystkich miejscach,
  gdzie numer jest cytowany w dokumentacji.
- Checklista regresji przeklikana, wynik **każdego** punktu zapisany w PR-ze.
- Pełna bramka zielona, zero nowych baseline'ów.
- `docs/analiza-remont-panelu.md`: dopisana krótka notka o podbiciu
  (wersja, data, wynik regresji) — D-RP10 zamknięte.
- `CLAUDE.md`: zaktualizowany numer wersji i stan.
- Wpis w `docs/README.md`, jeśli powstał nowy plik `.md`.
- Komunikaty commitów przygotowane i zweryfikowane commitlintem.
- Weryfikacja na produkcji po merge'u (sekcja „PO MERGE'U") wykonana
  i zaraportowana.
