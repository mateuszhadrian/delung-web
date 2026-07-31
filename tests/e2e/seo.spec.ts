// SEO/linki: canonical, meta OG/Twitter, sitemap (PL-only, bez /kategorie/),
// robots.txt (blokada /admin), crawl wewnętrznych linków (< 400).
// Meta są identyczne między profilami — biega tylko na chromium-1920.
import { expect, test } from "@playwright/test";
import {
  ABOUT_PATH,
  CONTACT_PATH,
  HOME_PATH,
  KATEGORIE_PATH,
  OFERTA_PATH,
  POLICY_PATH,
  PROCESS_PATH,
  WORK_INDEX_PATH,
} from "../../src/lib/routes";
import { useChromium1920Only } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

const SITE = "https://delung.pl";

// Trasy z własnym canonicalem — czyli sitemapa. /kategorie/ zostaje poza nią
// (canonical → /oferta/, filtr w astro.config.mjs), ale crawl niżej ją
// odwiedza (musi odpowiadać < 400).
const CANONICAL_ROUTES = [
  HOME_PATH,
  OFERTA_PATH,
  WORK_INDEX_PATH,
  PROCESS_PATH,
  ABOUT_PATH,
  CONTACT_PATH,
  POLICY_PATH,
];

useChromium1920Only(
  "meta/sitemap/crawl są niezależne od profilu — jeden projekt wystarczy",
);

test("head /: canonical + OG/Twitter", async ({ page }) => {
  await gotoReady(page, "/");
  const head = page.locator("head");

  // Canonical i og:url są absolutne (domena z astro.config — także na preview).
  await expect(head.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE}/`,
  );
  await expect(head.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${SITE}/`,
  );
  await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${SITE}/og-image.png`,
  );
  await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "pl_PL",
  );
  const ogTitle = await head
    .locator('meta[property="og:title"]')
    .getAttribute("content");
  expect(ogTitle).toBe(await page.title());
  await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
});

test("robots.txt blokuje /admin i wskazuje sitemapę", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain("Disallow: /admin");
  expect(body).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});

test("sitemapa istnieje i zawiera dokładnie trasy z własnym canonicalem", async ({
  request,
}) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.ok()).toBe(true);
  const locs = [...(await index.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  expect(locs.length).toBeGreaterThan(0);

  const urls: string[] = [];
  for (const loc of locs) {
    const res = await request.get(new URL(loc).pathname);
    expect(res.ok(), `sitemapa ${loc}`).toBe(true);
    urls.push(
      ...[...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (m) => m[1],
      ),
    );
  }
  expect(urls.sort()).toEqual(
    CANONICAL_ROUTES.map((p) => `${SITE}${p}`).sort(),
  );
});

test("wszystkie wewnętrzne linki odpowiadają < 400", async ({
  page,
  request,
}) => {
  const hrefs = new Set<string>([KATEGORIE_PATH]);
  for (const path of CANONICAL_ROUTES) {
    await gotoReady(page, path);
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")))) {
      if (!href || !href.startsWith("/") || href.startsWith("//")) continue;
      if (href.includes("/cdn-cgi/")) continue; // tylko na produkcji Cloudflare
      hrefs.add(href);
    }
  }
  expect(hrefs.size).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), `link ${href}`).toBeLessThan(400);
  }
});
