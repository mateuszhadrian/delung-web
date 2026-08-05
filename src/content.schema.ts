// Schemat wpisu Realizacji — CZYSTY Zod, bez importów z "astro:content",
// żeby dało się go używać poza pipeline'em Astro (kontrakt CMS w testach
// jednostkowych: tests/unit/cms-contract.test.ts). Konsumowany przez
// src/content.config.ts (walidacja w buildzie) — jedno źródło prawdy.
//
// PL-only (decyzja #2 delung) — bez pól {pl,en}.
// Schemat po remoncie panelu (docs/analiza-remont-panelu.md, D-RP1–D-RP3):
// category ze slugów categories.ts, gallery jako lista WARIANTÓW (pozycja to
// ALBO zdjęcie, ALBO film — panel wymusza to sam przez `types`/`typeKey`),
// specs jako pary label/value. Pola `cover` NIE MA: kaflem realizacji jest
// pierwsza pozycja galerii, która z tego powodu musi być zdjęciem.
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
// Dotyczy też klatki filmu: miniatura jest przycinana do tego samego
// pionowego kadru galerii co zdjęcia (D-RP: „kadr zostaw").
const position = z.string().optional();

// Warianty pozycji galerii. Dyskryminator `type` zapisuje sam panel
// (`typeKey` Sveltii, domyślnie "type") — dzięki temu klient nie może
// wypełnić zdjęcia i filmu naraz, bo widzi pola tylko jednego wariantu.
const photoItem = z.object({
  type: z.literal("photo"),
  image: z.string(),
  position,
});
const videoItem = z.object({
  type: z.literal("video"),
  video: z.string(), // URL MP4 w R2 — obecność pozycji tego typu = badge play
  duration: z.string().optional(), // "0:24" — podpis ORAZ środek klatki miniatury
  position,
});

export const realizacjaSchema = z.object({
  slug: z.string(), // np. "kuchnia-kaszmirowa" — nazwa pliku = slug (konwencja Sveltii)
  order: z.number().default(0), // kolejność na liście (mniejsze = wyżej)
  title: z.string(), // np. "Kuchnia kaszmirowa z podświetlaną witryną"
  category: z.enum(categorySlugs), // slug z categories.ts (select w panelu)
  year: z.string(), // np. "2025"
  description: z.string(), // opis z designu (desc)
  // Galeria detalu (shots z designu). PIERWSZA POZYCJA JEST KAFLEM realizacji
  // na /realizacje/ i na stronie głównej — dlatego musi być zdjęciem.
  // Sveltia nie ma walidacji zależnej od miejsca na liście, więc ten jeden
  // warunek łapie dopiero Zod: `pnpm test:unit` w 2 s, build w CI.
  gallery: z
    .array(z.discriminatedUnion("type", [photoItem, videoItem]))
    .min(1)
    .superRefine((items, ctx) => {
      if (items.length > 0 && items[0].type !== "photo") {
        ctx.addIssue({
          code: "custom",
          path: [0],
          // Komunikat mówi o polu i czynności, nie o ścieżce Zoda — to jest
          // tekst, który Mateusz zobaczy w raporcie i przeczyta klientowi.
          message:
            "Pierwsza pozycja galerii jest kaflem realizacji na liście — musi być zdjęciem. Przenieś film na dalszą pozycję.",
        });
      }
    }),
  // MATERIAŁY / BLAT / SYSTEMY / ZAKRES / ROK — pary z designu.
  specs: z.array(z.object({ label: z.string(), value: z.string() })),
});
