# Prompt startowy — runda poprawek po Etapie 6 (nowa sesja)

> Skopiuj CAŁĄ zawartość poniżej do nowej sesji Claude Code (Opus 5)
> otwartej w katalogu `~/Projects/delung-web`. Plik jest w repo, więc
> gdyby prompt się zgubił, wystarczy otworzyć ten dokument.

---

Pracujemy nad delung.pl. **Runda poprawek po testach — przed Etapem 7.**
Świeża sesja: nie masz kontekstu z poprzednich rozmów, cała wiedza jest
w repo.

Zacznij od `git checkout main && git pull && git status`, potem wykonaj
lekturę niżej W CAŁOŚCI, zanim cokolwiek zaproponujesz.

## STAN WORKING TREE NA START (to jest oczekiwane, nie sprzątaj tego)

`git status` pokaże dwie niescommitowane zmiany, obie dokumentacyjne:

- `docs/etap-6-poprawki-prompt.md` — **ten plik** (nowy, nieśledzony),
- `docs/README.md` — wpis o nim w indeksie.

Świadoma decyzja Mateusza: idą do repo razem z **pierwszym commitem tej
rundy**, żeby nie tracić czasu na osobny PR. Gotowy komunikat czeka
w `.git/msg-e` (zweryfikowany commitlintem) — przy pierwszym PR-ze rundy
zaproponuj Mateuszowi osobny commit:
`git add docs/README.md docs/etap-6-poprawki-prompt.md && git commit -F .git/msg-e`
Jeśli plik `.git/msg-e` nie istnieje (np. inne repo lokalne), napisz
komunikat od nowa w tej samej konwencji.

## OBOWIĄZKOWA LEKTURA (w tej kolejności)

1. `CLAUDE.md` — zasady twarde, stan projektu (Etapy 0–6 + runda poprawek
   wizualnych), mapa projektu, komendy.
2. `docs/README.md` — indeks statusów dokumentacji.
3. `.claude/rules/` — WSZYSTKIE pliki: `testing.md`, `sections.md`,
   `scroll-lenis.md`, `cms-realizacje.md`, `capture-scripts.md`.
4. `docs/analiza-poprawki-wizualne.md` — **wzorzec dokumentu dla tej
   rundy** (poprzednia runda poprawek: lista zgłoszeń → stan zastany →
   decyzje D-P1…D-P7 → implementacja → testy → baseline'y → podział na
   PR-y). Nowa runda ma powstać dokładnie w tej konwencji.
5. Analizy widoków, których dotkną poprawki — czytaj TYLKO te potrzebne,
   po ustaleniu zakresu ze mną:
   - `docs/analiza-chrome-globalny.md` (navbar, menu, stopka; D-CH5 =
     antyscraping tel/mail),
   - `docs/analiza-strona-glowna.md` (sekcje `/`, sceny przypięte, hero),
   - `docs/analiza-oferta-kategorie.md` (`/oferta/`, `/kategorie/`),
   - `docs/analiza-realizacje.md` (`/realizacje/`, detal, galeria, wideo),
   - `docs/analiza-proces-onas-polityka.md`,
   - `docs/analiza-kontakt.md` (`/kontakt/` + formularz),
   - `docs/analiza-etap-6.md` (ikony, JSON-LD, budżety LHCI, Analytics).

Decyzje D1–D8 z `docs/delung-web-entrance-analysis.md` są ZAPADŁE — nie
otwieraj ich na nowo.

## STAN, KTÓREGO NIE MUSISZ ODKRYWAĆ

- Astro 6 static (bez SSR), PL-only, breakpoint **1024 px**, hosting
  Cloudflare Pages, `main` = produkcja (chroniony; required checks:
  `quality`, `e2e`, `lighthouse`; po merge'u leci `prod-smoke.yml`).
- **Etapy 0–6 zamknięte.** Wszystkie 8 widoków gotowych i przetestowanych,
  formularz działa (Resend + Turnstile + KV), CMS Sveltia działa, SEO
  i pomiar wdrożone. Bez GSAP, bez ciemnego motywu, bez toastów. Lenis
  tylko desktop (dotyk = scroll natywny).
- Allowlista axe jest **PUSTA** i taka zostaje.
- Budżety LHCI po Etapie 6 (`lighthouserc.cjs` / `lighthouserc.desktop.cjs`):
  mobile perf 0,80 / LCP **5200** / TBT 150 / CLS 0,02 / script **30 000 B**
  / total **900 000 B**; desktop perf 0,9 / LCP 1800 / TBT 200 / CLS 0,01 /
  script 30 000 B / total 1 650 000 B. **Zweryfikowane w CI po merge'u
  PR #28** (run 30812249337, wszystkie joby zielone): mobile perf 0,89 /
  LCP 3777 ms / TBT 6 ms / CLS 0,0117 / script 19 053 B / total 816 496 B;
  desktop perf 0,94 / LCP 1586 ms / TBT 66 ms / CLS 0,0042 / script
  19 053 B / total 1 519 558 B. Najciaśniejszy zapas ma `total` (9 % na
  mobile, 8 % na desktopie) — nowe zdjęcia albo font potrafią go zjeść,
  więc przy zmianach zasobów sprawdź budżet ZANIM oddasz PR.
- **Runner GitHuba bywa wolny** — 3 sierpnia 2026 ten sam kod dawał LCP
  3918 ms (FCP 421 ms) albo 4592–4890 ms (FCP 1750 ms). Czerwony
  `lighthouse` na LCP przy niezmienionych bajtach = najpierw hipoteza
  szumu (re-run jobu), a NIE ruszanie progów. Progi zmieniamy wyłącznie
  osobnym commitem po pomiarze i za moją zgodą.
- Lokalny `lhci autorun` na profilu mobile mierzy ~5030 ms i po zmianie
  progu na 5200 przechodzi; nadal jednak bramkuje CI, nie Mac.

## TRYB PRACY

1. **Najpierw zapytaj mnie, co ma być poprawione.** Nie zgaduj zakresu —
   mam listę zgłoszeń z testowania i podam ją po Twoim pytaniu. Dopytaj
   o wszystko, czego nie da się wywnioskować z repo (np. na którym
   urządzeniu/progu widać problem, czy to zmiana designu czy błąd,
   priorytet). Czego da się dowiedzieć z kodu, designów w `docs/design/`
   lub analiz — sprawdź SAM, nie pytaj.
2. **Docs-first**: napisz `docs/analiza-poprawki-2.md` (po polsku, wzorzec
   `analiza-poprawki-wizualne.md`, numeracja decyzji **D-Q1, D-Q2, …**):
   lista zgłoszeń → stan zastany z kodu → decyzje z konsekwencjami →
   implementacja (pliki) → testy → rachunek baseline'ów → podział na PR-y
   → ryzyka i co wymaga testu na fizycznym telefonie. Dopisz plik do
   `docs/README.md`. **Przedstaw mi do akceptacji, zanim ruszysz kod.**
   Jeśli któraś poprawka koryguje wcześniejszą decyzję (D-CH…, D-SG…,
   D-OK…, D-R…, D-K…, D-P…, D-E…), opisz ją jako **KOREKTA D-…**
   i zdubluj dopiskiem w odpowiedniej analizie widoku.
3. **Implementacja → testy → PR.** Jeden PR = jedna spójna grupa zmian.
4. Po merge'u zaktualizuj „Stan projektu" w `CLAUDE.md` (data + numery
   PR-ów).

## ZASADY TWARDE

- **NIGDY nie wykonuj `git commit` ani `git push`** — commituje wyłącznie
  Mateusz (blokada też w `.claude/settings.json`). Zostawiasz zmiany
  w working tree i podajesz gotowe komendy.
- Commity: conventional, po angielsku, temat ZAWSZE **małą literą** po
  dwukropku. Commitlint wymusza max 100 znaków na KAŻDĄ linię body.
  SPRAWDZONY SPOSÓB: zapisz komunikat do pliku w katalogu gita
  (np. `.git/msg-a`), zweryfikuj `pnpm exec commitlint < .git/msg-a`,
  a mnie poproś o `git add -A && git commit -F .git/msg-a`. Gdy jeden PR
  ma mieć kilka commitów, a zmiany siedzą w jednym pliku — przygotuj
  łatkę (`git diff --no-index` + `git apply`), żeby nie było potrzebne
  interaktywne `git add -p` (ten sposób sprawdził się w Etapie 6).
- Komendy dla mnie podawaj **JEDNOLINIOWE**. PR-y i merge klikam w UI
  GitHuba — opisuj klikami.
- **Baseline'y wizualne** (`tests/visual/__screenshots__`): NIE aktualizuj
  bez pokazania diffu i mojej zgody. Pokazuj diff OBRAZKAMI
  (`open test-results/*/…-diff.png`), nie opisem. Święta kolejność:
  kod → workflow „Update linux visual baselines" z brancha PR-a (Actions
  → Run workflow → wybierz branch) → `git pull` → lokalnie
  `pnpm test:visual:update` → commit darwin NA KOŃCU (bot-push nie
  wyzwala CI). Uwaga: komplety darwin i linux mogą różnić się LICZBĄ
  plików — drobna zmiana tekstu potrafi zmieścić się w tolerancji
  `maxDiffPixelRatio` 0.0005 na jednej platformie, a przekroczyć ją na
  drugiej (udokumentowany przypadek: `polityka-top` na chromium-1920).
- Nie edytuj `src/content/realizacje/*.json` (pisze je Sveltia CMS). Nie
  dotykaj `dist/` ani `.astro/`. Sekretów (`.env*`, klucze Resend/
  Turnstile/R2/Cloudflare) nie czytaj i nie loguj.
- Zero nowych wpisów w allowliście axe. Schemat CMS (gdyby doszło) —
  w TRZECH miejscach naraz (reguła `.claude/rules/cms-realizacje.md`).
- **Antyscraping D-CH5**: telefon i e-mail NIE mogą istnieć w statycznym
  źródle. Składa je JS z `src/lib/contact-details.ts`; `src/lib/jsonld.ts`
  celowo ich NIE zna. Test `tests/e2e/contact.spec.ts` grepuje CAŁY
  katalog `dist` na `kontakt@delung.pl`, `690291143`, `690 291 143` —
  każda poprawka dotykająca kontaktu musi to uszanować.

## TESTY (kontrakt: `.claude/rules/testing.md`)

- Warstwy: `pnpm test:unit` / `pnpm test:e2e` (6 profili) /
  `pnpm build && pnpm test:visual` (WYMAGA preview na 4399 — strażnik
  `assertPreview`, nie obchodź go).
- Przed oddaniem PR-a komplet: `format:check`, `lint`, `typecheck`,
  `test:unit`, `test:e2e`, `build` + `test:visual`. Przed release:
  `/release-check`.
- Każda poprawka zmieniająca zachowanie ma dostać asercję w odpowiednim
  specu — nie zostawiaj zmiany bez testu, który by ją złapał przy
  regresji.
- Diagnozę czerwonego CI opieraj na danych, nie na przeczuciu: metryki
  wyciągniesz przez `gh run view <id> --log` (raporty LHCI lądują na
  `storage.googleapis.com`, LHR siedzi w HTML-u pod
  `window.__LIGHTHOUSE_JSON__`).

## CZEGO EMULACJA NIE ŁAPIE (proś mnie o test na telefonie)

Limit warstwy GPU Androida (karuzele, bottom sheety), iOS Low Power Mode
(wideo na tap w detalu realizacji), zwijany toolbar Safari (sticky navbar,
metryki viewportu, hero `100svh`), zimny cache + realne łącze, dotyk
fizyczny (snap karuzel, swipe-down sheetów). Przy zmianach w tych
obszarach powiedz wprost, na co mam patrzeć.

## DEFINITION OF DONE RUNDY

`docs/analiza-poprawki-2.md` + wpis w `docs/README.md`; zielone lokalnie
`format:check`, `lint`, `typecheck`, `test:unit`, `test:e2e` (6 profili),
`build` + `test:visual`; zero nowych wpisów w allowliście axe; baseline'y
zaktualizowane TYLKO tam, gdzie zmiana wyglądu była zamierzona (oba
komplety w jednym PR); PR-y zielone na `quality` + `e2e` + `lighthouse`;
po merge'u `prod-smoke` zielony; `CLAUDE.md` zaktualizowane (runda
wykonana + numery PR-ów); poprawki potwierdzone przeze mnie na fizycznych
urządzeniach tam, gdzie emulacja nie wystarcza.

**Zacznij od lektury i `git pull`, a potem zapytaj mnie, co ma być
poprawione — czekam na to pytanie, zanim zobaczę jakikolwiek kod.**
