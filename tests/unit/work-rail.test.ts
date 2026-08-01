// Kontrakt szyny filtrów /realizacje/ (część 4.4, D-R1): „Wszystkie"
// + wyłącznie kategorie mające wpisy (puste ukryte — instrukcja Etapu 4
// pkt 4), kolejność wg CATEGORIES (D2), liczniki zgodne z wpisami.
import { describe, expect, it } from "vitest";
import { workRail } from "../../src/components/sections/work/work-data";
import { CATEGORIES, type CategorySlug } from "../../src/lib/categories";

const p = (category: CategorySlug) => ({ category });

describe("workRail — szyna filtrów realizacji", () => {
  it("zaczyna od „Wszystkie” z licznikiem wszystkich wpisów", () => {
    const rail = workRail([p("kuchnie"), p("kuchnie"), p("inne")]);
    expect(rail[0]).toEqual({ slug: null, label: "Wszystkie", count: 3 });
  });

  it("ukrywa kategorie bez wpisów (żadnych „(0)”)", () => {
    const rail = workRail([p("kuchnie"), p("zabudowy-lazienkowe")]);
    expect(rail.map((r) => r.slug)).toEqual([
      null,
      "kuchnie",
      "zabudowy-lazienkowe",
    ]);
  });

  it("kolejność kategorii = kolejność CATEGORIES, nie kolejność wpisów", () => {
    const rail = workRail([p("inne"), p("meble-nietypowe"), p("kuchnie")]);
    const expected = CATEGORIES.filter((c) =>
      ["kuchnie", "meble-nietypowe", "inne"].includes(c.slug),
    ).map((c) => c.slug);
    expect(rail.slice(1).map((r) => r.slug)).toEqual(expected);
  });

  it("liczniki i etykiety zgadzają się z categories.ts", () => {
    const rail = workRail([p("kuchnie"), p("kuchnie"), p("szafy-garderoby")]);
    expect(rail).toContainEqual({
      slug: "kuchnie",
      label: "Kuchnie",
      count: 2,
    });
    expect(rail).toContainEqual({
      slug: "szafy-garderoby",
      label: "Szafy i garderoby",
      count: 1,
    });
  });

  it("pusta kolekcja = sama pozycja „Wszystkie” (0)", () => {
    expect(workRail([])).toEqual([
      { slug: null, label: "Wszystkie", count: 0 },
    ]);
  });
});
