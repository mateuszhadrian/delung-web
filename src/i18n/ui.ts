// Słownik PL-only (decyzja #2 delung — bez EN). Mechanizm useTranslations
// zostaje uśpiony na jednym języku: Lang = "pl", zero martwych kluczy.
// Widoki portowane w Etapach 4–5 trzymają teksty INLINE w komponentach
// (wzorzec sekcji home/oferta/work/proces/o-nas) — tutaj zostają wyłącznie
// meta stron, których używają wrappery i testy.
export const languages = {
  pl: "Polski",
} as const;

export const defaultLang = "pl";

export const ui = {
  pl: {
    "meta.title": "Delung Meble — meble na wymiar",
    "workPage.title": "Realizacje — Delung Meble",
    "workPage.description":
      "Galeria zrealizowanych mebli na wymiar — kuchnie, szafy i garderoby, zabudowy łazienkowe i nietypowe projekty.",
    "contactPage.title": "Kontakt — Delung Meble",
    "contactPage.description":
      "Skontaktuj się z nami — formularz kontaktowy, e-mail i telefon. Napisz, czego potrzebujesz: kuchnia, szafa, garderoba czy inna zabudowa na wymiar. Odpowiadamy do 24 h w dni robocze.",
  },
} as const;
