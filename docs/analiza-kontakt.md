# Analiza — `/kontakt/` + formularz (Etap 5)

Ostatni widok dziedziczony z szablonu przechodzi na design delung, a wraz
z nim spłacamy trzy długi wypisane w instrukcji: ciemny motyw
(`legacy-dark.css`), breakpoint 861 px i placeholder klucza Turnstile.
Backend (`functions/api/kontakt.ts` + `src/lib/contact-form.ts`) jest
gotowy — logiki nie przepisujemy, dokładamy do niej wyłącznie to, czego
wymaga formularz z designu (pole telefonu) i realna domena nadawcza
Resend.

Referencje: `docs/design/kontakt.html` (1:1), `docs/analiza-chrome-globalny.md`
(D-CH3 wariant `over`, **D-CH5 antyscraping**, D-CH7 stopka/socials, D-CH9),
`docs/analiza-proces-onas-polityka.md` (D-P3 duplikaty per-breakpoint,
D-P5 motion-gate, D-P8 wzorzec docelowy antyscrapingu na slotach),
`docs/analiza-strona-glowna.md` (D-SG8 banner `#contact` — NIE ruszamy),
`.claude/rules/sections.md`, `.claude/rules/testing.md`,
`.claude/rules/scroll-lenis.md`, `docs/delung-web-creation-process.md`
(Część B §Etap 5).

**Rozstrzygnięcia Mateusza (2026-08-01)** — cztery decyzje wymagające
jego zdania zapadły zgodnie z rekomendacjami: **D-K4** (pola wg designu:
telefon opcjonalny wchodzi, chipsy tematu wypadają), **D-K6** (toasty
usuwamy — zostaje panel `.sent` i błąd inline), **D-K14 + D-K1** (pełne
sprzątanie z wyjściem GSAP-a, osobny PR B), **D-K9** (`/kontakt/` zostaje
na scrollu natywnym). Alternatywy opisane niżej są ZAMKNIĘTE.

---

## 1. Co mówi eksport (anatomia widoku)

`kontakt.html`: navbar `data-nav="over"` w tonie **jasnym** (blok
`.hdr.dark` nie istnieje w tym eksporcie — po scrollu wjeżdża białe tło,
jak na stronie głównej). Kolejność sekcji sterowana `order` na `main`:
mobile `hero → cards → soc → form`, desktop `hero → cards → form → soc`.

| Blok | Mobile (<1024) | Desktop (≥1024) |
| --- | --- | --- |
| `hero` | tekstowy na bieli: kicker „KONTAKT", h1 „Skontaktuj się z nami" (29–38 px), kreska 44 px, lead | pas 455–640 px: zdjęcie `kaszmir-wood1` **rozmyte** `blur(8px)` + tint `rgba(22,19,16,.58)`, treść wyśrodkowana na biało, h1 62–88 px, bez kreski |
| `cards` | 4 wiersze rozdzielone hairline'ami: ikona w kółku + etykieta + wartość (+ strzałka na linkach) | 4 kafle w gridzie, **wjeżdżają na hero** ujemnym marginesem (`-70…-92 px`), białe karty z cieniem `0 16px 44px`, hover: kółko ikony zielone; strzałka ukryta |
| karty (treść) | TELEFON → `tel:`; E-MAIL → `mailto:`; ADRES → Google Maps (Strażacka 27a, 98-300 Gaszyn); DOSTĘPNOŚĆ (nie-link) | te same + dopiski `dOnlyI` („· 24/7", „· PRACOWNIA", „TELEFONICZNA") i dłuższy tekst dostępności |
| `soc` | pigułki obwódkowe Instagram + Facebook, wyrównane do lewej, pod kartami | te same wyśrodkowane, **pod** formularzem |
| `form` | sekcja na tle `#eae5dd` (cream), pola z podkreśleniem (`border-bottom`), 1 kolumna, przycisk pełną szerokością z cieniem | biała karta 980 px z cieniem na białym tle, nagłówek wyśrodkowany (kicker zielony + h2 „Zostaw wiadomość"), pola w gridzie 2×2 na tle cream z `border-radius: 6px`, zielona linia `.fline` przy focusie, przycisk wyśrodkowany |
| pola | IMIĘ I NAZWISKO · TWÓJ NUMER TELEFONU · TWÓJ E-MAIL (full) · W CZYM MOŻEMY CI POMÓC? (textarea, full) | jw. (`.full` = `grid-column: span 2`) |
| stopka | wspólny `ft` (chrome 4.1) | jw. |

Eksportowy „formularz" jest atrapą (klik zmienia etykietę przycisku na
2,6 s). Mechanikę bierzemy z szablonu, skórkę — z designu.

---

## 2. Stan wejściowy — inwentarz (co zostaje, co znika)

| Plik | Los |
| --- | --- |
| `functions/api/kontakt.ts` | **zostaje**; +1 pole (`phone`) w mapowaniu formData |
| `src/lib/contact-form.ts` | **zostaje**; +`phone` w walidacji i mailu #1, adresy nadawcy na `send.delung.pl` (D-K13) |
| `src/lib/contact-details.ts` | **zostaje** — jedyne źródło fragmentów tel/mail (D-K5) |
| `src/components/sections/contact/Contact.astro` (1191 l.) | **kasacja** — markup wariantu „Split" szablonu |
| `.../contact-scroll.ts` (GSAP) | **kasacja** → `contact-motion.ts` bez GSAP |
| `.../contact-ui.ts` | **przepisany**: zostaje walidacja/pułapki/Turnstile/POST, znika reveal `[POKAŻ]`, chipsy i toasty |
| `.../contact-config.ts` | **przycięty**: `CONTACT_DESKTOP_MIN_PX` 861→**1024**, endpoint, Turnstile (realny site key); stałe scen GSAP i `KTB_ZOOM_FROM` wylatują |
| `ContactPage.astro` | **przepisany**: `Navbar variant="over"` + sekcje + `Footer`, bez `legacy-dark`/ambientu |
| `src/styles/legacy-dark.css` | **kasacja** (po porcie zero importów — grep kontrolny w PR) |
| `src/components/backgrounds/**`, `scripts/capture-ambient-bg.mjs`, `public/ambient-bg-mobile-*.webp` | **kasacja** — ostatni konsument to ta strona |
| `src/scripts/section-helpers.ts`, `src/scripts/bg-crossfade.ts` | **kasacja** — po `contact-scroll.ts` zero konsumentów |
| `src/components/ui/{AnimatedCta,SplitCta,OfertaButtons,SolidButton}.astro` | **kasacja** — martwe od 4.3 (zero importów) |
| `src/components/ui/toast/**` + `<Toast />` w `BaseLayout` | **kasacja**, jeśli przyjmiesz D-K6 (jedyny konsument = kontakt) |
| `gsap` (dependency) | **wypada z projektu** po D-K14 (ostatni konsument: `smooth-scroll.ts`) |
| `src/components/ui/BackButton.astro`, `scripts/back-link.ts` | **zostają** uśpione (D-CH8) |

---

## 3. Decyzje portu

### D-K1. Dwa PR-y: widok, potem porządki

- **PR A — widok + formularz**: sekcje, `ContactPage`, przepisany
  `contact-ui.ts`, `contact-motion.ts`, kasacja `Contact.astro`/
  `contact-scroll.ts`/`legacy-dark.css`/ambientu, backend `phone`,
  testy e2e/unit, oba komplety baseline'ów.
- **PR B — porządki i bundle**: kasacja martwych komponentów UI,
  `section-helpers.ts`, `bg-crossfade.ts`, (toast — D-K6) oraz **wyjście
  GSAP-a z projektu** (D-K14). Osobno, bo rusza bundle KAŻDEJ strony
  i chcę mieć czysty pomiar LHCI przed/po.

Alternatywa: wszystko w jednym PR-ze (szybciej, ale diff robi się
gruby i trudniej wskazać winnego, gdyby LHCI drgnęło).

### D-K2. Struktura plików (wzorzec 4.2–4.5)

```
src/components/sections/contact/
  ContactHero.astro     ContactCards.astro
  ContactForm.astro     ContactSoc.astro
  contact-config.ts     (CONTACT_DESKTOP_MIN_PX = 1024 — importują testy)
  contact-ui.ts         (funkcje: zawsze)
  contact-motion.ts     (ruch: za bramką js-motion)
```

`ContactPage.astro` = `BaseLayout` + inline bramka `js-motion` +
`Navbar variant="over"` + `main` + `Footer` (dokładnie jak `ProcesPage`).
Prefiks klas **`kt-`** dla całego widoku (`kt-hero`, `kt-card`,
`kt-form`, `kt-send`…) — design ma nazwy generyczne (`card`, `field`,
`send`), a `kt-` trzyma namespace sekcji i kontrakt testów.

### D-K3. Kolejność DOM: duplikat `soc` per-breakpoint zamiast `order`

Eksport przestawia sekcje CSS-owym `order` — to rozjeżdża kolejność
tabulacji z kolejnością wizualną na jednym z breakpointów. Zamiast tego
(wzorzec D-P3): DOM = `hero → cards → soc(mOnly) → form → soc(dOnly)`,
duplikat pigułek renderowany dwa razy, nieaktywny wariant na
`display: none` (znika też z drzewa dostępności — jeden egzemplarz na
raz). Blok ma 1 link (D-K12), więc duplikat jest tani.

### D-K4. Pola formularza wg designu: **telefon wchodzi, chipsy tematu wypadają**

Design ma 4 pola (imię, telefon, e-mail, wiadomość) i nie ma chipsów
tematu z szablonu. Propozycja:

- **`phone` — nowe pole, opcjonalne.** Kontrakt rozszerzony minimalnie:
  `contact-form.ts` dostaje `PHONE_MAX = 40`, przycina i wpuszcza cokolwiek
  niepustego (numery bywają pisane na 10 sposobów — twarda regexpa robi
  tylko fałszywe odrzuty), pole ląduje w mailu #1 (`Telefon: … / —`).
  Walidacja kliencka: **żadna** (pole nieobowiązkowe). Endpoint dokłada
  `field("phone")`. Unit testy `contact-form.test.ts` — dwa przypadki.
- **Chipsy tematu (`temat`) znikają z widoku.** Serwerowy kontrakt
  zostawiam nietknięty (`temat: ""` jest legalną wartością od początku,
  mail pokazuje „—"), więc backend i jego testy nie drgną, a powrót pola
  w przyszłości to jeden `<select>`.

Alternatywa: zachować chipsy jako świadomą dewiację od designu (czterech
tematów nie ma w eksporcie żadnego breakpointu — byłoby to wstawką
z szablonu).

### D-K5. Antyscraping: sloty `contact-details.ts`, maskowane, BEZ `hidden`

`[ POKAŻ ] / [ KOPIUJ ]` z szablonu **znika** (design pokazuje dane
wprost). Karty telefonu i e-maila to kotwice `[data-tel]`/`[data-mail]`
z placeholderowym `href="/kontakt/"` i **zamaskowaną** wartością
w `[data-slot]` (`+48 ••• ••• •••`, `••••••@••••••.••`) — `fillContactSlots`
podmienia tekst i href po załadowaniu. Świadoma różnica względem chrome'u:
karty **nie startują `hidden`** (4 kafle wjeżdżające na hero — znikające
dwa dałyby skok layoutu); maska trzyma wysokość, a statyczne źródło dalej
nie zawiera pełnych ciągów. Adres i Google Maps zostają jawne (adres jest
jawny również w stopce).

Konsekwencja: `contact-ui.ts` traci własną kopię fragmentów (`FR`) —
domknięcie zapowiedzi z nagłówka `contact-details.ts`.

### D-K6. Potwierdzenie i błędy: panel `.kt-done`, toasty do kasacji

Design ma tylko podmianę etykiety przycisku na 2,6 s — dla realnego
formularza to za mało (użytkownik nie wie, czy mail poszedł). Zostawiam
mechanikę szablonu w skórce designu:

- sukces → karta formularza przechodzi w stan `.sent`: panel
  `role="status"` („Wiadomość wysłana…") + `[ Wyślij kolejną ]`
  (reset pól i zegara antyspamu),
- błąd → trwały komunikat `.kt-srv` (`role="alert"`) z fallbackiem
  „napisz bezpośrednio", formularz dalej aktywny,
- **toasty usuwam w całości** (`ui/toast/**` + `<Toast />` z `BaseLayout`):
  duplikują panel i komunikat, a `BaseLayout` przestaje je wozić na
  wszystkich stronach. Znikają 2 testy toastów z `contact.spec.ts`.

Alternatywa: zostawić toasty (koszt ~1,3 kB gz i jeden komponent więcej
do utrzymania).

### D-K7. Navbar `over` (ton jasny) + tło hero z reuse'u

`Navbar variant="over"` bez `tone="dark"` (eksport nie ma `.hdr.dark`),
`data-navref` na hero. Tło desktopowego hero = ten sam kadr kaszmiru, co
banner `#contact` i sheet menu — **reuse `src/assets/home/ko-bg.webp`**
(rozmycie `blur(8px)` i tak zjada detal; wzorzec „reuse ko-bg" z 4.3).
Zero nowych assetów w tym etapie. Mobile hero jest tekstowy — obraz
renderowany tylko w gałęzi desktop (`dOnly`), żeby telefon go nie pobierał.

### D-K8. Breakpoint 1024 — stała + `@media` w parze

`CONTACT_DESKTOP_MIN_PX = 861 → 1024` (`contact-config.ts`), literały
`@media (min-width: 1024px)` w sekcjach, testy importują stałą (już to
robią). Przy okazji z configu wylatują stałe scen GSAP i `KTB_ZOOM_FROM`
(banner strony głównej ma własne wartości od 4.2).

### D-K9. Lenis: zostaje **wyłączony** (`smoothScroll={false}`)

Utrzymuję decyzję z migracji podstrony: formularz najlepiej czuje się bez
pośrednika (fokus pól, dojazd do błędnego pola, klawiatura ekranowa),
a strona jest krótka — Lenis nie ma tu czego wygładzać. `/kontakt/`
zostaje (obok `/kategorie/`) widokiem na scrollu natywnym; test
`data-smooth-scroll="off"` w `contact-index.spec.ts` zostaje bez zmian.

### D-K10. Ruch: `contact-motion.ts` za bramką, funkcje zawsze

`contact-ui.ts` (walidacja, pułapki, Turnstile, POST, sloty) ładowany
ZAWSZE — to funkcja, nie dekoracja. `contact-motion.ts` (mobilne
`data-rev`, desktopowy parallax tła hero `data-par`, wejście kart)
dynamicznie, tylko przy `prefers-reduced-motion: no-preference`; stany
startowe pod `html.js-motion` (inline przed paintem). Zielona linia
`.fline` i podświetlenie etykiety przy focusie to czysty CSS
(`:focus-within`) — działają też przy reduce, bo to informacja o stanie
pola, nie dekoracja.

### D-K11. Dostępność i drobny druk (pusta allowlista axe zostaje pusta)

- Etykiety pól `rgba(26,26,26,.5)` z eksportu → **`--faint` (0,64)**;
  zielony kicker formularza `#2F8F5B` → **`--accent-ink`**; placeholdery
  `.35` → `.55` (axe sprawdza też placeholder).
- Wszystkie pola w `<label for>` (design ma `<label class="field">`
  z wewnętrznym `<span>` — dokładam `for`/`id`), `autocomplete`:
  `name` / `tel` / `email`, `inputmode="tel"` na telefonie.
- **`font-size: 16px` minimum na polach mobile** — clamp z eksportu
  schodzi do 15 px przy 360 px szerokości, a Safari iOS zoomuje stronę
  przy focusie pola < 16 px (i zostawia ją zoomniętą).
- Widoczny `:focus-visible` na kartach, pigułkach i przycisku (design nie
  definiuje — dokładam wzorcem z pozostałych widoków).

### D-K12. Socials: tylko Instagram

Eksport ma pigułki Instagram + Facebook z `href="#"`. Zgodnie z D-CH7
(stopka: „IG `delung_meble`, bez FB") zostawiam **sam Instagram** —
Facebooka firma nie prowadzi, martwa pigułka byłaby obietnicą bez
pokrycia. Layout pigułek bez zmian.

### D-K13. Resend: nadawcy na `send.delung.pl`

Instrukcja weryfikuje w Resendzie **subdomenę** `send.delung.pl` (apeks
zostaje przy skrzynce Zimbra — rozdzielenie poczty transakcyjnej od
firmowej). Resend odrzuci wysyłkę z adresu spoza zweryfikowanej domeny,
więc stałe w `contact-form.ts` muszą się zgodzić:

```
CONTACT_FROM_NOTIFY  = "Formularz delung.pl <no-reply@send.delung.pl>"
CONTACT_FROM_CONFIRM = "Delung Meble <no-reply@send.delung.pl>"
```

`CONTACT_TO` (`kontakt@delung.pl`) i `Reply-To` bez zmian — odpowiedzi
lądują w skrzynce Zimbry. Unit test kontraktu maili aktualizowany.

### D-K14. Wyjście GSAP-a z projektu (PR B) — realny zysk na budżecie

Po kasacji `contact-scroll.ts` ostatnim konsumentem GSAP-a zostaje
`smooth-scroll.ts`, i to w roli, którą pełni zwykły `requestAnimationFrame`:
`gsap.ticker` napędza `lenis.raf()`, a `ScrollTrigger.update/refresh` nie
ma już czego odświeżać (zero ScrollTriggerów w projekcie). Pomiar
z `dist/` po dzisiejszym buildzie:

| Chunk | raw | gzip |
| --- | --- | --- |
| `ScrollTrigger.*.js` (gsap + plugin) | 114 013 B | **44 828 B** |
| `smooth-scroll.*.js` | 18 263 B | 5 360 B |

Budżet skryptów LHCI to **80 000 B przy zmierzonych 67 978 B** — GSAP to
około dwie trzecie całego JS-u strony głównej. Po przejściu Lenisa na
własną pętlę rAF (kilkanaście linii, desktop-only) skrypty „/" spadają
do ~23 kB, a nagłówek `gsap` znika z `package.json`. Zapas na Turnstile
i formularz przestaje być problemem.

**Progów LHCI w tym etapie NIE ruszam** — po merge'u PR B zmierzę main
i przyniosę Ci liczby; zacieśnienie to Twoja decyzja i osobny commit
(kandydat: domknięcie Etapu 5 albo Etap 6).

**WYNIK (pomiar po PR B, `lhci collect` lokalnie na `/`)**: skrypty
**67 978 B → 19 053 B** (−72 %), total 892 752 B → 842 768 B. Budżety
zostają na 80 000 B / 1,2 MB — zapas urósł z 15 % do ponad czterokrotności.
Zacieśnienie czeka na decyzję Mateusza (osobny commit, po pomiarze z CI —
lokalny `lhci` jest miarodajny tylko dla rozmiarów zasobów, nie dla score).

---

## 4. Kroki w chmurze (klikasz Ty) — i kiedy

**Blokują tylko końcową weryfikację, nie kod** — z jednym wyjątkiem:
**site key Turnstile jest mi potrzebny do commita** `contact-config.ts`
(publiczny klucz w kodzie). Dlatego kolejność: kroki 1–2 zaraz po
akceptacji tej analizy (dają mi site key i domenę nadawcy), kroki 3–4
zanim zmergujesz PR A (żeby preview/produkcja realnie wysyłały).

**1. Resend — OSOBNE KONTO KLIENTA + domena `send.delung.pl`**

   Darmowy plan Resend daje **jedną** domenę na konto, a konto Mateusza
   jest zajęte przez hadrianm — druga domena tam wymagałaby płatnego
   planu. Zamiast płacić: **osobne konto Resend na `kontakt@delung.pl`**
   (skrzynka Zimbra z Etapu 1), traktowane jak konto `delung-cms` (D3:
   2FA, recovery codes u Mateusza, przekazanie w Etapie 7). Darmowy tier
   = 100 maili/dobę, czyli powyżej naszego bezpiecznika `DAILY_LIMIT = 80`.
   DNS i tak żyje w Cloudflare Mateusza — konto Resend jest od tego
   niezależne.

   1. Wyloguj się z konta hadrianm (albo okno prywatne) → `resend.com` →
      **Sign up** na `kontakt@delung.pl` → potwierdź mail ze skrzynki →
      ustaw 2FA, recovery codes do menedżera haseł Mateusza.
   2. **Domains** → **Add Domain** → wpisz `send.delung.pl`,
      region **EU (Ireland)** → **Add**.
   3. Resend pokaże 3–4 rekordy (MX + TXT SPF dla subdomeny, TXT DKIM,
      opcjonalnie DMARC). W Cloudflare: `delung.pl` → **DNS** → **Add record**
      dla każdego, **1:1 kopiuj/wklej**, Proxy **DNS only** (szara chmurka),
      TTL Auto. **Nie ruszaj rekordów apeksu** (`@`) — tam siedzi Zimbra.
   4. Wróć do Resend → **Verify DNS Records** → poczekaj na „Verified"
      (zwykle minuty).
   5. **API Keys** → **Create API Key** → nazwa `delung-kontakt`,
      permission **Sending access**, domena `send.delung.pl` → skopiuj klucz
      (pokazuje się RAZ) — wklejasz go w kroku 4, mnie nie pokazuj.

**2. Turnstile — widget `delung-kontakt`**
   1. Cloudflare dash → **Turnstile** → **Add widget**.
   2. Name `delung-kontakt`; Hostnames: `delung.pl`, `www.delung.pl`
      oraz `delung-web.pages.dev` (podglądy PR-ów); Widget Mode **Managed**.
   3. **Create** → skopiuj **Site Key** (publiczny — **przyślij mi go**)
      i **Secret Key** (wklejasz w kroku 4).

**3. KV — namespace i binding**
   1. Cloudflare dash → **Storage & Databases → KV** → **Create instance**
      → nazwa `delung-kontakt-quota` → **Create**.
   2. **Workers & Pages** → projekt `delung-web` → **Settings** →
      **Bindings** → **Add** → **KV namespace**: Variable name
      **`KONTAKT_KV`**, KV namespace `delung-kontakt-quota` → **Save**.
      Dodaj binding dla **Production** i **Preview**.

**4. Zmienne środowiskowe Pages**
   1. Ten sam ekran → **Variables and Secrets** → **Add**:
      `RESEND_API_KEY` = klucz z kroku 1.4, typ **Secret** (Encrypt).
   2. `TURNSTILE_SECRET_KEY` = secret z kroku 2.3, typ **Secret**.
   3. Powtórz dla środowiska **Preview** (te same wartości).
   4. **Save** → nowy deploy podchwyci zmienne (albo **Deployments** →
      **Retry deployment** na ostatnim).

**5. WAF — hamulec na `/api/kontakt` (opcjonalny, rekomendowany)**
   `smoke.spec.ts` już zakłada istnienie reguły `kontakt-form-burst`
   (dlatego sonda endpointu biega tylko na jednym profilu). Cloudflare →
   `delung.pl` → **Security → WAF → Rate limiting rules** → **Create rule**:
   nazwa `kontakt-form-burst`, dopasowanie `URI Path equals /api/kontakt`
   **AND** `Request Method equals POST`, licznik po IP, **3 żądania / 10 s**,
   akcja **Block**, czas trwania 60 s. Chroni dzienny limit Resend zanim
   dojdzie do bezpiecznika KV.

**Pułapka przy przepisywaniu rekordów DNS**: Cloudflare dokleja nazwę
strefy do pola *Name*. Wpisując `send` dostaniesz `send.delung.pl` — pod
polem widać finalną nazwę, sprawdź, czy `delung.pl` nie powtarza się
dwa razy. Rekordy Resend dotyczą WYŁĄCZNIE subdomeny `send` — jeśli
Cloudflare ostrzega o kolizji z istniejącym rekordem apeksu (Zimbra:
MX/SPF/DKIM/DMARC), przerwij i zapytaj, zamiast nadpisywać.

Po merge'u PR A: wchodzisz na `delung.pl/kontakt/`, wysyłasz jedną realną
wiadomość i sprawdzasz, czy przyszły **oba** maile (powiadomienie na
`kontakt@delung.pl` + auto-potwierdzenie na Twój adres) — tego prod-smoke
nie sprawdza (posyła wyłącznie honeypota, żeby nie zasypywać skrzynki).

---

## 5. Kontrakty selektorów i testów

| Selektor | Rola |
| --- | --- |
| `main h1` (hero) | smoke + a11y (jedyny h1 na stronie) |
| `#contact` | sekcja formularza (**nie** cała strona) — smoke/navigation: `#contact .kt-form` |
| `.kt-form`, `.kt-send`, `.kt-srv`, `.kt-done`, `.kt-done .again` | mechanika formularza |
| `#kt-name`, `#kt-phone`, `#kt-email`, `#kt-msg`, `#kt-firma` | pola (honeypot dalej `name="firma"`, `readonly`) |
| `.kt-card[data-tel]`, `.kt-card[data-mail]` + `[data-slot]` | antyscraping (D-K5) |
| `.kt-cards .kt-card` (4), `.kt-soc a` (1 na breakpoint) | kompletność widoku |
| `.ft` w chrome strony | stopka (asercja `.ktp-foot .ft` → `.ft`, wrapper znika) |

---

## 6. Plan implementacji (PR A)

1. `contact-config.ts`: 1024, realny site key, czystka stałych.
2. `contact-details.ts` bez zmian; `ContactCards` konsumuje sloty.
3. Sekcje `ContactHero/Cards/Form/Soc` — port CSS 1:1 (wartości
   `clamp()` z eksportu), tokeny `--pad`/`--col` z `global.css`.
4. `ContactPage.astro` — navbar `over`, bramka `js-motion`, `smoothScroll={false}`.
5. `contact-ui.ts` — przepisany (walidacja 3 pól + opcjonalny telefon,
   pułapki, Turnstile lazy na `focusin`, POST, `.sent`, `.kt-srv`).
6. `contact-motion.ts` — `data-rev` mobile + parallax hero desktop.
7. Backend: `phone` w `contact-form.ts` + `functions/api/kontakt.ts`,
   nadawcy na `send.delung.pl`.
8. Kasacje: `Contact.astro`, `contact-scroll.ts`, `legacy-dark.css`
   (grep!), ambient (komponent + paleta + skrypt + 2 pliki w `public/`
   + wpis w `package.json` + reguła `capture-scripts.md`).
9. Testy + baseline'y (§7–8).
10. `docs/README.md` + `CLAUDE.md` (na końcu PR-a).

PR B: martwe `ui/*`, `section-helpers.ts`, `bg-crossfade.ts`, toasty
(D-K6), Lenis bez GSAP + `pnpm remove gsap`, aktualizacja
`.claude/rules/scroll-lenis.md` i `sections.md`.

---

## 7. Testy

**unit** — `contact-form.test.ts`: telefon (pusty / przycięty / za długi),
nadawcy `send.delung.pl` w treściach maili. `contact-details.test.ts` bez zmian.

**e2e `contact.spec.ts`** (przepisany, zegar i stub Turnstile zostają):
walidacja 3 pól + fokus na pierwszym błędnym; telefon opcjonalny (submit
przechodzi pusty, wartość ląduje w payloadzie); pułapka „za szybko";
pułapka honeypota + strażnik `readonly`; mock 200 → `.sent` + payload
(`lang`, `elapsed`, token, `phone`); mock 500 → `.kt-srv` + retry;
`[ Wyślij kolejną ]`; **sloty tel/mail** (href + `[data-slot]` po JS);
antyscraping (surowy HTML + grep `dist/`); `dOnly/mOnly` per breakpoint;
reduce → formularz działa; bez JS → treść widoczna, wartości zamaskowane.
Wypadają: reveal `[POKAŻ]`, chipsy, 3 testy toastów.

**e2e `contact-index.spec.ts`**: asercje sekcji (`.kt-rev`/`.kt-chip` →
karty i pola), `.ktp-foot .ft` → `.ft`; describe „banner na stronie
głównej" **nietknięty**.

**e2e reszta**: `a11y` (trasa już na liście — ma przejść bez nowych
wpisów), `smoke`/`navigation` bez zmian (kontrakt `#contact .kt-form`
spełniony), `seo` bez zmian.

**visual `tests/visual/contact-index.spec.ts`** — przepisany, 6 profili:
`contact-top` (hero + navbar + wjazd kart), `contact-cards`,
`contact-form` (stan spoczynkowy), `contact-soc`, `contact-footer`.
Stare baseline'y `contact-index-{top,form,footer}` kasujemy.

---

## 8. Baseline'y wizualne — święta kolejność

Kod → workflow **„Update linux visual baselines"** z brancha PR-a
(Actions → Run workflow → branch) → `git pull` → lokalnie
`pnpm test:visual:update` → commit darwin **na końcu**. Diff pokazuję
Ci przed aktualizacją. Baseline'y innych widoków nie powinny drgnąć
(zmiany dotyczą wyłącznie `/kontakt/`); jeśli drgną — to sygnał, że coś
wyciekło globalnie i wracam do kodu zamiast regenerować.

---

## 9. Ryzyka i weryfikacja na fizycznym telefonie

| Ryzyko | Mitygacja |
| --- | --- |
| Turnstile Managed pokazuje wyzwanie na słabym łączu / w trybie prywatnym | `TURNSTILE_TIMEOUT_MS = 90 s` zostaje; brak tokenu → 403 i komunikat z fallbackiem na e-mail |
| Klawiatura ekranowa + sticky navbar zasłaniają aktywne pole | pola w normalnym flow, `scroll-margin-top: var(--hdr-h)`; do sprawdzenia na urządzeniu |
| iOS zoomuje przy focusie pola < 16 px | minimum 16 px na mobile (D-K11) |
| Autofill Chrome wypełnia honeypota | `readonly` + zdejmowanie na `focus` (strażnik w teście) |
| Wysyłka z niezweryfikowanej domeny → 403 Resend | D-K13 + realny test wysyłki po merge'u |
| Kafle wjeżdżające na hero na wąskich ekranach 1024–1100 px | ujemny margines z `clamp()` eksportu; sprawdzę na chromium-1366 |

**Do sprawdzenia na fizycznym telefonie po merge'u**: (1) wypełnienie
całego formularza kciukiem — czy klawiatura nie zakrywa pola i przycisku;
(2) realna wysyłka na LTE (nie Wi-Fi) — czy Turnstile nie wisi;
(3) tap w kartę TELEFON (czy dzwoni) i E-MAIL (czy otwiera klienta
pocztowego) — sloty składane w JS; (4) iOS: czy po tapnięciu w pole
strona nie zostaje zoomnięta.

---

## 10. Definition of done (Etap 5)

Mini-analiza + wpis w `docs/README.md`; lokalnie zielone `format:check`,
`lint`, `typecheck`, `test:unit`, `test:e2e` (6 profili),
`build && test:visual`; oba komplety baseline'ów w PR; **zero nowych
wpisów w allowliście axe**; breakpoint 1024 w widoku kontaktu;
`legacy-dark.css` skasowany (grep w opisie PR-a); realny site key
Turnstile w configu; PR zielony na `quality` + `e2e` + `lighthouse`;
po merge'u `prod-smoke` zielony **i** ręczny test realnej wysyłki
(oba maile); `CLAUDE.md` zaktualizowane („Etap 5 — WYKONANY" + data +
numery PR-ów, sekcja „dziedzictwo szablonu" **wykasowana jako spłacona**).
