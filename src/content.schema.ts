// Schemat wpisu Realizacji — CZYSTY Zod, bez importów z "astro:content",
// żeby dało się go używać poza pipeline'em Astro (kontrakt CMS w testach
// jednostkowych: tests/unit/cms-contract.test.ts). Konsumowany przez
// src/content.config.ts (walidacja w buildzie) — jedno źródło prawdy.
//
// PL-only (decyzja #2 delung) — bez pól {pl,en}.
// UWAGA: przejściowy kształt odziedziczony z szablonu źródłowego; docelowy schemat
// delung (category enum z categories.ts, cover, gallery z wideo, specs —
// analiza §6.1) wchodzi w Etapie 2.
//
// Zmiana schematu = zmiana w TRZECH miejscach naraz (reguła cms-realizacje):
// ten plik, public/admin/config.yml, src/components/sections/work/*.
import { z } from "zod";

export const realizacjaSchema = z.object({
  slug: z.string(), // np. "aura" — używane w URL/anchorach
  order: z.number().default(0), // kolejność na liście (mniejsze = wyżej)
  name: z.string(),
  year: z.string(), // np. "2025"
  category: z.string(),
  blurb: z.string(),
  // Tagi: strona pokazuje maks. 3 — walidacja pilnuje tego już przy zapisie.
  tags: z.array(z.string()).max(3),
  intro: z.string(),
  screens: z
    .array(
      z.object({
        key: z.string(), // "home" | "gallery" | "order" (dowolne)
        label: z.string(),
        desktop: z.string(), // ścieżka/URL zrzutu desktop
        mobile: z.string(), // ścieżka/URL zrzutu mobile
      }),
    )
    .min(1),
  results: z.array(z.object({ metric: z.string(), label: z.string() })),
  quote: z.string(),
  author: z.string(),
  role: z.string(),
  scope: z.array(z.string()),
  liveUrl: z.string().optional(),
});
