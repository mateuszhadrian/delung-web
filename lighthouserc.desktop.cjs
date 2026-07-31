// Lighthouse CI — profil DESKTOP (preset lighthouse:desktop).
// Reszta zasad jak w lighthouserc.cjs (tam pełny opis ratchetu).
//
// Baseline CI 2026-07-31 (Etap 3, SZKIELET strony głównej; run 30622374361,
// mediana z 3 przebiegów): perf 1.0, LCP 492 ms, TBT 0 ms, CLS 0,
// script 59 633 B, total 249 280 B, fonty 4. Progi Z ZAPASEM na przyrost
// sekcji Etapu 4 (pełny desktop hadrianm: LCP ~1733 ms) — potem ratchet.
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["/"],
      numberOfRuns: 3,
      settings: { preset: "desktop" },
    },
    assert: {
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        // Zapas: szkielet 492 ms + hero/sekcje (hadrianm desktop ~1733).
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        // Baseline 0 ms — próg-podłoga 100 ms (szum runnera).
        "total-blocking-time": ["error", { maxNumericValue: 100 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.02 }],
        // Wspólny bundle z profilem mobile — te same progi zasobów.
        "resource-summary:script:size": ["error", { maxNumericValue: 100000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 2000000 }],
        "resource-summary:font:count": ["warn", { maxNumericValue: 5 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
