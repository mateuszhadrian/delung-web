// Lighthouse CI — profil MOBILE (domyślna emulacja LHCI: Moto G Power,
// CPU 4×, sieć 4G) = nasz proxy „słabszego Androida".
// Profil desktop: lighthouserc.desktop.cjs.
//
// Progi = RATCHET od baseline'u zmierzonego W CI (nie lokalnie — muszą
// odpowiadać maszynie, która bramkuje). Procedura pomiaru: lhci collect
// --numberOfRuns=5 + mediana (wzorzec z szablonu hadrianm, analiza §III.5).
// Progi podnosimy wolno TYLKO świadomą decyzją Mateusza (osobny commit);
// po każdej optymalizacji zacieśniamy do nowego baseline'u.
//
// Baseline CI 2026-07-31 (Etap 3, SZKIELET strony głównej; run 30622374361,
// mediana z 3 przebiegów): perf 0.99, LCP 1965 ms, TBT 0 ms, CLS 0,
// script 59 633 B, total 249 280 B, fonty 4. Progi ustawione Z ZAPASEM na
// przyrost sekcji Etapu 4 (lekcja §D kroniki hadrianm — mniej PR-ów
// „re-baseline"; pełna strona hadrianm wylądowała na LCP ~3100 ms
// i script ~87 KB — to skala spodziewanego wzrostu). Po zbudowaniu
// wszystkich sekcji zacieśniamy do nowego baseline'u.
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      // Sam „/": podstrony z mediami (/realizacje/) ładują obrazy z
      // media.delung.pl — zewnętrzna sieć w CI = flaky (ta sama zasada co
      // CHECK_REMOTE_MEDIA poza ścieżką PR).
      url: ["/"],
      numberOfRuns: 3, // mediana — tłumi szum runnera
    },
    assert: {
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        // Zapas: szkielet 1965 ms + hero/sekcje Etapu 4 (hadrianm: ~3100).
        "largest-contentful-paint": ["error", { maxNumericValue: 3500 }],
        // Baseline 0 ms — próg-podłoga 150 ms (pojedyncze ms to szum
        // runnera; realna regresja JS i tak go przebije).
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        // Baseline 0 — 0.02 zostawia miejsce na fonty/obrazy sekcji,
        // wciąż daleko od progu „needs improvement" (0.1).
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.02 }],
        // Szkielet 59 633 B; pełny bundle hadrianm ~87 KB → 100 KB.
        "resource-summary:script:size": ["error", { maxNumericValue: 100000 }],
        // Szkielet 249 KB; sekcje dodadzą obrazy WebP → 2 MB (hadrianm 1.8 MB).
        "resource-summary:total:size": ["error", { maxNumericValue: 2000000 }],
        "resource-summary:font:count": ["warn", { maxNumericValue: 5 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
