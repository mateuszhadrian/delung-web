// Treści oferty (część 4.3, D-OK1) — jedna tablica dla OBU widoków
// (/oferta/: zakładki desktop + karuzela mobile; /kategorie/: lista kafli
// + karty kategorii), port tablicy KATEGORIE z eksportów
// docs/design/oferta.html i kategorie.html (teksty 1:1).
//
// Klucz wpisu = slug z src/lib/categories.ts (D2 — jedno źródło prawdy;
// kontrakt selecta CMS). Etykiety marketingowe („Kuchnie i sprzęt AGD")
// są treścią oferty i NIE zmieniają labeli/slugów categories.ts.
// Kategoria `inne` celowo BEZ treści oferty (nie ma jej w designie) —
// żyje tylko w CMS i filtrach realizacji.
//
// Czyste dane (bez importów obrazów) — importuje je unit test kontraktu
// (tests/unit/oferta-content.test.ts). Mapowanie slug → obraz:
// oferta-images.ts (konsumują komponenty .astro).
import type { CategorySlug } from "@/lib/categories";

interface OfertaSpec {
  /** Etykieta specyfikacji (WERSALIKI z eksportu). */
  readonly label: string;
  readonly text: string;
}

export interface OfertaCategory {
  readonly slug: CategorySlug;
  /** Numer porządkowy „01"–„06" (kickery paneli i kart). */
  readonly num: string;
  /** Etykieta zakładki (desktop /oferta/). */
  readonly tab: string;
  /** Podpis kafla karuzeli mobile — wiersze łamane jak w eksporcie. */
  readonly card: readonly string[];
  /** Nazwa na kaflu listy /kategorie/. */
  readonly name: string;
  /** Podtytuł kafla listy /kategorie/. */
  readonly blurb: string;
  /** Tytuł panelu desktop / karty kategorii. */
  readonly title: string;
  readonly desc: string;
  /** Dokładnie 4 specyfikacje „W STANDARDZIE". */
  readonly det: readonly OfertaSpec[];
  /** Kadr zdjęcia (object-position z eksportu — pełne kwadratowe źródło). */
  readonly pos: string;
}

export const OFERTA_CATEGORIES: readonly OfertaCategory[] = [
  {
    slug: "kuchnie",
    num: "01",
    tab: "Kuchnie i sprzęt AGD",
    card: ["Kuchnie", "na wymiar"],
    name: "Kuchnie i sprzęt AGD",
    blurb: "Zabudowy i kompleksowe wyposażenie AGD.",
    title: "Kuchnie pod klucz.",
    desc:
      "Serce każdego domu wymaga szczególnej uwagi. Projektujemy, " +
      "produkujemy i montujemy zabudowy kuchenne, dbając o każdy milimetr. " +
      "Wybierając nas, nie musisz martwić się o sprzęt – kompleksowo " +
      "dobieramy i instalujemy urządzenia AGD, oddając Ci w pełni gotową " +
      "kuchnię.",
    det: [
      {
        label: "NIEZAWODNE SYSTEMY",
        text: "Prowadnice i zawiasy topowych marek (Blum).",
      },
      {
        label: "WYSELEKCJONOWANE MATERIAŁY",
        text: "Forniry, akryle, lakiery i trwałe blaty HPL.",
      },
      {
        label: "SPRZĘT NA GOTOWO",
        text: "Dobieramy, montujemy i podłączamy pełne AGD.",
      },
      {
        label: "TRUDNE ROZWIĄZANIA",
        text: "Łączenie blatów na zamek, idealne pasowanie blend.",
      },
    ],
    pos: "0% 50%",
  },
  {
    slug: "szafy-garderoby",
    num: "02",
    tab: "Szafy i garderoby",
    card: ["Szafy", "i garderoby"],
    name: "Szafy i garderoby",
    blurb: "Systemy przesuwne i zabudowy pod sam sufit.",
    title: "Szafy i garderoby.",
    desc:
      "Maksymalnie wykorzystana przestrzeń i niezawodne systemy " +
      "przechowywania. Niezależnie od tego, czy potrzebujesz dyskretnej " +
      "szafy wnękowej, czy przestronnej, reprezentacyjnej garderoby typu " +
      "walk-in – zrealizujemy to z najwyższej klasy materiałów.",
    det: [
      {
        label: "SYSTEMY PRZESUWNE",
        text: "Ciche domyki i prowadnice renomowanych marek.",
      },
      {
        label: "ORGANIZACJA WNĘTRZA",
        text: "Szuflady wewnętrzne, pantografy i wkłady na miarę.",
      },
      {
        label: "OŚWIETLENIE LED",
        text: "Światło wnętrza reagujące na otwarcie frontu.",
      },
      {
        label: "ZABUDOWA POD SUFIT",
        text: "Wykorzystujemy każdy centymetr – także skosy i wnęki.",
      },
    ],
    pos: "0% 50%",
  },
  {
    slug: "wnetrza-komercyjne",
    num: "03",
    tab: "Wnętrza komercyjne i biura",
    card: ["Wnętrza", "komercyjne"],
    name: "Wnętrza komercyjne i biura",
    blurb: "Recepcje, gabinety i przestrzenie dla biznesu.",
    title: "Wnętrza komercyjne (B2B).",
    desc:
      "Precyzja, której ufają profesjonaliści. Realizujemy wymagające " +
      "zlecenia dla biznesu – od eleganckich gabinetów lekarskich po " +
      "luksusowe salony jubilerskie. Tworzymy meble, które stają się " +
      "najlepszą wizytówką Twojej firmy.",
    det: [
      {
        label: "TERMINOWOŚĆ",
        text: "Realizacje zgrane z harmonogramem otwarcia lokalu.",
      },
      {
        label: "MATERIAŁY KONTRAKTOWE",
        text: "Powierzchnie odporne na intensywną eksploatację.",
      },
      {
        label: "PRACA Z PROJEKTANTAMI",
        text: "Projekty architektów realizujemy 1:1, bez uproszczeń.",
      },
      {
        label: "KOMPLEKSOWA OBSŁUGA B2B",
        text: "Wycena, produkcja i montaż w jednym kontrakcie.",
      },
    ],
    pos: "100% 50%",
  },
  {
    slug: "dekoracje-okienne",
    num: "04",
    tab: "Dekoracje okienne",
    card: ["Dekoracje", "okienne"],
    name: "Dekoracje okienne",
    blurb: "Zasłony, rolety i karnisze dobrane do wnętrza.",
    title: "Dekoracje okienne i tekstylia.",
    desc:
      "Twarde bryły mebli idealnie komponują się z miękkimi tkaninami. " +
      "Ocieplamy wnętrza szyjąc na wymiar firany, zasłony i rolety " +
      "rzymskie. Oferujemy również dobór i montaż nowoczesnych karniszy " +
      "elektrycznych.",
    det: [
      {
        label: "SZYCIE NA WYMIAR",
        text: "Firany, zasłony i rolety rzymskie z pomiarem u klienta.",
      },
      {
        label: "DOBÓR TKANIN",
        text: "Tkaniny dekoracyjne i zaciemniające – próbniki na miejscu.",
      },
      {
        label: "KARNISZE ELEKTRYCZNE",
        text: "Systemy sterowane pilotem lub z telefonu.",
      },
      {
        label: "SPÓJNOŚĆ Z MEBLAMI",
        text: "Tekstylia dobrane do kolorystyki zabudowy.",
      },
    ],
    pos: "50% 50%",
  },
  {
    slug: "zabudowy-lazienkowe",
    num: "05",
    tab: "Zabudowy łazienkowe",
    card: ["Zabudowy", "łazienkowe"],
    name: "Zabudowy łazienkowe",
    blurb: "Meble i blaty odporne na wilgoć, precyzyjnie spasowane.",
    title: "Zabudowy łazienkowe.",
    desc:
      "Elegancja odporna na warunki. Projektujemy meble łazienkowe, które " +
      "łączą piękny design z absolutną odpornością na wilgoć i zmienne " +
      "temperatury, zamieniając każdą łazienkę w prywatne SPA.",
    det: [
      {
        label: "ODPORNOŚĆ NA WILGOĆ",
        text: "Materiały i okucia przeznaczone do stref mokrych.",
      },
      {
        label: "BLATY I UMYWALKI",
        text: "Spieki i konglomeraty odporne na wodę i kosmetyki.",
      },
      {
        label: "ZABUDOWA TECHNICZNA",
        text: "Pralka, bojler i rewizje ukryte w estetycznej zabudowie.",
      },
      {
        label: "OKUCIA NIERDZEWNE",
        text: "Zawiasy i prowadnice odporne na korozję (Blum).",
      },
    ],
    pos: "50% 50%",
  },
  {
    slug: "meble-nietypowe",
    num: "06",
    tab: "Meble nietypowe",
    card: ["Meble", "nietypowe"],
    name: "Meble nietypowe",
    blurb: "Nieszablonowe projekty realizowane od zera.",
    title: "Realizacje nietypowe.",
    desc:
      "Tam, gdzie inni mówią „tego nie da się zrobić”, my dopiero się " +
      "rozkręcamy. Ukryte przejścia, nietypowe skosy, skomplikowane " +
      "obudowy RTV czy rygorystyczne łączenia blatów – kochamy wyzwania " +
      "i nie szukamy dróg na skróty.",
    det: [
      {
        label: "UKRYTE PRZEJŚCIA",
        text: "Drzwi schowane w zabudowie i fronty bez uchwytów.",
      },
      {
        label: "NIETYPOWE SKOSY",
        text: "Meble idealnie spasowane z geometrią poddaszy.",
      },
      {
        label: "OBUDOWY RTV",
        text: "Skomplikowane zabudowy multimedialne z wentylacją.",
      },
      {
        label: "PRECYZYJNE ŁĄCZENIA",
        text: "Rygorystyczne łączenia blatów i blend – bez kompromisów.",
      },
    ],
    pos: "50% 50%",
  },
];

/** Ile kafli kategorii pokazuje karuzela mobile /oferta/ (KAFLE_MOBILE). */
export const OFERTA_KAFLE_MOBILE = 3;
