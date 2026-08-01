// Treści /o-nas/ współdzielone przez sekcje widoku (hero/manifest/team) —
// akapity manifestu i intro występują w DWÓCH gałęziach per-breakpoint
// (D-P3: duplikaty SSR zamiast relokacji JS-em z eksportu), więc żyją
// w jednym module zamiast być kopiowane między komponentami.
// BEZ importów obrazów — moduł czytają też testy Playwright (Node nie
// zaimportuje .webp); portrety mapuje onas-images.ts (wzorzec
// oferta-content/oferta-images z 4.3).

/** Akapit manifestu: desktop = sekcja MANIFEST (słowo po słowie),
 *  mobile = akapit karty hero (1:1 z eksportem o-nas.html). */
export const MANIFEST_TEXT =
  "Działamy na własnych, bezkompromisowych zasadach. Najbardziej irytuje " +
  "nas, gdy w branży idzie się na łatwiznę. Łączenie blatów na zamek? " +
  "Idealnie spasowane blendy górne? Niestandardowe forniry i ukryte " +
  "systemy? My wybieramy trudniejsze drogi, bo tylko one dają " +
  "spektakularne efekty. W Delung Meble albo robimy coś od serca " +
  "i z maksymalną precyzją, albo nie robimy tego wcale.";

/** Intro zespołu: desktop = akapit karty hero, mobile = head sekcji team
 *  (tam z dopiskiem „Kto za tym stoi?"). */
export const INTRO_TEXT =
  "Stolarstwo mamy we krwi, a na własny rachunek działamy od 2014 roku. " +
  "Twój dom to dla nas nie plac budowy, ale przestrzeń, o którą dbamy.";

export const ZESPOL = [
  {
    name: "Adam",
    role: "WŁAŚCICIEL I GŁÓWNY MONTAŻYSTA",
    desc:
      "To on dba o to, by każda wizja z projektu stała się idealną " +
      "rzeczywistością w Twoim domu.",
    quote: "„Ja ogólnie nie chodzę do pracy. Ja to po prostu lubię robić.”",
    note:
      "— pół żartem nazywa siebie „robotem”. To on dba o to, by każda " +
      "wizja z projektu stała się idealną rzeczywistością w Twoim domu.",
  },
  {
    name: "Tomek",
    role: "ZADANIA SPECJALNE",
    desc: "Wkracza tam, gdzie inni rozkładają ręce i mówią „nie da się”.",
    quote: "„Nie da się” to dla nas dopiero początek rozmowy.",
    note: "",
  },
  {
    name: "Marcin",
    role: "MISTRZ PRZYGOTOWANIA",
    desc:
      "To dzięki niemu meble są idealnie poskręcane i bezpiecznie " +
      "przygotowane do transportu.",
    quote: "Każdy element opuszcza stolarnię sprawdzony i zabezpieczony.",
    note: "",
  },
] as const;
