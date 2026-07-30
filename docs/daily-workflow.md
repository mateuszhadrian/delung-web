# Daily workflow — codzienny proces pracy nad delung-web

> **Status:** AKTUALNY — instrukcja operacyjna (2026-07-30, po Etapie 1).
> main = produkcja (Cloudflare Pages deployuje każdy merge na
> `https://delung.pl` automatycznie). Ruleset `main-protection` wymaga
> PR + zielonego checku `quality`; checki `e2e` i `lighthouse` dojdą do
> required po adaptacji speców i budżetów w **Etapie 3** (do tego czasu
> na PR-ach będą CZERWONE — to oczekiwane, bramką jest samo `quality`).
>
> Repo jest PUBLICZNE (decyzja 2026-07-30 — jak hadrianm-web; ruleset
> na planie Free jest wtedy egzekwowany twardo). Konsekwencja: żadnych
> sekretów ani wrażliwych danych w repo i w docs — przy rozkręceniu
> biznesu planowana migracja wszystkich repo na prywatne + płatny plan.
>
> Kontrakt testów: `.claude/rules/testing.md`. Zasada nadrzędna:
> **commituje i pushuje wyłącznie Mateusz** (Claude proponuje treść
> commitów — conventional, po angielsku, ze scope).

## ⚡ Ściąga (to wystarczy w 90% przypadków)

```bash
# START — zawsze ze świeżego maina
git checkout main && git pull
git checkout -b fix/krotki-opis        # typ: fix/ feat/ chore/ perf/ docs/

# … praca (sam lub z Claude'em) …

# SPRAWDŹ LOKALNIE (w Claude Code):
#   /test          ← dobiera i odpala tylko potrzebne warstwy testów

# WYŚLIJ
git add -A
git commit -m "feat(oferta): opis zmiany"  # conventional commit ze scope
git push -u origin fix/krotki-opis

# GITHUB
#   Compare & pull request → Create pull request
#   poczekaj na zielone `quality` (od Etapu 3: komplet 3 checków)
#   → Merge pull request → Delete branch

# SPRZĄTANIE
git checkout main && git pull
git branch -d fix/krotki-opis

# KONIEC — deploy i weryfikacja produkcji dzieją się SAME.
#   (zerknij tylko, czy nie przyszedł mail o czerwonym „Prod smoke")
```

---

## Krok po kroku — co się dzieje i dlaczego

### 1. Feature branch (nigdy praca wprost na main)

Gałąź nazywaj `typ/krotki-opis` (np. `feat/widok-oferta`,
`fix/work-carousel`, `chore/deps-bump`, `docs/analiza-home`) — ten sam
typ trafi potem do commitów.

W trakcie pracy z Claude'em działają automaty:

- hook `remind-tests.sh` podpowiada, jaką warstwą testów zweryfikować
  edytowany plik,
- hook `guard-realizacje.sh` blokuje ręczną edycję JSON-ów kolekcji
  (pisze je wyłącznie Sveltia),
- hook Stop sam odpala `typecheck` + `test:unit` po każdej turze ze
  zmianami w `.ts`/`.astro` — czerwone blokuje zakończenie tury.

### 2. `/test` — weryfikacja lokalna przed pushem

Skill czyta `git diff`, mapuje zmienione ścieżki na warstwy
(`.claude/rules/testing.md`) i odpala tylko to, co trzeba:

| Zmieniłeś…                                | Poleci…                     |
| ----------------------------------------- | --------------------------- |
| schema CMS / `content.config` / wpis JSON | unit (kontrakt CMS)         |
| `i18n`, `img.ts`, `contact-form.ts`       | unit                        |
| navbar, overlaye, Work, `src/scripts/`    | e2e                         |
| layout, style globalne, wygląd sekcji     | visual (`pnpm build` przed) |
| coś przekrojowego / nie wiadomo           | pełne `pnpm test`           |

Krok opcjonalny (CI i tak wszystko sprawdzi), ale lokalnie masz wynik
w 1–3 min zamiast czekać na runner. Przed większym release'em:
`/release-check` (pełna bramka + checklista urządzeń fizycznych).

UWAGA (do Etapu 3): warstwy e2e/visual są jeszcze w stanie
odziedziczonym — część speców czeka na adaptację do widoków delung,
baseline'ów wizualnych nie ma wcale. Do tego czasu miarodajne lokalnie
są `pnpm test:unit`, `pnpm typecheck`, `pnpm build`.

### 3. Commit + push + PR

Commit po angielsku, conventional ze scope: `feat(oferta): …`,
`fix(work): …`, `docs(cms): …`. Po pushu GitHub pokaże banner
**Compare & pull request** — klik, **Create pull request**.

### 4. Checki bramkują merge

Odpalają się same przy otwarciu PR-a i po każdym kolejnym pushu:

| Check        | Czas   | Co łapie                                          | Required?     |
| ------------ | ------ | ------------------------------------------------- | ------------- |
| `quality`    | ~1 min | format, lint, typy, testy jednostkowe, build      | ✅ od Etapu 1 |
| `e2e`        | kilka min | testy funkcjonalne + pixel-diff vs baseline'y  | od Etapu 3    |
| `lighthouse` | ~2 min | budżety wydajności (ratchet)                      | od Etapu 3    |

Czerwony check → poprawka → `git push` → checki liczą się od nowa.

### 5. Merge = deploy (automatycznie)

Po merge'u NIE robisz nic:

- **Cloudflare Pages** buduje i publikuje `https://delung.pl` (~1–2 min),
- **CI** przebiega kontrolnie jeszcze raz na main,
- **Prod smoke** czeka, aż produkcja zacznie serwować świeży build
  (porównuje hash assetu), i odpala testy `@prod-smoke` przeciwko żywej
  stronie.

Czerwony `Prod smoke` = mail z GitHuba w kilka minut po zepsutym
deployu. Zielony = zmiana jest na produkcji i zweryfikowana.

---

## Przypadki specjalne

### Celowa zmiana wyglądu (czerwone testy wizualne) — od Etapu 3/4

1. Obejrzyj diffy (`test-results/**/…-diff.png` albo
   `pnpm exec playwright show-report`) — upewnij się, że różnice to
   dokładnie to, co zamierzałeś, i pokaż je Mateuszowi.
2. Lokalnie: `pnpm test:visual:update` → nowe baseline'y `*-darwin.png`
   — ale **jeszcze ich nie commituj** (kolejność niżej ma znaczenie).
3. Push samego kodu na gałąź PR-a. Checki mogą być chwilowo czerwone
   na starych `*-linux.png` — to oczekiwany stan przejściowy.
4. Linux: Actions → **Update linux visual baselines** → Run workflow
   → **wybierz gałąź PR-a** (nigdy main!) → bot dopisze commit →
   `git pull` na gałęzi.
5. **Dopiero teraz** commit `*-darwin.png` + push. Bot pushuje na
   `GITHUB_TOKEN`, a taki push **nie wyzwala CI** — required checks na
   nowym SHA odpala dopiero Twój push. Darwin na końcu = jedno pełne CI
   na finalnym stanie (kod + oba komplety).
6. Oba komplety + kod jadą w JEDNYM PR.

⚠️ Nigdy nie aktualizuj baseline'ów po to, żeby „naprawić" czerwony
test bez obejrzenia diffu — od łapania regresji one tu są.

### Czerwony check — szybka diagnoza

- `e2e`/wizualne: artefakt `playwright-report` w przebiegu → raport HTML
  z diffami.
- `lighthouse`: log joba pokazuje, która metryka przebiła próg; progi to
  ratchet — podnosimy je tylko świadomą decyzją Mateusza, osobnym
  commitem.
- Wszystko padło na `apt-get`/instalacji przeglądarek: infra GitHuba,
  nie Twój kod → **Re-run failed jobs**.

### Nowa realizacja (CMS) — od Etapu 2

Wpis robi się w panelu `/admin` (Sveltia commituje na main przez GitHub
API — z pominięciem PR; to jedyny legalny wyjątek od reguły „wszystko
przez PR"). Potem: `git pull` + `pnpm test:unit` (kontrakt CMS).
Pełen pipeline: skill `/new-realizacja`.

### Hotfix produkcji

Ten sam proces — tylko szybciej: mała gałąź, mały diff, `/test`, PR,
merge. Przy realnym pożarze można zmergować mimo czerwonych checków —
ale to świadoma decyzja Mateusza, domyślnie NIE.

### Kroki „w chmurze" (panele)

Zmiany w panelach GitHub / Cloudflare / OVH / Resend klika Mateusz wg
części B instrukcji (`delung-web-creation-process.md`); Claude podaje
dokładne kliki i weryfikuje efekty z zewnątrz (`dig`/`curl`).
