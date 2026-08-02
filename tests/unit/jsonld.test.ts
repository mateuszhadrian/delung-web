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
      expect(Object.keys(node)).not.toContain("telephone");
      expect(Object.keys(node)).not.toContain("email");
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
  it("ma wydawcę z logo i wskazuje węzeł firmy przez @id", () => {
    expect(site["@type"]).toBe("WebSite");
    expect(site.inLanguage).toBe("pl-PL");
    const publisher = site.publisher as Record<string, unknown>;
    expect(publisher["@type"]).toBe("Organization");
    expect(publisher["@id"]).toBe(business["@id"]);
    expect(publisher.logo).toMatchObject({ "@type": "ImageObject" });
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

  it("wizytówka Google w sameAs wskazuje ten sam CID co link do opinii", () => {
    const cid = GOOGLE_LISTING_URL.match(/cid=(\d+)/)?.[1];
    expect(cid).toBeTruthy();
    expect(OPINIE_GOOGLE_URL).toContain(cid!);
  });

  it("adres z JSON-LD zgadza się z tym drukowanym w stopce", () => {
    const footer = readFileSync("src/components/Footer.astro", "utf8");
    expect(footer).toContain(BUSINESS.street);
    expect(footer).toContain(BUSINESS.locality);
    expect(footer).toContain(BUSINESS.vatID.replace("PL", ""));
  });
});
