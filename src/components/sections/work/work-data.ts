// Dane realizacji żyją w plikach JSON kolekcji `realizacje`
// (src/content/realizacje/*.json, schemat w src/content.schema.ts).
// Tu zostają wyłącznie typy (PL-only — decyzja #2 delung) i normalizacja
// wpisu do postaci konsumowanej przez komponenty.
//
// UWAGA: to przejściowy kształt odziedziczony z szablonu źródłowego (screens/results/
// quote). Docelowy schemat delung (category/cover/gallery z wideo/specs —
// analiza §6.1) wchodzi w Etapie 2 razem z config.yml i komponentami
// (zmiana w TRZECH miejscach naraz — reguła cms-realizacje).

// Pojedynczy ekran realizacji prezentowany w modalu/sheecie.
export interface WorkScreen {
  key: string;
  label: string;
  desktop: string;
  mobile: string;
}

// Liczba/wynik w sekcji „Liczby i wyniki".
export interface WorkResult {
  metric: string;
  label: string;
}

export interface WorkProject {
  slug: string;
  order: number;
  name: string;
  category: string;
  year: string;
  blurb: string;
  tags: string[];

  // ── Treść modala / bottom sheeta ──
  screens: WorkScreen[];
  intro: string;
  results: WorkResult[];
  quote: string;
  author: string;
  role: string;
  scope: string[];
  // Link do strony na żywo. Pominięty (lub „#") → CTA się nie renderuje.
  liveUrl?: string;
}

export type LocalizedScreen = WorkScreen;
export type LocalizedResult = WorkResult;

export type LocalizedProject = {
  slug: string;
  name: string;
  year: string;
  category: string;
  blurb: string;
  tags: string[];
  screens: LocalizedScreen[];
  intro: string;
  results: LocalizedResult[];
  quote: string;
  author: string;
  role: string;
  scope: string[];
  liveUrl?: string;
};

// Normalizacja wpisu do postaci widokowej (limit tagów, filtr pustego
// liveUrl). Nazwa historyczna z szablonu źródłowego — zostaje do wymiany schematu
// w Etapie 2.
export function localizeProject(p: WorkProject): LocalizedProject {
  const live = p.liveUrl && p.liveUrl !== "#" ? p.liveUrl : undefined;
  return {
    slug: p.slug,
    name: p.name,
    year: p.year,
    category: p.category,
    blurb: p.blurb,
    tags: p.tags.slice(0, 3),
    screens: p.screens,
    intro: p.intro,
    results: p.results,
    quote: p.quote,
    author: p.author,
    role: p.role,
    scope: p.scope,
    liveUrl: live,
  };
}
