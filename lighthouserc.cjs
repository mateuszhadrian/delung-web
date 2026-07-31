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
        // 0.9 → 0.75 (decyzja Mateusza, 4.2): strona główna dostała
        // fotograficzne hero = nowy LCP (niżej); mediana CI/lokalnie
        // ~0.80–0.82, a zimny pierwszy run potrafi spaść do ~0.5 —
        // median-run to wyrównuje, próg z małym zapasem.
        "categories:performance": ["error", { minScore: 0.75 }],
        // 3500 → 6000 (decyzja Mateusza, 4.2): LCP = pełnoekranowe zdjęcie
        // hero (jakość kadru > metryka — kalibrowany wycinek 500 KB dla
        // DPR≥2; wariant 174 KB dla DPR≤1.8 + preload w <head>). Pomiar po
        // optymalizacjach: ~5.1 s (lokalnie, symulacja jak CI; przed:
        // 6.4 s). Ratchet: zacieśnić do baseline'u CI przy domknięciu 4.5.
        "largest-contentful-paint": ["error", { maxNumericValue: 6000 }],
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
        // 5 → 6 (4.2): doszły subsety italic Cormoranta (cytat o-nas).
        "resource-summary:font:count": ["warn", { maxNumericValue: 6 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
