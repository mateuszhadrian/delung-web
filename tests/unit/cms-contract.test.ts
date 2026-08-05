// Kontrakt CMS: każdy JSON zapisany przez Sveltię w src/content/realizacje/
// przechodzi schemę Zod (src/content.schema.ts — ta sama, którą waliduje
// build). Build też to łapie, ale ten test daje sygnał w 2 s i czytelny
// raport błędów zamiast wybuchu w środku `astro build`.
// Dodatkowo: opcje selecta „Kategoria" w public/admin/config.yml muszą być
// 1:1 ze slugami/etykietami z src/lib/categories.ts (D2 — jedno źródło
// prawdy; schemat Zod importuje slugi wprost, panel ma je wpisane w YAML).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { realizacjaSchema } from "../../src/content.schema";
import { CATEGORIES } from "../../src/lib/categories";

const DIR = fileURLToPath(
  new URL("../../src/content/realizacje", import.meta.url),
);

const files = readdirSync(DIR).filter((name) => name.endsWith(".json"));

describe("kontrakt CMS: src/content/realizacje/*.json", () => {
  it("katalog zawiera co najmniej jeden wpis", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s: poprawny JSON zgodny ze schemą", (name) => {
    const raw = readFileSync(join(DIR, name), "utf8");
    const data: unknown = JSON.parse(raw);
    const result = realizacjaSchema.safeParse(data);
    expect(
      result.success,
      result.success ? "" : `${name}:\n${z.prettifyError(result.error)}`,
    ).toBe(true);
  });

  // Kafel realizacji na /realizacje/ i w scenie na stronie głównej to
  // pierwsza pozycja galerii (D-RP2) — film w tym miejscu zostawiłby listę
  // bez okładki. Panel tego nie wymusi (nie ma warunku „na tej pozycji"),
  // więc jedynym strażnikiem jest schemat. Test sprawdza obie strony:
  // że poprawny wpis przechodzi i że film na pierwszej pozycji NIE przechodzi.
  describe("pierwsza pozycja galerii musi być zdjęciem (D-RP3)", () => {
    const base = {
      slug: "test",
      order: 1,
      title: "Test",
      category: "kuchnie",
      year: "2026",
      description: "opis",
      specs: [],
    };
    const photo = { type: "photo", image: "https://media.delung.pl/a.webp" };
    const video = { type: "video", video: "https://media.delung.pl/a.mp4" };

    it("zdjęcie na pierwszej pozycji: przechodzi", () => {
      expect(
        realizacjaSchema.safeParse({ ...base, gallery: [photo, video] })
          .success,
      ).toBe(true);
    });

    it("film na pierwszej pozycji: odrzucony, z komunikatem dla klienta", () => {
      const r = realizacjaSchema.safeParse({
        ...base,
        gallery: [video, photo],
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(z.prettifyError(r.error)).toContain("musi być zdjęciem");
      }
    });

    it("pozycja nie może nieść zdjęcia i filmu naraz (wariant, nie suma)", () => {
      const r = realizacjaSchema.safeParse({
        ...base,
        gallery: [{ ...photo, video: "https://media.delung.pl/a.mp4" }],
      });
      // Nadmiarowy klucz `video` w wariancie „photo" jest ignorowany przez
      // schemat — istotne jest to, że pozycja NIE staje się przez to filmem.
      expect(r.success && "video" in r.data.gallery[0]).toBe(false);
    });
  });

  it("slugi wpisów są unikalne", () => {
    const slugs = files.map(
      (name) =>
        (JSON.parse(readFileSync(join(DIR, name), "utf8")) as { slug: string })
          .slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("kontrakt CMS: select kategorii w config.yml", () => {
  const CONFIG = fileURLToPath(
    new URL("../../public/admin/config.yml", import.meta.url),
  );

  // Bez parsera YAML (zero zależności): wyciągamy pary {label, value}
  // z bloku `options:` pola category — format pilnowany przez Prettiera,
  // więc regex po liniach jest stabilny.
  it("opcje selecta = kategorie z categories.ts (1:1, z kolejnością)", () => {
    const yml = readFileSync(CONFIG, "utf8");
    const optionLines = [
      ...yml.matchAll(
        /-\s*\{\s*label:\s*"([^"]+)",\s*value:\s*"([^"]+)"\s*\}/g,
      ),
    ].map((m) => ({ label: m[1], value: m[2] }));

    expect(optionLines, "brak opcji selecta category w config.yml").not.toEqual(
      [],
    );
    expect(optionLines).toEqual(
      CATEGORIES.map((c) => ({ label: c.label, value: c.slug })),
    );
  });
});

// Wykluczenie „zdjęcie ALBO film" jest własnością PANELU (warianty listy),
// a nie tylko schematu — jeśli ktoś wyrzuci `types` z config.yml, walidacja
// Zoda dalej będzie zielona, a klient znów zobaczy oba pola naraz i dowie
// się o błędzie dopiero z czerwonego builda. Ten test tego pilnuje.
describe("kontrakt CMS: warianty pozycji galerii w config.yml", () => {
  const CONFIG = fileURLToPath(
    new URL("../../public/admin/config.yml", import.meta.url),
  );
  const yml = readFileSync(CONFIG, "utf8");

  it("galeria ma dokładnie dwa warianty: photo i video", () => {
    // Nazwy wariantów stoją na poziomie pozycji listy `types:` (wcięcie 12
    // po sformatowaniu Prettierem); pola wewnątrz wariantu są głębiej i mają
    // przecinek na końcu — stąd kotwica na końcu linii.
    const names = [...yml.matchAll(/^ {12}name: "(photo|video)"$/gm)].map(
      (m) => m[1],
    );
    expect(names).toEqual(["photo", "video"]);
  });

  it("nie ma już osobnego pola „Kafel (cover)”", () => {
    expect(yml).not.toContain('name: "cover"');
  });

  it("wariant „photo” niesie zdjęcie, wariant „video” — plik filmu", () => {
    const photoBlock = yml.slice(
      yml.indexOf('name: "photo"'),
      yml.indexOf('name: "video"'),
    );
    const videoBlock = yml.slice(yml.indexOf('name: "video"'));
    expect(photoBlock).toContain('name: "image"');
    expect(photoBlock).not.toContain('name: "video"');
    expect(videoBlock).toContain('widget: "file"');
    expect(videoBlock).not.toContain('name: "image"');
  });
});
