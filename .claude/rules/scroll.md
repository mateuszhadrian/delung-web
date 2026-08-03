---
paths:
  - "src/scripts/overlay.ts"
  - "src/layouts/BaseLayout.astro"
  - "tests/helpers/scroll.ts"
---

# Scroll — reguły

**Scroll w serwisie jest NATYWNY, wszędzie i na każdym urządzeniu.**
Żadna biblioteka nie pośredniczy w kółku ani w dotyku; strażnikiem jest
test „scroll jest natywny" w `tests/e2e/oferta.spec.ts`.

## Dlaczego Lenis wyszedł z projektu (D-Q1, runda poprawek 2)

- Objaw: na stronie głównej w Safari na macOS scroll strasznie klatkował,
  ale **wyłącznie dopóki widać było pierwszy ekran**. Chrome bez problemu,
  Firefox ledwo zauważalnie.
- Sesja pomiarowa (15 wariantów na fizycznym MacBooku, protokół w
  `docs/analiza-poprawki-2.md`) ustaliła: koszt to **duże zdjęcie
  przycinane maską w kształcie liter** w typografii hero. Osobno maska
  i zdjęcie są tanie, razem są drogie do PRZEMALOWANIA — a przemalowanie
  zdarzało się przy każdej zmianie pozycji scrolla, bo Lenis pchał scroll
  JS-em klatka po klatce. Przy scrollu natywnym robi to kompozytor
  i koszt znika.
- Żadna zmiana po stronie hero nie pomagała (przycięcie powierzchni,
  rozdzielenie animacji od filtra, uproszczenie poświaty, promocja
  warstwy) — wszystkie zmierzone, wszystkie nieskuteczne.
- Funkcjonalnie nic od Lenisa nie zależało: blokada scrolla nakładek ma
  natywną ścieżkę (`overlay.ts`), a `/kategorie/` i `/kontakt/` jeździły
  natywnie od Etapów 4.3/5. Na dotyku Lenisa nigdy nie było (decyzja 4.2).
- Zysk uboczny: −5,3 kB gz (największy pojedynczy chunk JS w projekcie)
  i jedno zachowanie scrolla zamiast dwóch zależnie od trasy.

**Przy ewentualnym powrocie jakiegokolwiek wygładzacza** trzeba wrócić
do tego pomiaru: koszt nie był w bibliotece, tylko w spotkaniu JS-owego
scrolla z drogą do przemalowania warstwą. Wróci wygładzacz — wróci
klatkowanie hero.

## Konsekwencje w kodzie

- `BaseLayout` nie ma już propa `smoothScroll` ani atrybutu
  `data-smooth-scroll` — nie ma czego przełączać.
- Markup nie niesie atrybutów `data-lenis-prevent*` (były podpowiedzią dla
  biblioteki). Kontrakt karuzel to dziś **`scroll-snap-stop: always`**
  i on zostaje.
- `overlay.ts` blokuje scroll `body { position: fixed }` + zapamiętana
  pozycja, a odblokowuje natywnym `window.scrollTo`. Ta ścieżka jest
  jedyna — nie ma gałęzi alternatywnej.
- Postęp `--p` navbara (wariant `over`) dogania cel **własną pętlą rAF**
  (lerp 0.18). To rekompensata za wyjście Lenisa: Safari dostarcza
  zdarzenia `scroll` rzadziej, niż przewija (async scrolling), więc bez
  wygładzania przejście przezroczysty → biały robiło się skokowe.
  Wygładzany jest WYŁĄCZNIE pasek (dekoracja) — sceny przypięte czytają
  prawdziwą pozycję scrolla i muszą trzymać się jej co do piksela.
- Handler `pageshow` z `e.persisted` odszedł razem z Lenisem (przywracał
  jego geometrię po bfcache). Gdyby wróciły problemy z powrotem przez
  bfcache na iOS — szukać tu.
