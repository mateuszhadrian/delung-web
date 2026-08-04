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
        // 0.85 → 0.80 (Etap 6, decyzja Mateusza) — patrz uzasadnienie przy
        // LCP niżej: score ciągnie w dół ta sama zmiana reżimu runnera
        // (0.88 na szybkim, 0.83 na wolnym, przy identycznych bajtach).
        "categories:performance": ["error", { minScore: 0.8 }],
        // 4500 → 5200 (Etap 6, decyzja Mateusza) — POLUZOWANIE wbrew
        // kierunkowi ratchetu, bo zwolnił runner, nie strona.
        //
        // LCP = pełnoekranowe zdjęcie hero (jakość kadru > metryka —
        // kalibrowany wycinek 500 KB dla DPR≥2; wariant 174 KB dla DPR≤1.8
        // + preload w <head>). Baseline z lipca: 3617–4064 ms.
        //
        // Pomiary z 3 sierpnia 2026 (te same bajty, script 19 053 B):
        //   run 30806023358 (merge #27): LCP 3918 ms, FCP  421 ms — zielony
        //   run 30803961568 (merge #26): LCP 4592 ms, FCP 1750 ms — CZERWONY
        //   PR feat/etap-6-jsonld:       LCP 4890 ms                — CZERWONY,
        //     po re-runie BEZ zmian w kodzie: zielony
        // Rozstrzyga FCP: 421 vs 1750 ms, czyli cała strona ładowała się
        // ~4× wolniej. To CPU runnera, nie regresja — potwierdzone osobno
        // pomiarem A/B (12 przebiegów LHCI: dokument z JSON-LD i bez niego
        // dają mediany 5035 vs 5035 ms).
        //
        // Mediana z 3 przebiegów nie ratuje: w wolnym przebiegu wszystkie
        // trzy pomiary były wolne. 5200 ms = +6 % nad NAJGORSZĄ zaobserwowaną
        // próbką (4890 ms) — świadomy zapas zamiast progu ocierającego się
        // o nią; realna regresja obrazu hero i tak go przebije.
        "largest-contentful-paint": ["error", { maxNumericValue: 5200 }],
        // Baseline 0 ms — próg-podłoga 150 ms (pojedyncze ms to szum
        // runnera; realna regresja JS i tak go przebije).
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        // 0.02 → 0.015 (runda poprawek 3): zmierzone 0.0117 w DWÓCH kolejnych
        // przebiegach na main (runy 30909810628 i 30911240907) — co do
        // czwartego miejsca po przecinku ta sama wartość, więc to nie jest
        // metryka szumiąca jak LCP. 0.015 = +28 % nad pomiarem, wciąż daleko
        // od progu „needs improvement" (0.1).
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.015 }],
        // 80 000 → 30 000 (Etap 6): próg pamiętał czasy GSAP-a. Po jego
        // wyjściu (Etap 5) bundle to 19 053 B i tyle samo pokazuje KAŻDY
        // przebieg CI — bajty są deterministyczne, więc ten próg jest
        // czystym sygnałem regresji, bez udziału szumu maszyny.
        // 30 000 → 20 000 (runda poprawek 3): próg pamiętał pomiar sprzed
        // wyjścia Lenisa (19 053 B). Po nim bundle to 13 659 B i tyle samo
        // pokazał KAŻDY z dwóch przebiegów na main — co do bajta. 20 000 =
        // +46 % zapasu na przyrost funkcji.
        // UWAGA: beacon Cloudflare Web Analytics (11,4 kB) NIE liczy się do
        // tego budżetu — Cloudflare wstrzykuje go na krawędzi, a LHCI mierzy
        // lokalny dist/. Koszt beaconu zmierzony osobno na produkcji
        // (docs/analiza-etap-6.md §6): +359 B w dokumencie, LCP bez zmian.
        "resource-summary:script:size": ["error", { maxNumericValue: 20000 }],
        // 900 000 → 860 000 (runda poprawek 3): zmierzone w CI 811 389
        // i 811 410 B (rozrzut 21 B — masę robią kadry hero, pozycja stała
        // i nieczuła na szum runnera). 860 kB = +6 % nad najgorszą próbką.
        // Zapas jest tu NAJCIAŚNIEJSZY z całego zestawu: jedno nowe zdjęcie
        // sekcji potrafi go zjeść, więc przy dokładaniu grafiki na `/`
        // najpierw policz transfer, a próg zmieniaj osobną decyzją.
        "resource-summary:total:size": ["error", { maxNumericValue: 860000 }],
        // 5 → 6 (4.2): doszły subsety italic Cormoranta (cytat o-nas).
        "resource-summary:font:count": ["warn", { maxNumericValue: 6 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
