DELUNG MEBLE — EKSPORT RESPONSYWNY (HTML + zdjęcia)
===================================================

Każdy plik to jedna samodzielna strona: mobile i desktop w jednym dokumencie.
Breakpoint: 1024 px. Poniżej 1024 = widok mobilny (wzorzec 390 px), od 1024 = desktop (wzorzec 1440 px).
Wymiary są proporcjonalne (clamp / vw / % / aspect-ratio), więc stany pośrednie skalują się płynnie,
a przy 390 px i 1440 px proporcje odpowiadają makietom.

PLIKI I ICH ŹRÓDŁA W CLAUDE DESIGN
  oferta.html                    <- "Delung Para Oferta.dc.html" = widok desktop + pierwszy widok mobilny (lista kategorii)
  kategorie.html                 <- "Delung Para Oferta.dc.html", widok "MOBILE 390 × 844 · karta kategorii"
                                    (TYLKO mobile — bez breakpointu desktopowego)
  index.html                     <- "Delung Para Strona Glowna.dc.html" = desktop/"Delung Desktop Strona Glowna.dc.html" + mobile/"Delung Strona Glowna Mobile.dc.html" (wariant 1f)
  kontakt.html                   <- "Delung Para Kontakt.dc.html" = desktop/"Delung Desktop Kontakt.dc.html" + mobile/"Delung Kontakt Mobile Symulacja.dc.html"
  o-nas.html                     <- "Delung Para O Nas.dc.html" = desktop/"Delung Desktop O Nas.dc.html" + mobile/"Delung O Nas Mobile.dc.html"
  polityka-prywatnosci.html      <- "Delung Para Polityka Prywatnosci.dc.html" = desktop/"Delung Polityka Prywatnosci Desktop.dc.html" + mobile/"Delung Polityka Prywatnosci Mobile.dc.html"
  proces.html                    <- "Delung Para Proces.dc.html" = desktop/"Delung Desktop Proces.dc.html" + mobile/"Delung Proces Mobile.dc.html"
  realizacje.html                <- "Delung Para Realizacje.dc.html" = desktop/"Delung Desktop Realizacje Symulacja.dc.html" + mobile/"Delung Realizacje Symulacja Bottom Sheet.dc.html"

  assets/img/…                   <- uploads/… (nazwy zachowane; zmienione tylko tam,
                                    gdzie miały spacje/kropki: "Screenshot 2026-07-23 at 19.30.21.png"
                                    -> "screenshot-2026-07-23-19-30-21.png")

JAK TO JEST ZBUDOWANE
  • Jedno drzewo HTML dla obu widoków — teksty wspólne stoją w jednym miejscu.
    Klasy pomocnicze: .dOnly / .dOnlyI (tylko desktop), .mOnly / .mOnlyI (tylko mobile).
  • Listy powtarzalne (realizacje, kategorie, kroki, opinie, zespół) to tablice JS
    na początku skryptu danej strony — jedna edycja zmienia oba widoki.
  • Wspólny skrypt na końcu każdego pliku: nawigacja, menu mobilne, animacje wejścia,
    parallax, obsługa formularza.
  • Zależności z sieci: Google Fonts (Archivo, Manrope, Cormorant Garamond) + GSAP z CDN.
  • oferta.html: desktop = zakładki + panel kategorii (na niskim ekranie detale i CTA schodzą
    pod zdjęcie i opis), mobile = karuzel 3 kafli + kafel „zobacz pełną ofertę".
    Stała KAFLE_MOBILE w skrypcie strony decyduje, ile kategorii trafia do karuzeli.

CO WARTO PODMIENIĆ PRZED PRODUKCJĄ
  • kategorie.html istnieje tylko w wersji mobilnej — na desktopie adres /kategorie
    ma być przekierowany (301) na /oferta.
  • Dane kategorii są zduplikowane w oferta.html i kategorie.html (tablica KATEGORIE
    na początku skryptu strony) — zmiana treści kategorii wymaga edycji obu plików.
  • Zdjęcia kategorii w assets/img mają po kilka MB — przed produkcją warto je skompresować
    (WebP + kilka rozmiarów w srcset).
  • Formularz na kontakt.html pokazuje tylko potwierdzenie (bez wysyłki) — do podłączenia backendu.
  • Linki do Instagrama i Facebooka to "#".
