# Indeks dokumentacji — status plików

> Konwencja jak w hadrianm-web: każdy plik `.md` bezpośrednio w `docs/` ma tu
> wpis ze statusem. **Dodajesz nowy plik do `docs/`? Dopisz go tutaj.**
> Zmieniasz decyzję opisaną w którymś dokumencie? Zaktualizuj jego
> status/adnotacje i ten indeks.
>
> Podkatalog `design/` = referencje designów (eksporty HTML) — poza indeksem,
> patrz `design/README.md`.

## ✅ Aktualne — źródła prawdy

| Plik | Czego dotyczy |
| --- | --- |
| `delung-web-entrance-analysis.md` | **Analiza wejściowa** projektu delung.pl: decyzje podjęte (tabela §2 + D1–D8), architektura docelowa, różnice względem hadrianm.pl, schemat CMS, routing/SEO, ryzyka |
| `delung-web-creation-process.md` | **Instrukcja wykonawcza** budowy strony: Część A (checklista), Część B (Etapy 0–7 krok po kroku), Część C (flow mediów klienta — D1), Część D (opcje backupowe) |
| `daily-workflow.md` | **Codzienny proces pracy** (instrukcja operacyjna, od Etapu 1): feature branch → `/test` → PR → checki → merge → auto-deploy + prod smoke; przypadki specjalne (baseline'y, CMS, hotfix); nota o enforcement rulesetu (repo prywatne na Free) |
| `etap-4-prompty.md` | **Prompty startowe Etapu 4** (części 4.1–4.5, jedna sesja = jedna część): kontekst wspólny (lekcje Etapu 3, podział ról, definition of done), prompt per część, szablon promptu korekty po testach manualnych |
| `analiza-chrome-globalny.md` | **Mini-analiza części 4.1** (chrome globalny): decyzje portu navbara (sticky, warianty `plain`/`over`, 4 pozycje menu), menu mobile jako bottom sheet na `overlay.ts`, stopka `ft` z dewiacjami (IG desktop, polityka mobile, kontrasty AA), BackButton POZA chrome (decyzja: brak w designach, logika `data-back` uśpiona), kontrakty selektorów testów |
| `analiza-strona-glowna.md` | **Mini-analiza części 4.2** (strona główna): hero mobile/desktop (kadry + typografia SVG, h1 dla smoke), sceny przypięte oferta/realizacje bez GSAP (`home-scroll.ts`, motion-gate), zajawki z danych lokalnych + kolekcji realizacji (Modal/BottomSheet), opinie/kontrasty pod ratchet axe, banner `#contact` z antyscrapingiem D-CH5, plan testów i baseline'ów |
| `analiza-oferta-kategorie.md` | **Mini-analiza części 4.3** (/oferta/ + /kategorie/): treści oferty kluczowane slugami `categories.ts` (6 kategorii, `inne` bez treści), desktop ARIA tabs + animacje panelu w CSS (bez GSAP), mobile karuzela 3+1 wg gotchas, karta kategorii = 6 pre-renderowanych sheetów na `overlay.ts`, CTA realizacji z `categoryLabel()` bez deep-linku (filtr = 4.4), kontrasty pod ratchet axe, redirect /kategorie/ nietknięty |
| `analiza-proces-onas-polityka.md` | **Mini-analiza części 4.5** (/proces-wspolpracy/ + /o-nas/ + /polityka-prywatnosci/, po jednym PR na widok + PR porządkowy): navbar `over` w tonie ciemnym (`hdr dark` z eksportów — korekta ustaleń 4.1), duplikaty per-breakpoint zamiast relokacji JS, wspólny moduł danych opinii (`src/lib/opinie.ts`), pełny port layoutu polityki `pp-*` z przejściem antyscrapingu na `contact-details.ts`, kasacja SkeletonPage, domknięcie etapu (legacy-dark zostaje dla kontaktu, zacieśnienie LHCI) |
| `analiza-kontakt.md` | **Mini-analiza Etapu 5** (`/kontakt/` + formularz): port widoku na design delung (hero `over`, kafle kontaktowe wjeżdżające na hero, karta formularza), pole telefonu zamiast chipsów tematu, antyscraping na slotach `contact-details.ts` (koniec `[ POKAŻ ]`), kasacja `legacy-dark.css` i ambientu, nadawcy Resend na `send.delung.pl`, wyjście GSAP-a z projektu (Lenis na rAF — ~45 kB gz mniej), kroki w chmurze (Resend/Turnstile/KV/env) |
| `analiza-realizacje.md` | **Mini-analiza części 4.4** (/realizacje/): filtry SSR+JS (puste kategorie ukryte, bez re-empty/paginacji), deep-link filtra `/realizacje/#<slug>` (domknięcie D-OK6, nadawcy z 4.3 podpięci), detal = JEDEN overlay `#work-detail` (CSS modal↔sheet przy 1024 — `sheetMQ`/760 znika, kasacja ui/Modal+BottomSheet), galeria snap/translateX + wideo na tap (preload=none, badge play, duration), projnav z kontekstem listy, kontrasty pod ratchet axe |
