import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { realizacjaSchema } from "./content.schema";

// Katalog treści realizacji. Produkcja czyta src/content/realizacje (pisze go
// Sveltia), ale testy WIZUALNE muszą stać na treści NIEZMIENNEJ: baseline to
// obraz, więc każde dodanie/usunięcie/przestawienie realizacji przez klienta
// rozjeżdżałoby zrzuty siatki, szyny filtrów, liczników, sceny na stronie
// głównej i detalu — czyli blokowałoby WSZYSTKIE PR-y do czasu regeneracji
// baseline'ów (zdarzyło się realnie przy pierwszym wpisie klienta, 2026-08-05).
// Dlatego `pnpm build:visual` przestawia kolekcję na zamrożony zestaw
// tests/fixtures/realizacje. Testy e2e (funkcjonalne) NIE używają tej ścieżki —
// czytają treść produkcyjną dynamicznie i są na jej zmiany odporne.
const REALIZACJE_DIR = process.env.REALIZACJE_DIR ?? "./src/content/realizacje";

const realizacje = defineCollection({
  // Każda realizacja = jeden plik JSON w katalogu wyżej.
  // Schemat: src/content.schema.ts (czysty Zod — współdzielony z testami).
  loader: glob({ pattern: "**/*.json", base: REALIZACJE_DIR }),
  schema: realizacjaSchema,
});

export const collections = { realizacje };
