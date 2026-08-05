// Dostępność mediów R2: HEAD do każdego URL-a media.delung.pl z JSON-ów
// realizacji. Zewnętrzna sieć = flaky ⇒ test nie biega w CI W OGÓLE (ani na
// PR-ach, ani na main — żaden workflow nie ustawia zmiennej); odpala się
// wyłącznie z CHECK_REMOTE_MEDIA=1: ręcznie i w /release-check.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const DIR = fileURLToPath(
  new URL("../../src/content/realizacje", import.meta.url),
);

function collectMediaUrls(): string[] {
  const urls = new Set<string>();
  for (const name of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
    const raw = readFileSync(join(DIR, name), "utf8");
    for (const match of raw.matchAll(/https:\/\/media\.delung\.pl\/[^"\s]+/g)) {
      urls.add(match[0]);
    }
  }
  return [...urls];
}

describe.skipIf(!process.env.CHECK_REMOTE_MEDIA)(
  "media R2: każdy URL media.delung.pl odpowiada na HEAD",
  () => {
    it("wszystkie media istnieją w R2", { timeout: 60_000 }, async () => {
      const urls = collectMediaUrls();
      expect(urls.length).toBeGreaterThan(0);

      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { method: "HEAD" });
            return { url, ok: res.ok, status: res.status };
          } catch (error) {
            return { url, ok: false, status: String(error) };
          }
        }),
      );

      const broken = results.filter((r) => !r.ok);
      expect(
        broken,
        `Niedostępne media:\n${broken.map((b) => `${b.status} ${b.url}`).join("\n")}`,
      ).toEqual([]);
    });
  },
);
