// Kontrakt danych strukturalnych (Etap 6, D-E4…D-E7). Najważniejsza asercja
// to ta antyscrapingowa: JSON-LD renderuje się statycznie do dist/, więc
// telefon albo e-mail w węźle złamałby D-CH5. Grep całego dist/
// (tests/e2e/contact.spec.ts) złapie to samo, ale dopiero po buildzie —
// ten test mówi o tym w sekundę.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BUSINESS,
  GOOGLE_LISTING_URL,
  GOOGLE_PLACE_ID,
  INSTAGRAM_URL,
  localBusiness,
  webSite,
} from "../../src/lib/jsonld";
import { OPINIE_GOOGLE_URL } from "../../src/lib/opinie";

const SITE = "https://delung.pl";
const business = localBusiness(SITE);
const site = webSite(SITE);

// Te same ciągi, których pilnuje grep dist/ w contact.spec.ts.
const FORBIDDEN = ["kontakt@delung.pl", "690291143", "690 291 143"];

describe("antyscraping (D-CH5)", () => {
  it("węzły nie niosą telefonu ani e-maila w żadnej postaci", () => {
    for (const node of [business, site]) {
      const serialized = JSON.stringify(node);
      for (const needle of FORBIDDEN) {
        expect(serialized.includes(needle), `JSON-LD zawiera „${needle}”`).toBe(
          false,
        );
      }
      // Rekurencyjnie — od czasu @graph (D-E6) węzły siedzą w tablicy,
      // więc sprawdzanie kluczy samego korzenia niczego by nie pilnowało.
      const keysDeep = (value: unknown): string[] =>
        Array.isArray(value)
          ? value.flatMap(keysDeep)
          : value && typeof value === "object"
            ? Object.entries(value).flatMap(([k, v]) => [k, ...keysDeep(v)])
            : [];
      expect(keysDeep(node)).not.toContain("telephone");
      expect(keysDeep(node)).not.toContain("email");
    }
  });

  it("moduł danych firmy nie importuje contact-details", () => {
    const source = readFileSync("src/lib/jsonld.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'].*contact-details/);
  });
});

describe("localBusiness()", () => {
  it("jest podtypem LocalBusiness z adresem, geo i identyfikatorem firmy", () => {
    expect(business["@context"]).toBe("https://schema.org");
    expect(business["@type"]).toBe("FurnitureStore");
    expect(business["@id"]).toBe(`${SITE}/#firma`);
    expect(business.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.locality,
      addressCountry: "PL",
    });
    expect(business.geo).toMatchObject({
      "@type": "GeoCoordinates",
      latitude: 51.199061,
      longitude: 18.552351,
    });
  });

  it("adresy obrazów i strony są absolutne (podglądy i walidator wymagają URL)", () => {
    for (const url of [business.url, business.image, business.logo]) {
      expect(String(url).startsWith(`${SITE}/`)).toBe(true);
    }
  });

  it("godziny: Pn–Pt 07:00–17:00 i Sb 07:00–14:00, bez niedzieli", () => {
    const hours = business.openingHoursSpecification as {
      dayOfWeek: string[];
      opens: string;
      closes: string;
    }[];
    expect(hours).toHaveLength(2);
    expect(hours[0].dayOfWeek).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ]);
    expect([hours[0].opens, hours[0].closes]).toEqual(["07:00", "17:00"]);
    expect(hours[1].dayOfWeek).toEqual(["Saturday"]);
    expect([hours[1].opens, hours[1].closes]).toEqual(["07:00", "14:00"]);
    expect(hours.flatMap((h) => h.dayOfWeek)).not.toContain("Sunday");
    for (const h of hours) {
      expect(h.opens).toMatch(/^\d{2}:\d{2}$/);
      expect(h.closes).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it("niesie NIP, rok założenia i zasięg", () => {
    expect(business.vatID).toBe("PL7312021984");
    expect(business.foundingDate).toBe("2014");
    expect(business.areaServed).toMatchObject({
      "@type": "Country",
      name: "Polska",
    });
  });
});

describe("webSite()", () => {
  const graph = site["@graph"] as Record<string, unknown>[];
  const node = (type: string) => graph.find((n) => n["@type"] === type)!;

  it("emituje DWA węzły najwyższego poziomu: WebSite i Organization", () => {
    // Zagnieżdżona Organization (pierwsza wersja D-E6) nie była wykrywana
    // przez Rich Results Test na „/" — stąd @graph. Nie zwijaj tego z
    // powrotem do publisher-obiektu.
    expect(graph).toHaveLength(2);
    expect(node("WebSite")).toBeTruthy();
    expect(node("Organization")).toBeTruthy();
  });

  it("WebSite wskazuje wydawcę SAMĄ referencją @id (bez duplikatu danych)", () => {
    const website = node("WebSite");
    expect(website.inLanguage).toBe("pl-PL");
    expect(website.publisher).toEqual({ "@id": business["@id"] });
  });

  it("Organization niesie logo i ten sam @id co węzeł firmy z /kontakt/", () => {
    const org = node("Organization");
    expect(org["@id"]).toBe(business["@id"]);
    expect(org.logo).toMatchObject({ "@type": "ImageObject" });
    expect(String((org.logo as { url: string }).url)).toContain(
      "/og-image.png",
    );
    expect(org.url).toBe(business.url);
    expect(org.sameAs).toEqual(business.sameAs);
  });

  it("NIE deklaruje SearchAction (strona nie ma wyszukiwarki)", () => {
    expect(JSON.stringify(site)).not.toContain("SearchAction");
  });
});

describe("spójność z resztą strony", () => {
  it("adres Instagrama zgadza się z tym w stopce i pigułce social", () => {
    for (const file of [
      "src/components/Footer.astro",
      "src/components/sections/contact/ContactSoc.astro",
    ]) {
      expect(readFileSync(file, "utf8"), file).toContain(INSTAGRAM_URL);
    }
  });

  // D-Q3: link do opinii buduje się z Place ID, a `sameAs` z CID-a — dwa
  // zapisy tego samego identyfikatora Google. Place ID to base64url
  // protobufa `0a <len> 09 <8B FID-hi LE> 11 <8B CID LE>`, więc równość
  // da się SPRAWDZIĆ, a nie tylko zadeklarować w komentarzu: literówka
  // w którejkolwiek ze stałych wywali ten test.
  it("link do opinii i wizytówka w sameAs wskazują tę samą firmę", () => {
    const cid = GOOGLE_LISTING_URL.match(/cid=(\d+)/)?.[1];
    expect(cid).toBeTruthy();
    expect(OPINIE_GOOGLE_URL).toContain(GOOGLE_PLACE_ID);

    const raw = Buffer.from(
      GOOGLE_PLACE_ID.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    );
    expect(raw.length).toBe(20);
    expect(raw[0]).toBe(0x0a);
    expect(raw[2]).toBe(0x09);
    expect(raw[11]).toBe(0x11);
    expect(raw.readBigUInt64LE(12).toString()).toBe(cid);
  });

  it("link do opinii NIE jest desktopowym UI wyszukiwarki (KOREKTA D-P6)", () => {
    // Wariant z `tbm=lcl`/`#lkt=LocalPoiReviews` renderował pustą stronę
    // na telefonie — do tego adresu nie wracamy.
    expect(OPINIE_GOOGLE_URL).not.toContain("tbm=lcl");
    expect(OPINIE_GOOGLE_URL).not.toContain("lkt=LocalPoiReviews");
    expect(OPINIE_GOOGLE_URL.startsWith("https://search.google.com/")).toBe(
      true,
    );
  });

  it("adres z JSON-LD zgadza się z tym drukowanym w stopce", () => {
    const footer = readFileSync("src/components/Footer.astro", "utf8");
    expect(footer).toContain(BUSINESS.street);
    expect(footer).toContain(BUSINESS.locality);
    expect(footer).toContain(BUSINESS.vatID.replace("PL", ""));
  });
});
