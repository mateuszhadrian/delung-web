// Dane strukturalne schema.org (Etap 6, decyzje D-E4…D-E7 w
// docs/analiza-etap-6.md). JEDYNE źródło danych firmy dla JSON-LD.
//
// KONTRAKT ANTYSCRAPINGOWY (D-CH5): ten moduł CELOWO nie zna telefonu ani
// e-maila i nie wolno mu ich poznać. Fragmenty numeru/adresu żyją wyłącznie
// w src/lib/contact-details.ts i są składane w JS po załadowaniu strony;
// JSON-LD renderuje się statycznie do dist/, więc pole `telephone` czy
// `email` wpisałoby pełny ciąg wprost do źródła. Pilnują tego dwa testy:
// unit (tests/unit/jsonld.test.ts) i grep całego dist/ w
// tests/e2e/contact.spec.ts. NAP dla Google i tak niesie wizytówka firmy,
// z którą spina nas `sameAs`.
//
// Źródła danych (nie zgaduj — sprawdź):
// — nazwa/adres/NIP: stopka designów i PolicyPage.astro,
// — rok założenia: „OD 2014" (HomeTrust, OnasHero, onas-content.ts),
// — godziny, geo, zasięg: ustalenia z Mateuszem (2026-08-02).

/** Profil na Instagramie — ten sam adres co w Footer.astro i ContactSoc.astro
 *  (spójności pilnuje kontrakt w tests/unit/jsonld.test.ts). */
export const INSTAGRAM_URL = "https://www.instagram.com/delung_meble/";

/** Kanoniczny odnośnik do wizytówki Google po CID — węzeł `sameAs` danych
 *  strukturalnych. Adres z CID jest stabilny (inaczej niż link
 *  wyszukiwarki, który niesie parametry sesji) i jest zarazem
 *  udokumentowanym FALLBACKIEM linku do opinii (D-Q3), gdyby Google
 *  wyłączył endpoint `search.google.com/local/reviews`. */
export const GOOGLE_LISTING_URL =
  "https://maps.google.com/?cid=10496135886078434411";

/** Identyfikator wizytówki w formacie Place ID (`ChIJ…`) — ta sama firma
 *  co CID wyżej, inny zapis tego samego FID-a `0x427eafd1741faadb:
 *  0x91a9c3fa3bef5c6b` (druga połówka = CID dziesiętnie). Potrzebny przez
 *  endpoint opinii, który CID-a nie przyjmuje; oba identyfikatory trzymamy
 *  obok siebie, żeby nikt ich w przyszłości nie rozjechał. */
export const GOOGLE_PLACE_ID = "ChIJ26ofdNGvfkIRa1zvO_rDqZE";

/** Dane firmy — wspólne dla wszystkich węzłów. */
export const BUSINESS = {
  name: "Delung Meble",
  legalName: "Delung Meble Adam Delung",
  description:
    "Producent mebli na wymiar: kuchnie z zabudową AGD, szafy, łazienki, " +
    "dekoracje okienne i przestrzenie komercyjne.",
  street: "Strażacka 27a",
  postalCode: "98-300",
  locality: "Gaszyn",
  country: "PL",
  latitude: 51.199061,
  longitude: 18.552351,
  vatID: "PL7312021984",
  foundingDate: "2014",
  areaServed: "Polska",
  priceRange: "$$",
} as const;

/** Godziny PRACOWNI (wizyty klientów), nie dostępności telefonicznej —
 *  kafel „24/7" na /kontakt/ mówi o telefonie i to dwie różne rzeczy.
 *  Niedziela nieobecna = zamknięte (schema.org czyta brak wpisu tak samo
 *  jak jawne zero godzin, a wpis 00:00–00:00 bywa raportowany jako błąd). */
const OPENING_HOURS = [
  {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "07:00",
    closes: "17:00",
  },
  { days: ["Saturday"], opens: "07:00", closes: "14:00" },
] as const;

const abs = (site: string | URL, path: string) =>
  new URL(path, typeof site === "string" ? site : site.href).href;

/** Węzeł firmy dla /kontakt/ — `FurnitureStore` to podtyp `LocalBusiness`
 *  bliższy prawdzie niż `HomeAndConstructionBusiness` (D-E4). */
export function localBusiness(site: string | URL): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": abs(site, "/#firma"),
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    url: abs(site, "/"),
    image: abs(site, "/og-image.png"),
    logo: abs(site, "/og-image.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.locality,
      addressCountry: BUSINESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    openingHoursSpecification: OPENING_HOURS.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...slot.days],
      opens: slot.opens,
      closes: slot.closes,
    })),
    foundingDate: BUSINESS.foundingDate,
    areaServed: { "@type": "Country", name: BUSINESS.areaServed },
    vatID: BUSINESS.vatID,
    priceRange: BUSINESS.priceRange,
    sameAs: [INSTAGRAM_URL, GOOGLE_LISTING_URL],
  };
}

/** Strona główna: DWA węzły najwyższego poziomu w `@graph` — `WebSite`
 *  i `Organization` (D-E6, korekta po Rich Results Test 2026-08-02).
 *
 *  Dlaczego `@graph`, a nie `Organization` zagnieżdżona w `publisher`:
 *  przy zagnieżdżeniu narzędzie Google raportowało na „/" „nie wykryto
 *  elementów", podczas gdy na /kontakt/ wypisywało „Organizacja" — a to
 *  właśnie logo i nazwa wydawcy były celem tej decyzji. Dokumentacja
 *  Google mówi wprost: dane organizacji z `logo` mają stać na stronie
 *  głównej SAMODZIELNIE. `publisher` zostaje jako czysta referencja
 *  `@id` — bez duplikowania danych; oba węzły i tak spina wspólny
 *  identyfikator z węzłem firmy na /kontakt/.
 *
 *  BEZ `SearchAction` — strona nie ma wyszukiwarki, a deklarowanie
 *  nieistniejącego endpointu to błąd walidacji. */
export function webSite(site: string | URL): Record<string, unknown> {
  const organizationId = abs(site, "/#firma");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": abs(site, "/#strona"),
        url: abs(site, "/"),
        name: BUSINESS.name,
        inLanguage: "pl-PL",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: BUSINESS.name,
        legalName: BUSINESS.legalName,
        description: BUSINESS.description,
        url: abs(site, "/"),
        logo: { "@type": "ImageObject", url: abs(site, "/og-image.png") },
        image: abs(site, "/og-image.png"),
        sameAs: [INSTAGRAM_URL, GOOGLE_LISTING_URL],
      },
    ],
  };
}
