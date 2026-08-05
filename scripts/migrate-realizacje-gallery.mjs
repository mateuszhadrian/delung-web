// Migracja treści realizacji do schematu po remoncie panelu
// (docs/analiza-remont-panelu.md, §6). Jednorazowa — zostaje w repo jako
// zapis tego, co dokładnie stało się z treścią klienta.
//
// ⚠️ To jest ŚWIADOMY WYJĄTEK od zasady twardej nr 2 (pliki
// src/content/realizacje/*.json pisze wyłącznie Sveltia) — wykonany za
// wyraźną zgodą Mateusza, jednym commitem, wyłącznie migracja.
//
// Co robi z każdym plikiem:
//   1. usuwa pole `cover` (kaflem jest teraz pierwsza pozycja galerii),
//   2. dopisuje dyskryminator `type` do każdej pozycji galerii,
//   3. pozycję, która miała ZDJĘCIE I FILM naraz, rozbija na dwie —
//      zdjęcie zostaje na swoim miejscu, film ląduje zaraz za nim
//      (decyzja Mateusza: „film zostaw jako drugą pozycję"). Nic nie ginie.
//
// Formatowanie: JSON.stringify(…, 2) + \n — dokładnie to, co pisze Sveltia.
//
// Użycie:  node scripts/migrate-realizacje-gallery.mjs [katalog] [--dry]
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "src/content/realizacje";
const dry = process.argv.includes("--dry");

const files = readdirSync(dir).filter((n) => n.endsWith(".json"));
let changed = 0;

for (const name of files) {
  const path = join(dir, name);
  const entry = JSON.parse(readFileSync(path, "utf8"));

  if (!("cover" in entry) && entry.gallery?.every((g) => g.type)) {
    console.log(`— ${name}: już zmigrowany, pomijam`);
    continue;
  }

  const gallery = [];
  for (const item of entry.gallery ?? []) {
    const { image, video, duration, position } = item;
    // Zdjęcie: zawsze, gdy pozycja je miała. Przy pozycji „zdjęcie + film"
    // to właśnie ono zostaje na miejscu i (na pozycji nr 1) jest kaflem.
    if (image) {
      gallery.push({ type: "photo", image, ...(position ? { position } : {}) });
    }
    if (video) {
      gallery.push({
        type: "video",
        video,
        ...(duration ? { duration } : {}),
        // Kadr wędruje z filmem: klatka jest przycinana do tego samego
        // pionowego kadru galerii co zdjęcia.
        ...(position ? { position } : {}),
      });
    }
  }

  delete entry.cover;
  const migrated = { ...entry, gallery };
  // Kolejność kluczy wpisu bez zmian poza wypadnięciem `cover` — `gallery`
  // i `specs` zostają tam, gdzie były (rest zachowuje kolejność wstawiania).

  const before = entry.gallery?.length ?? 0;
  const cameras = gallery.filter((g) => g.type === "video").length;
  console.log(
    `✓ ${name}: cover usunięty, pozycji ${before} → ${gallery.length}` +
      (cameras ? ` (w tym filmów: ${cameras})` : ""),
  );
  if (!dry) writeFileSync(path, JSON.stringify(migrated, null, 2) + "\n");
  changed++;
}

console.log(
  `\n${dry ? "[dry-run] " : ""}Zmigrowano plików: ${changed} z ${files.length} w ${dir}`,
);
