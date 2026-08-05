// Dane realizacji żyją w plikach JSON kolekcji `realizacje`
// (src/content/realizacje/*.json, schemat w src/content.schema.ts).
// Tu zostają wyłącznie typy (PL-only — decyzja #2 delung) i normalizacja
// wpisu do postaci konsumowanej przez komponenty.
//
// Schemat po remoncie panelu (docs/analiza-remont-panelu.md): gallery + specs,
// BEZ pola cover — kaflem jest pierwsza pozycja galerii. Kategoria jako slug
// z src/lib/categories.ts (D2) — komponenty dostają też gotową etykietę
// (categoryLabel).

import { CATEGORIES, categoryLabel, type CategorySlug } from "@/lib/categories";

// Pozycja galerii detalu to WARIANT: albo zdjęcie, albo film — nigdy oba
// (D-RP1; panel wymusza to polami, schemat Zod dyskryminatorem `type`).
// Film nie ma własnego zdjęcia: miniatura powstaje z klatki (videoFrameAt).
export interface WorkGalleryPhoto {
  type: "photo";
  image: string;
  position?: string;
}
export interface WorkGalleryVideo {
  type: "video";
  video: string;
  duration?: string;
  position?: string;
}
export type WorkGalleryItem = WorkGalleryPhoto | WorkGalleryVideo;

// Para tabeli parametrów detalu (MATERIAŁY / BLAT / ZAKRES / …).
interface WorkSpec {
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
  gallery: WorkGalleryItem[];
  specs: WorkSpec[];
}

// Postać widokowa: slug kategorii + gotowa etykieta + WYLICZONY kafel.
export type ViewProject = Omit<WorkProject, "order"> & {
  categoryLabel: string;
  cover: { image: string; position?: string };
};

// Normalizacja wpisu do postaci konsumowanej przez komponenty.
// `cover` NIE jest już polem wpisu (D-RP2) — liczymy go z pierwszej pozycji
// galerii, żeby kafel siatki (WorkIndexCard) i scena realizacji na stronie
// głównej (HomeRealizacje) dostały dokładnie ten sam kształt danych co przed
// remontem i nie musiały się zmieniać.
export function viewProject(p: WorkProject): ViewProject {
  const first = p.gallery[0];
  // Schemat gwarantuje zdjęcie na pierwszej pozycji (.superRefine), więc ta
  // gałąź jest nieosiągalna dla treści, która przeszła walidację. Rzucamy
  // zamiast cichego pustego kafla: gdyby ktoś ominął schemat (np. woła tę
  // funkcję z ręcznie sklejonym obiektem), ma się dowiedzieć od razu.
  if (first?.type !== "photo") {
    throw new Error(
      `Realizacja "${p.slug}": pierwsza pozycja galerii musi być zdjęciem (jest kaflem na liście).`,
    );
  }
  return {
    ...p,
    categoryLabel: categoryLabel(p.category),
    cover: { image: first.image, position: first.position },
  };
}

// Pozycja szyny filtrów /realizacje/ (część 4.4, D-R1).
// `slug: null` = „Wszystkie"; kategorie BEZ wpisów nie dostają pozycji
// (instrukcja: puste ukryte, żadnych „(0)") — dlatego stan „brak
// realizacji w kategorii" jest w UI nieosiągalny.
export interface WorkRailItem {
  slug: CategorySlug | null;
  label: string;
  count: number;
}

export function workRail(
  projects: readonly Pick<WorkProject, "category">[],
): WorkRailItem[] {
  const counts = new Map<CategorySlug, number>();
  for (const p of projects) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return [
    { slug: null, label: "Wszystkie", count: projects.length },
    ...CATEGORIES.filter((c) => counts.has(c.slug)).map((c) => ({
      slug: c.slug,
      label: c.label,
      count: counts.get(c.slug)!,
    })),
  ];
}
