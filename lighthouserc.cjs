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
// STAN: progi PROWIZORYCZNE Etapu 3 (delung, PL-only — mierzymy sam
// szkielet strony głównej; sekcje dojdą w Etapie 4). Wartości celowo luźne,
// żeby przepuścić pierwszy pomiar w CI — docelowe budżety „z zapasem na
// przyrost sekcji" wchodzą OSOBNYM commitem po odczycie median z CI.
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
        "categories:performance": ["error", { minScore: 0.85 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 150000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 2500000 }],
        "resource-summary:font:count": ["warn", { maxNumericValue: 6 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
