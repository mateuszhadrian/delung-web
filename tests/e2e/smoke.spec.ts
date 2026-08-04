// Minimalny smoke (@prod-smoke): strona wstaje, hero renderuje, formularz
// w DOM, brak błędów konsoli. PL-only (delung). Ten sam kod biega w E2E na
// preview i po deployu przeciw produkcji: pnpm test:smoke:prod (BASE_URL).
// Selektory celowo ogólne (main h1, #contact .kt-form) — przetrwały wymianę
// szkieletu Etapu 0 na docelowe widoki bez edycji smoke'a i mają tak zostać.
import { expect, test } from "@playwright/test";
import { collectPageIssues } from "../helpers/guards";

test.describe("smoke", { tag: "@prod-smoke" }, () => {
  test("/ wstaje: 200, lang=pl, hero renderuje, bez błędów konsoli", async ({
    page,
  }) => {
    const issues = collectPageIssues(page);
    const res = await page.goto("/", { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("main h1")).not.toBeEmpty();
    expect(issues()).toEqual([]);
  });

  test("/kontakt/ wstaje: 200, formularz w DOM", async ({ page }) => {
    // Podstrona z formularzem — deploy musi ją serwować; sam endpoint
    // sonduje osobny test niżej.
    const res = await page.goto("/kontakt/", { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("#contact .kt-form")).toBeAttached();
  });

  test("kluczowe zasoby odpowiadają", async ({ request }) => {
    for (const path of ["/favicon.svg", "/site.webmanifest", "/og-image.png"]) {
      const res = await request.get(path);
      expect(res.ok(), path).toBe(true);
    }
  });

  test("POST /api/kontakt z honeypotem → 200 bez wysyłki maila", async ({
    request,
  }, testInfo) => {
    // Pages Function żyje tylko na deployu Cloudflare — lokalny preview
    // serwuje sam dist (kontrakt: docs/contact-me-form-analysis-implementation.md §10).
    test.skip(
      !process.env.BASE_URL,
      "endpoint istnieje tylko na deployu (BASE_URL)",
    );
    // Jedna sonda, nie 6: reguła WAF kontakt-form-burst blokuje serie
    // POST-ów z jednego IP (>3/10 s) — probe per projekt by ją strącał.
    test.skip(
      testInfo.project.name !== "chromium-1920",
      "sonda endpointu niezależna od przeglądarki — wystarczy raz",
    );
    // Wypełniony honeypot = ścieżka bot-trap: funkcja odpowiada 200 i CICHO
    // odrzuca PRZED wysyłką przez Resend — sonda nie generuje maili.
    const res = await request.post("/api/kontakt", {
      multipart: {
        name: "Prod Smoke",
        email: "prod-smoke@example.com",
        temat: "",
        message: "Sonda żywotności endpointu — honeypot celowo wypełniony.",
        firma: "smoke-probe-bot-trap",
        elapsed: "10000",
        lang: "pl",
        "cf-turnstile-response": "",
      },
    });
    expect(res.status()).toBe(200);
  });
});
