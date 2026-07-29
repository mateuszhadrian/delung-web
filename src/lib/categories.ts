// Kategorie oferty/realizacji — JEDNO źródło prawdy (decyzja D2).
// Konsumenci: /oferta/, /kategorie/, filtry /realizacje/, widget select
// w CMS (Etap 2 — test kontraktu pilnuje spójności slug↔panel).
// Lista może się zmieniać po przeklikaniu strony przez klienta —
// dodanie/usunięcie kategorii = edycja WYŁĄCZNIE tej tablicy
// (+ ewentualnie treść oferty).
// W szynie filtrów realizacji kategorie bez wpisów są UKRYWANE
// (żadnych liczników „(0)").
export const CATEGORIES = [
  { slug: "kuchnie", label: "Kuchnie" },
  { slug: "szafy-garderoby", label: "Szafy i garderoby" },
  { slug: "wnetrza-komercyjne", label: "Wnętrza komercyjne i biura" },
  { slug: "dekoracje-okienne", label: "Dekoracje okienne" },
  { slug: "zabudowy-lazienkowe", label: "Zabudowy łazienkowe" },
  { slug: "meble-nietypowe", label: "Meble nietypowe" },
  { slug: "inne", label: "Inne" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryLabel(slug: CategorySlug): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
