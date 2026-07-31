// Kontrakt treści oferty (część 4.3, D-OK1): wpisy oferta-content.ts są
// kluczowane slugami z src/lib/categories.ts (D2 — jedno źródło prawdy,
// wspólne z selectem CMS) i niosą komplet pól dla obu widoków
// (/oferta/ i /kategorie/). Treści NIE zmieniają slugów/labeli kategorii.
import { describe, expect, it } from "vitest";
import {
  OFERTA_CATEGORIES,
  OFERTA_KAFLE_MOBILE,
} from "../../src/components/sections/oferta/oferta-content";
import { CATEGORIES } from "../../src/lib/categories";

const catSlugs = CATEGORIES.map((c) => c.slug);

describe("kontrakt treści oferty ↔ categories.ts", () => {
  it("każdy wpis wskazuje istniejący slug kategorii", () => {
    for (const entry of OFERTA_CATEGORIES) {
      expect(catSlugs).toContain(entry.slug);
    }
  });

  it("sługi wpisów są unikalne", () => {
    const slugs = OFERTA_CATEGORIES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("design ma 6 kategorii oferty; `inne` celowo bez treści (D-OK1)", () => {
    expect(OFERTA_CATEGORIES).toHaveLength(6);
    expect(OFERTA_CATEGORIES.map((e) => e.slug)).not.toContain("inne");
  });

  it("kolejność wpisów = kolejność CATEGORIES (numeracja 01–06)", () => {
    const expected = catSlugs.filter((slug) =>
      OFERTA_CATEGORIES.some((e) => e.slug === slug),
    );
    expect(OFERTA_CATEGORIES.map((e) => e.slug)).toEqual(expected);
    OFERTA_CATEGORIES.forEach((e, i) => {
      expect(e.num).toBe(String(i + 1).padStart(2, "0"));
    });
  });

  it("każdy wpis ma komplet treści dla obu widoków", () => {
    for (const e of OFERTA_CATEGORIES) {
      expect(e.tab.length).toBeGreaterThan(0);
      expect(e.card.length).toBeGreaterThan(0);
      e.card.forEach((line) => expect(line.length).toBeGreaterThan(0));
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.blurb.length).toBeGreaterThan(0);
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.desc.length).toBeGreaterThan(0);
      expect(e.det).toHaveLength(4);
      for (const d of e.det) {
        expect(d.label.length).toBeGreaterThan(0);
        expect(d.text.length).toBeGreaterThan(0);
      }
      expect(e.pos).toMatch(/^\d+% \d+%$/);
    }
  });

  it("karuzela mobile pokazuje pierwsze 3 kategorie (KAFLE_MOBILE)", () => {
    expect(OFERTA_KAFLE_MOBILE).toBe(3);
    expect(OFERTA_CATEGORIES.length).toBeGreaterThanOrEqual(
      OFERTA_KAFLE_MOBILE,
    );
  });
});
