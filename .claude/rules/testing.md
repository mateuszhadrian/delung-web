# Testy — kontrakt projektu

Harness odziedziczony z szablonu (konfiguracja Playwright/Vitest/axe/LHCI,
6 profili, helpery). Baseline'y wizualne i budżety LHCI delung mierzone OD
NOWA w Etapie 3 instrukcji (`docs/delung-web-creation-process.md`) —
liczby szablonu nie obowiązują.

## Co zmieniasz → co uruchamiasz

| Zmiana                                                        | Warstwa (komenda)                       |
| ------------------------------------------------------------- | --------------------------------------- |
| `src/content.schema.ts` / `content.config.ts` / nowy wpis CMS | `pnpm test:unit` (kontrakt CMS)         |
| `src/i18n/**`, `src/lib/img.ts`, `src/lib/contact-form.ts`    | `pnpm test:unit`                        |
| `src/scripts/**`, navbar, Work/overlaye, kontakt              | `pnpm test:e2e`                         |
| Każda zmiana wyglądu                                          | `pnpm build:visual && pnpm test:visual` |
| Przed release                                                 | pełne `pnpm test` + `/release-check`    |

## Zasady twarde

- Testy wizualne WYŁĄCZNIE na preview (webServer configu, port 4399 — na
  4321 często wisi dev do telefonu). Helper `assertPreview` wykrywa
  `/@vite/client` i przerywa — nie obchodź go.
- Testy wizualne stoją na **ZAMROŻONEJ treści realizacji**
  (`tests/fixtures/realizacje` — 5 wpisów, 2 kategorie, 1 pozycja z wideo),
  bo baseline to obraz: realizacja dodana/usunięta/przestawiona w panelu
  rozjeżdżałaby zrzuty siatki, szyny filtrów, liczników, sceny realizacji na
  stronie głównej i detalu — czyli blokowała WSZYSTKIE PR-y do czasu
  regeneracji baseline'ów (zdarzyło się realnie, 2026-08-05). Stąd
  `pnpm build:visual` (przestawia `REALIZACJE_DIR` w `content.config.ts`)
  zamiast `pnpm build`; strażnik `assertVisualFixture` porównuje liczbę
  wpisów w `dist` z fixture i przerywa z instrukcją zamiast pixel-diffa.
  **Fixture jest niezależny od treści produkcyjnej** — nie synchronizuj go
  z `src/content/realizacje` i nie „aktualizuj" po zmianach klienta; zmieniaj
  wyłącznie wtedy, gdy zrzut ma świadomie pokazać inny UKŁAD (wtedy = nowe
  baseline'y w tym samym PR). Testy e2e funkcjonalne fixture'u NIE używają:
  czytają treść produkcyjną dynamicznie i są na jej zmiany odporne.
- Baseline'y (`tests/visual/__screenshots__/`, commitowane): DWA komplety
  per plik — `*-darwin.png` (lokalnie: `pnpm test:visual:update`) i
  `*-linux.png` (ręcznie wyzwalany workflow `update-visual-baselines.yml`,
  bot-commit na branch PR-a; awaryjnie Docker
  `mcr.microsoft.com/playwright:v<wersja>-noble`). Zamierzona zmiana
  wyglądu = kod + OBA komplety w jednym PR. Kolejność NA ZAWSZE:
  kod → workflow linux → commit darwin na końcu (bot-push nie wyzwala CI).
- ZAKAZ regenerowania baseline'u w celu „naprawienia" czerwonego testu bez
  pokazania diffu Mateuszowi i jego zgody (blokada Edit/Write także
  w settings.json). Nigdy nie „naprawiaj" rozjazdu darwin↔linux globalnym
  progiem — od tego jest `{platform}` w ścieżce snapshotów.
- Wideo na zrzutach zawsze przez maskę (klatka wideo to loteria);
  odtwarzanie wideo detalu realizacji testuj funkcjonalnie w e2e (Etap 4.4).
- NIE emuluj `prefers-reduced-motion: reduce` (bramka w BaseLayout = testy
  „przechodzą" na martwej stronie); świadome, punktowe wyjątki per test
  weryfikujące ścieżkę reduce są dozwolone — oznaczaj je komentarzem.
- a11y (axe): allowlista znanych naruszeń w `tests/e2e/a11y.spec.ts` to
  RATCHET — startujemy od PUSTEJ; wpis wolno usunąć po realnej poprawie;
  nowych nie dopisuj bez decyzji Mateusza.
- LHCI: budżety wystartują z pomiaru pierwszej działającej strony głównej
  (Etap 3), Z ZAPASEM na przyrost sekcji; potem działają jako ratchet —
  progi podnosimy wolno, tylko świadomą decyzją Mateusza (osobny commit).
- Test mediów R2 (`CHECK_REMOTE_MEDIA=1`) tylko poza ścieżką PR
  (zewnętrzna sieć = flaky).
- Wersje `playwright` i `@playwright/test` podnoś PARĄ (jeden zestaw
  binariów); bump = też tag obrazu Dockera w procedurze baseline'ów.
- Profile Playwright: 6 (chromium-1920/1366, firefox, webkit-SE/14,
  pixel-5). Breakpoint delung 1024 px ⇒ iPhone'y i Pixel zawsze dostają
  widok mobile, chromium-1366/1920 desktop.

## Czego emulacja NIE wykrywa → fizyczne urządzenie

Limit warstwy GPU Androida (karuzele/sheety); iOS Low Power Mode (wideo
na tap ma działać); zwijany toolbar Safari (metryki viewportu / późny
refresh); zimny cache + realne łącze; dotyk fizyczny (snap karuzel,
swipe-down sheetów, feel natywnego scrolla). Przy zmianach w tych obszarach
poproś Mateusza o test na telefonie i wskaż, na co patrzeć.
