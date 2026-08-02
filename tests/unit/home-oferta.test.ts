// Kontrakt kafli zajawki oferty na stronie głównej (D-P1): każdy kafel
// niesie slug kategorii, bo od rundy poprawek jest deep-linkiem —
// desktop wchodzi na /oferta/#<slug> (zakładka), mobile otwiera kartę
// #kat-<slug> w miejscu. Slug bez pokrycia w categories.ts albo bez
// treści w oferta-content.ts = link w pustkę (zakładka i sheet powstają
// z OFERTA_CATEGORIES), stąd ten test.
import { describe, expect, it } from "vitest";
import { HOME_KAFLE } from "../../src/components/sections/home/home-oferta-content";
import { OFERTA_CATEGORIES } from "../../src/components/sections/oferta/oferta-content";
import { CATEGORIES } from "../../src/lib/categories";

const catSlugs = CATEGORIES.map((c) => c.slug);
const ofertaSlugs = OFERTA_CATEGORIES.map((e) => e.slug);

describe("kontrakt kafli zajawki oferty ↔ kategorie", () => {
  it("każdy kafel wskazuje istniejący slug kategorii (D2)", () => {
    for (const k of HOME_KAFLE) {
      expect(catSlugs).toContain(k.slug);
    }
  });

  it("każdy kafel ma treść oferty — czyli zakładkę i kartę kategorii", () => {
    for (const k of HOME_KAFLE) {
      expect(ofertaSlugs).toContain(k.slug);
    }
  });

  it("sługi kafli są unikalne", () => {
    const slugs = HOME_KAFLE.map((k) => k.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("6 kafli w kolejności /oferta/, numeracja 01–06 w parze", () => {
    expect(HOME_KAFLE).toHaveLength(OFERTA_CATEGORIES.length);
    expect(HOME_KAFLE.map((k) => k.slug)).toEqual(ofertaSlugs);
    HOME_KAFLE.forEach((k, i) => {
      expect(k.num).toBe(OFERTA_CATEGORIES[i].num);
    });
  });

  it("karuzela mobile pokazuje pierwsze 3 kafle (reszta desktop-only)", () => {
    expect(HOME_KAFLE.filter((k) => k.mobile)).toHaveLength(3);
    expect(HOME_KAFLE.slice(0, 3).every((k) => k.mobile)).toBe(true);
  });

  it("każdy kafel ma komplet treści eksportu", () => {
    for (const k of HOME_KAFLE) {
      expect(k.name.length).toBeGreaterThan(0);
      expect(k.nameM.length).toBeGreaterThan(0);
      expect(k.sub.length).toBeGreaterThan(0);
      expect(k.pos).toMatch(/^\d+% \d+%$/);
    }
  });
});
