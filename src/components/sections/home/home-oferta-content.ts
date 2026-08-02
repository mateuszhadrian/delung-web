// Kafle zajawki oferty na stronie głównej (część 4.2, D-SG4) — treści
// marketingowe eksportu 1:1. Od rundy poprawek każdy kafel niesie SLUG
// kategorii (D-P1): desktop linkuje `/oferta/#<slug>` (zakładka), mobile
// otwiera kartę-sheet w miejscu (D-P2). Slug jest kluczem do
// `categories.ts` (D2) i do treści `oferta-content.ts` — pilnuje tego
// unit test kontraktu (tests/unit/home-oferta.test.ts), bo deep-link
// w nieistniejącą kategorię byłby ślepy.
//
// Czyste dane (bez importów obrazów — te mapuje HomeOferta.astro),
// żeby tablicę mógł zaimportować Vitest. Wzorzec: oferta-content.ts.
import type { CategorySlug } from "@/lib/categories";

export interface HomeKafel {
  readonly slug: CategorySlug;
  /** Numer porządkowy „01"–„06" (licznik sceny przypiętej). */
  readonly num: string;
  /** Nazwa na kaflu desktopowym. */
  readonly name: string;
  /** Nazwa na kaflu mobilnym (krótsza — węższy kafel karuzeli). */
  readonly nameM: string;
  /** Podpis nad nazwą (wersaliki). */
  readonly sub: string;
  /** Kadr zdjęcia (object-position z eksportu). */
  readonly pos: string;
  /** Czy kafel wchodzi do karuzeli mobile (desktop pokazuje wszystkie). */
  readonly mobile: boolean;
}

export const HOME_KAFLE: readonly HomeKafel[] = [
  {
    slug: "kuchnie",
    num: "01",
    name: "Kuchnie i sprzęt AGD",
    nameM: "Kuchnie pod klucz",
    sub: "Zabudowa + AGD",
    pos: "0% 50%",
    mobile: true,
  },
  {
    slug: "szafy-garderoby",
    num: "02",
    name: "Szafy i garderoby",
    nameM: "Szafy i garderoby",
    sub: "Na wymiar",
    pos: "0% 50%",
    mobile: true,
  },
  {
    slug: "wnetrza-komercyjne",
    num: "03",
    name: "Wnętrza komercyjne",
    nameM: "Wnętrza komercyjne",
    sub: "Dla biznesu (B2B)",
    pos: "100% 50%",
    mobile: true,
  },
  {
    slug: "dekoracje-okienne",
    num: "04",
    name: "Dekoracje okienne",
    nameM: "Dekoracje okienne",
    sub: "Tekstylia",
    pos: "50% 50%",
    mobile: false,
  },
  {
    slug: "zabudowy-lazienkowe",
    num: "05",
    name: "Zabudowy łazienkowe",
    nameM: "Zabudowy łazienkowe",
    sub: "Strefy mokre",
    pos: "50% 50%",
    mobile: false,
  },
  {
    slug: "meble-nietypowe",
    num: "06",
    name: "Meble nietypowe",
    nameM: "Meble nietypowe",
    sub: "Zadania specjalne",
    pos: "50% 50%",
    mobile: false,
  },
];
