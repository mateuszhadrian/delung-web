// Schemat wpisu Realizacji — CZYSTY Zod, bez importów z "astro:content",
// żeby dało się go używać poza pipeline'em Astro (kontrakt CMS w testach
// jednostkowych: tests/unit/cms-contract.test.ts). Konsumowany przez
// src/content.config.ts (walidacja w buildzie) — jedno źródło prawdy.
//
// PL-only (decyzja #2 delung) — bez pól {pl,en}.
// Docelowy schemat delung (analiza §6.1): category ze slugów categories.ts,
// cover + gallery (zdjęcia i wideo — plan A potwierdzony spike'iem Etapu 2),
// specs jako pary label/value.
//
// Zmiana schematu = zmiana w TRZECH miejscach naraz (reguła cms-realizacje):
// ten plik, public/admin/config.yml, src/components/sections/work/*.
import { z } from "zod";
import { CATEGORIES, type CategorySlug } from "./lib/categories";

// Slugi kategorii — jedno źródło prawdy (D2). Panel ma te same opcje
// w selekcie (spójności pilnuje test kontraktu). Rzutowanie zachowuje
// literalne typy slugów (map() by je zgubił).
const categorySlugs = CATEGORIES.map((c) => c.slug) as unknown as [
  CategorySlug,
  ...CategorySlug[],
];

// Pozycja obrazu w kadrze (CSS object-position, np. "50% 42%") — opcjonalna.
const position = z.string().optional();

export const realizacjaSchema = z.object({
  slug: z.string(), // np. "kuchnia-kaszmirowa" — nazwa pliku = slug (konwencja Sveltii)
  order: z.number().default(0), // kolejność na liście (mniejsze = wyżej)
  title: z.string(), // np. "Kuchnia kaszmirowa z podświetlaną witryną"
  category: z.enum(categorySlugs), // slug z categories.ts (select w panelu)
  year: z.string(), // np. "2025"
  description: z.string(), // opis z designu (desc)
  // Kafel siatki /realizacje/ (+ opcjonalny object-position kadru).
  cover: z.object({ image: z.string(), position }),
  // Galeria detalu (shots z designu); image pełni rolę posteru dla wideo.
  gallery: z
    .array(
      z.object({
        image: z.string(),
        position,
        video: z.string().optional(), // URL MP4 w R2 — obecność pola = badge play
        duration: z.string().optional(), // "0:24" — opis przy badge (opcjonalny)
      }),
    )
    .min(1),
  // MATERIAŁY / BLAT / SYSTEMY / ZAKRES / ROK — pary z designu.
  specs: z.array(z.object({ label: z.string(), value: z.string() })),
});
