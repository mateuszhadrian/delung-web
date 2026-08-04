// Mapowanie slug kategorii → zoptymalizowany kadr (część 4.3, D-OK9).
// Osobno od oferta-content.ts (czyste dane dla unit testu — importy
// obrazów wymagają pipeline'u assetów Astro). Pliki 1600×1600 z pełnych
// kwadratowych źródeł designu (docs/design/assets/img/*_category.png →
// scripts/optimize-images.mjs, q76): pokrywają panel desktop przy DPR2;
// kafle mobile i karty /kategorie/ tną kadr przez object-fit: cover
// + object-position z treści (pole `pos`).
import type { ImageMetadata } from "astro";
import catKuchnie from "@/assets/oferta/cat-kuchnie.webp";
import catSzafy from "@/assets/oferta/cat-szafy-garderoby.webp";
import catKomercyjne from "@/assets/oferta/cat-wnetrza-komercyjne.webp";
import catDekoracje from "@/assets/oferta/cat-dekoracje-okienne.webp";
import catLazienki from "@/assets/oferta/cat-zabudowy-lazienkowe.webp";
import catNietypowe from "@/assets/oferta/cat-meble-nietypowe.webp";
import type { CategorySlug } from "@/lib/categories";

const OFERTA_IMAGES: Partial<Record<CategorySlug, ImageMetadata>> = {
  kuchnie: catKuchnie,
  "szafy-garderoby": catSzafy,
  "wnetrza-komercyjne": catKomercyjne,
  "dekoracje-okienne": catDekoracje,
  "zabudowy-lazienkowe": catLazienki,
  "meble-nietypowe": catNietypowe,
};

/** Kadr dla slugu — rzuca w build time przy braku pliku (strażnik D-OK9). */
export function ofertaImage(slug: CategorySlug): ImageMetadata {
  const img = OFERTA_IMAGES[slug];
  if (!img) throw new Error(`Brak kadru oferty dla kategorii „${slug}"`);
  return img;
}
