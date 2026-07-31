// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://delung.pl",
  output: "static",
  integrations: [
    sitemap({
      // /kategorie/ to mobilny wariant /oferta/ z canonical → /oferta/;
      // strona z cudzym canonicalem nie powinna siedzieć w sitemapie.
      filter: (page) => !page.includes("/kategorie/"),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
