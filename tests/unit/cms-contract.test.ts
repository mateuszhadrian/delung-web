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
