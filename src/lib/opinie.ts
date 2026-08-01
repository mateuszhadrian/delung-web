// Opinie Google (6 prawdziwych opinii z eksportów designów) — JEDNO źródło
// danych dla sekcji opinii strony głównej (HomeOpinie, 4.2) i /o-nas/
// (OnasOpinie, 4.5). Wyciągnięte z HomeOpinie w 4.5 (D-P4) — markup
// sekcji pozostaje per-widok (inne rozmiary/marquee), współdzielone są
// wyłącznie dane. Kolory awatarów to warianty PRZYCIEMNIONE do AA z D-SG7
// (#7d8a94→#59656f, #e8710a→#a34f07, #5f9a41→#457533) — nie surowe
// z eksportu. Pole `more` (dopisek „…więcej" na karcie) używa tylko o-nas.
export const OPINIE = [
  {
    i: "P",
    c: "#6a4fbf",
    n: "Paweł Kowalczyk",
    m: "1 opinia · 4 zdjęcia",
    more: true,
    t: "Z całego serca polecamy Pana Adama! Wykonane meble kuchenne są na najwyższym poziomie. Wszystko zostało dopracowane z ogromną precyzją, dbałością o każdy, nawet najmniejszy szczegół. Widać ogromne doświadczenie, profesjonalizm i pasję do swojej pracy.",
  },
  {
    i: "M",
    c: "#59656f",
    n: "Magda Lena",
    m: "3 opinie · 7 zdjęć",
    more: true,
    t: "Serdecznie i z czystym sumieniem możemy polecić Pana Adama. Jest profesjonalistą i najlepszym fachowcem, z jakim udało nam się współpracować w czasie wykończenia naszego wymarzonego domu. Świetny kontakt, dokładność i sumienność.",
  },
  {
    i: "M",
    c: "#a34f07",
    n: "Magdalena Kotyś",
    m: "4 opinie · 1 zdjęcie",
    more: false,
    t: "Polecam z całego serca! Pan Adam urzeczywistnił nasze meblowe marzenia – od kuchni, przez salon, aż po wymarzoną garderobę! Piękne, starannie wykonane i funkcjonalne meble. Doradztwo na najwyższym poziomie, przyjazna atmosfera.",
  },
  {
    i: "A",
    c: "#9334e6",
    n: "Anna Szlaska",
    m: "5 opinii",
    more: true,
    t: "Jestem bardzo zadowolona ze współpracy z panem Adamem. Meble kuchenne zostały wykonane z najwyższą starannością, dokładnie tak, jak sobie wymarzyłam. Cała realizacja przebiegła sprawnie, terminowo i bez żadnych problemów.",
  },
  {
    i: "E",
    c: "#5b6dcd",
    n: "Ewa",
    m: "2 opinie",
    more: false,
    t: "Pan Adam Delung to profesjonalista pod każdym względem. Wszystko przebiegło perfekcyjnie od pomiaru przez projekt aż do wykonania i montażu mebli. Fachowiec pełen pasji i serca. Polecam serdecznie.",
  },
  {
    i: "J",
    c: "#457533",
    n: "Jakub Nalichowski",
    m: "9 opinii · 9 zdjęć",
    more: false,
    t: "Bardzo polecam. Dobry kontakt, szybka realizacja, dobra cena, super jakość.",
  },
] as const;

export type Opinia = (typeof OPINIE)[number];

/** Link „Zobacz więcej opinii w Google" (wspólny obu sekcjom). */
export const OPINIE_GOOGLE_URL = "https://www.google.com/search?q=Delung+Meble";

/** Gwiazdka ocen jako path SVG (znak ★ tekstem nie przechodzi ratchetu
 *  axe — D-SG7); rysowana inline w sekcjach z aria-hidden. */
export const OPINIE_STAR_PATH =
  "M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8z";
