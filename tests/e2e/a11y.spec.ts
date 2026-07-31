// Dostępność: skan axe-core na wszystkich trasach delung (PL-only). Poziom
// bramkujący: zero naruszeń critical/serious; pełny raport (wszystkie
// poziomy) ląduje w artefaktach testu — ratchet jak w LHCI. Skan na jednym
// profilu desktop i jednym mobile (układy się różnią); pozostałe projekty
// nie wnoszą nowych informacji.
import AxeBuilder from "@axe-core/playwright";
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
import { gotoReady } from "../helpers/scroll";

const A11Y_PROJECTS = ["chromium-1920", "chromium-pixel-5"];

// RATCHET — allowlista znanych naruszeń startuje PUSTA (Etap 3) i taka ma
// zostać: test bramkuje każde naruszenie critical/serious. Nowy wpis wolno
// dodać WYŁĄCZNIE decyzją Mateusza (świadomy wyjątek z uzasadnieniem,
// wzorzec: intro Oferty w hadrianm-web); usunięcie wpisu = zacieśnienie.
const KNOWN_VIOLATIONS: Record<string, RegExp[]> = {};

function isKnown(ruleId: string, target: string): boolean {
  return (KNOWN_VIOLATIONS[ruleId] ?? []).some((re) => re.test(target));
}

// /kategorie/ jest mobile-only — na desktopie inline skrypt w <head>
// przekierowuje na /oferta/ przed paintem, więc skan desktopowy zmierzyłby
// /oferta/ drugi raz. Skanujemy ją tylko na profilu mobilnym.
const PATHS: { path: string; projects?: string[] }[] = [
  { path: HOME_PATH },
  { path: OFERTA_PATH },
  { path: KATEGORIE_PATH, projects: ["chromium-pixel-5"] },
  { path: WORK_INDEX_PATH },
  { path: PROCESS_PATH },
  { path: ABOUT_PATH },
  { path: CONTACT_PATH },
  { path: POLICY_PATH },
];

for (const { path, projects } of PATHS) {
  test(`axe: brak naruszeń critical/serious na ${path}`, async ({
    page,
  }, testInfo) => {
    const allowed = projects ?? A11Y_PROJECTS;
    test.skip(
      !A11Y_PROJECTS.includes(testInfo.project.name) ||
        !allowed.includes(testInfo.project.name),
      "skan a11y tylko na chromium-1920 i chromium-pixel-5",
    );
    await gotoReady(page, path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    await testInfo.attach(`axe-report${path.replaceAll("/", "-")}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });

    const gating = results.violations
      .filter((v) => ["critical", "serious"].includes(v.impact ?? ""))
      .map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        // Ratchet: węzły z allowlisty odpadają; nowe węzły bramkują.
        nodes: v.nodes
          .map((n) => n.target.join(" "))
          .filter((target) => !isKnown(v.id, target)),
      }))
      .filter((v) => v.nodes.length > 0);
    expect(gating).toEqual([]);
  });
}
