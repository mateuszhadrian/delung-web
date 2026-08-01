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
//
// ZACIEŚNIENIE 2026-08-01 (domknięcie Etapu 4, decyzja Mateusza) —
// baseline PEŁNEJ strony głównej. Pomiary na `/` z main, mediana z 3
// przebiegów, 5 punktów (po merge'u PR #8/#10/#11/#12/#13):
//   perf   0.87–0.90     LCP  3617–4064 ms   TBT 0–2 ms
//   CLS    0.0117        script 66 723–67 978 B   total 889 453–892 752 B
// Progi poniżej = zapas nad NAJGORSZĄ próbką (nie nad medianą). Podłogi
// TBT/CLS zostają luźne celowo: zmierzone wartości są przy zerze, a
// zacieśnianie ich kupuje zero sygnału i dokłada ryzyko flake'a
// (patrz szum TBT desktop udokumentowany w lighthouserc.desktop.cjs).
//
// ⚠️ LOKALNY `lhci autorun` z tym configiem WYPADA GORZEJ NIŻ CI i to jest
// normalne: emulacja mobile dokłada stały mnożnik CPU do hosta, więc wynik
// zależy od obciążenia Maca (pomiar 2026-08-01 zaraz po test:e2e: perf
// 0.79–0.80, LCP 5255 ms — przy CI 0.87–0.90 / 3617–4064 ms). Czerwony
// przebieg lokalny NIE jest powodem do ruszania progów; bramkuje CI
// i tylko pomiar z CI jest podstawą ratchetu. Lokalnie sensownie
// weryfikują się budżety zasobów (script/total — niezależne od maszyny).
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
        // 0.75 → 0.85 (4.5): próg 0.75 był awaryjnym poluzowaniem z 4.2,
        // ustawionym PRZED pomiarem gotowej strony. Realne CI: 0.87–0.90 —
        // 0.85 zostawia 2 pkt zapasu i wraca do roli ratchetu.
        "categories:performance": ["error", { minScore: 0.85 }],
        // 6000 → 4500 (4.5): LCP = pełnoekranowe zdjęcie hero (jakość kadru
        // > metryka — kalibrowany wycinek 500 KB dla DPR≥2; wariant 174 KB
        // dla DPR≤1.8 + preload w <head>). Zmierzone w CI: 3617–4064 ms,
        // czyli sporo poniżej awaryjnego 6000 z 4.2. 4500 = +11 % nad
        // najgorszą próbką.
        "largest-contentful-paint": ["error", { maxNumericValue: 4500 }],
        // Baseline 0 ms — próg-podłoga 150 ms (pojedyncze ms to szum
        // runnera; realna regresja JS i tak go przebije).
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        // Baseline 0 — 0.02 zostawia miejsce na fonty/obrazy sekcji,
        // wciąż daleko od progu „needs improvement" (0.1).
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.02 }],
        // 100 000 → 80 000 (4.5): pełny bundle wyszedł 67 978 B — poniżej
        // szacunku hadrianm (~87 KB). 80 KB = +18 % zapasu.
        "resource-summary:script:size": ["error", { maxNumericValue: 80000 }],
        // 2 000 000 → 1 200 000 (4.5): pełna strona mobile waży 892 752 B
        // (obrazy 600 KB, fonty 154 KB). 1,2 MB = +34 % zapasu.
        "resource-summary:total:size": ["error", { maxNumericValue: 1200000 }],
        // 5 → 6 (4.2): doszły subsety italic Cormoranta (cytat o-nas).
        "resource-summary:font:count": ["warn", { maxNumericValue: 6 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
