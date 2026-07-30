// Dane realizacji żyją w plikach JSON kolekcji `realizacje`
// (src/content/realizacje/*.json, schemat w src/content.schema.ts).
// Tu zostają wyłącznie typy (PL-only — decyzja #2 delung) i normalizacja
// wpisu do postaci konsumowanej przez komponenty.
//
// Docelowy schemat delung (analiza §6.1): cover + gallery (zdjęcia i wideo)
// + specs; kategoria jako slug z src/lib/categories.ts (D2) — komponenty
// dostają też gotową etykietę (categoryLabel).

import { categoryLabel, type CategorySlug } from "@/lib/categories";

// Pozycja galerii detalu; `video` (URL MP4 w R2) => zdjęcie pełni rolę
// posteru, a kafel dostaje badge play (+ opcjonalny opis `duration`).
export interface WorkGalleryItem {
  image: string;
  position?: string;
  video?: string;
  duration?: string;
}

// Para tabeli parametrów detalu (MATERIAŁY / BLAT / ZAKRES / …).
export interface WorkSpec {
  label: string;
  value: string;
}

// Kształt wpisu kolekcji (zgodny z realizacjaSchema).
export interface WorkProject {
  slug: string;
  order: number;
  title: string;
  category: CategorySlug;
  year: string;
  description: string;
  cover: { image: string; position?: string };
  gallery: WorkGalleryItem[];
  specs: WorkSpec[];
}

// Postać widokowa: slug kategorii + gotowa etykieta do wyświetlenia.
export type ViewProject = Omit<WorkProject, "order"> & {
  categoryLabel: string;
};

// Normalizacja wpisu do postaci konsumowanej przez komponenty.
export function viewProject(p: WorkProject): ViewProject {
  return { ...p, categoryLabel: categoryLabel(p.category) };
}
