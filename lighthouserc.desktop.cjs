// Lighthouse CI — profil DESKTOP (preset lighthouse:desktop).
// Reszta zasad jak w lighthouserc.cjs (tam pełny opis ratchetu).
//
// Baseline CI 2026-07-31 (Etap 3, SZKIELET strony głównej; run 30622374361,
// mediana z 3 przebiegów): perf 1.0, LCP 492 ms, TBT 0 ms, CLS 0,
// script 59 633 B, total 249 280 B, fonty 4. Progi Z ZAPASEM na przyrost
// sekcji Etapu 4 (pełny desktop hadrianm: LCP ~1733 ms) — potem ratchet.
//
// ZACIEŚNIENIE 2026-08-01 (domknięcie Etapu 4, decyzja Mateusza) —
// baseline PEŁNEJ strony głównej. Pomiary na `/` z main, mediana z 3
// przebiegów, 5 punktów (po merge'u PR #8/#10/#11/#12/#13):
//   perf   0.92–0.95     LCP  1544–1572 ms   TBT 22–138 ms (szum, niżej)
//   CLS    0.0042        script 66 723–67 978 B   total 1 592 515–1 595 814 B
// Desktop `perf` ZOSTAJE na 0.9 wbrew ratchetowi: min. próbka to 0.92,
// czyli tylko 2 pkt, a score ciągnie w dół szumiący TBT — zacieśnienie
// kupiłoby flake'a zamiast sygnału.
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
        // 2000 → 1800 (4.5): zmierzone 1544–1572 ms, rozrzut ±30 ms —
        // najstabilniejsza z metryk. 1800 = +14 % nad najgorszą próbką.
        "largest-contentful-paint": ["error", { maxNumericValue: 1800 }],
        // 100 → 200 (decyzja Mateusza, 4.5): próg-podłoga z Etapu 3 leżał
        // w ŚRODKU pasma szumu runnera. Pomiary na `/` z main (mediana z 3):
        // #8 73 ms, #10 22 ms, #11 40 ms, #12 73 ms, #13 138 ms (main
        // czerwony), PR #14 104 ms. Między #12 a #13 bajty IDENTYCZNE
        // (script 67 978 B, total 892 752 B — o-nas nie tknął `/`), a TBT
        // skoczył 73 → 138: czysty szum, zero regresji JS. 200 ms = zapas
        // nad najgorszą próbką; realny wzrost pracy JS (bundle 68 KB) i tak
        // ten próg przebije.
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        // 0.02 → 0.01 (4.5): desktop mierzy 0.0042 (mobile 0.0117 — tam
        // 0.02 zostaje). Wciąż daleko od „needs improvement" (0.1).
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.01 }],
        // Wspólny bundle z profilem mobile — ten sam próg skryptu
        // (80 000 → 30 000 w Etapie 6; zmierzone 19 053 B, uzasadnienie
        // w lighthouserc.cjs).
        "resource-summary:script:size": ["error", { maxNumericValue: 30000 }],
        // 1 800 000 → 1 650 000 (Etap 6): zmierzone w CI 1 519 558 B.
        // Zapas mniejszy niż na mobile (+8,6 %), bo tu masę robią kadry hero
        // w gęstości DPR≥2 — pozycja stała, nieczuła na szum runnera.
        "resource-summary:total:size": ["error", { maxNumericValue: 1650000 }],
        // 5 → 6 (4.5): wyrównanie z profilem mobile — szósty font to subset
        // italic Cormoranta z 4.2. Próg 5 spamował warnem każdy run.
        "resource-summary:font:count": ["warn", { maxNumericValue: 6 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
