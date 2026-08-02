// Generator zasobów marki (Etap 6, decyzja D-E11 w docs/analiza-etap-6.md).
//
//   node scripts/make-icons.mjs
//
// Wejście  : public/favicon.svg (odrys znaczka — JEDYNE źródło rysunku ikon)
//            + pełne logo na og-image (patrz LOGO_SOURCES niżej).
// Wyjście  : public/{favicon.ico, apple-touch-icon.png, icon-192.png,
//            icon-512.png, og-image.png}
//
// Dlaczego skrypt, a nie ciąg ręcznych komend: „dorób ikonę 256" za pół roku
// ma być jednym poleceniem, a nie odtwarzaniem parametrów z pamięci.
// Uwaga: to NIE jest to samo co scripts/optimize-images.mjs (PNG z eksportów
// designów → WebP do src/assets/).
import sharp from "sharp";
import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { homedir } from "node:os";

const OUT = "public";
const FAVICON_SVG = `${OUT}/favicon.svg`;

// Ikony: sam znaczek na BIAŁYM kwadracie (D-E1). Bez alfy — iOS podkłada
// czerń pod przezroczystość na ekranie startowym, a szara część znaczka
// znika wtedy w tle.
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// og-image: pełne logo (napis niesie nazwę firmy — D-E2) na tle „cream"
// z palety strony (--bg-cream w src/styles/global.css).
const CREAM = { r: 245, g: 243, b: 238, alpha: 1 };
const OG = { w: 1200, h: 630, logoW: 720 };

// Pełne logo: najpierw oryginał z eksportów designów (poza repo — daje ostry
// downscale), w razie jego braku kopia robocza z repo.
const LOGO_SOURCES = [
  `${homedir()}/Projects/delung-meble/eksport/assets/img/Delung-logo-new-no-background.png`,
  "src/assets/logo/delung-logo.webp",
];

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)} kB`;

/** PNG-y ikon renderowane z wektora (nie z rastra — stąd ostrość w 16 px). */
async function png(size) {
  return sharp(readFileSync(FAVICON_SVG), { density: 384 })
    .resize(size, size)
    .flatten({ background: WHITE })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

/** Kontener ICO z payloadem PNG (obsługiwany przez wszystkie żywe przeglądarki). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // typ: ikona
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach(({ size, data }, i) => {
    const at = i * 16;
    dir[at] = size >= 256 ? 0 : size; // 0 = 256 px
    dir[at + 1] = size >= 256 ? 0 : size;
    dir[at + 2] = 0; // paleta
    dir[at + 3] = 0; // reserved
    dir.writeUInt16LE(1, at + 4); // płaszczyzny
    dir.writeUInt16LE(32, at + 6); // bitów na piksel
    dir.writeUInt32LE(data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}

async function main() {
  if (!existsSync(FAVICON_SVG)) {
    throw new Error(`brak ${FAVICON_SVG} — ikony powstają z odrysu znaczka`);
  }

  for (const [name, size] of [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ]) {
    writeFileSync(`${OUT}/${name}`, await png(size));
    console.log(`${name.padEnd(21)} ${size}×${size}  ${kb(`${OUT}/${name}`)}`);
  }

  const sizes = [16, 32, 48];
  writeFileSync(
    `${OUT}/favicon.ico`,
    ico(
      await Promise.all(
        sizes.map(async (size) => ({ size, data: await png(size) })),
      ),
    ),
  );
  console.log(
    `favicon.ico           ${sizes.join("+")}  ${kb(`${OUT}/favicon.ico`)}`,
  );

  const logo = LOGO_SOURCES.find((p) => existsSync(p));
  if (!logo) throw new Error(`brak źródła logo (${LOGO_SOURCES.join(", ")})`);
  const logoBuf = await sharp(logo)
    .resize({ width: OG.logoW, fit: "inside" })
    .toBuffer();
  const { height: logoH } = await sharp(logoBuf).metadata();
  writeFileSync(
    `${OUT}/og-image.png`,
    await sharp({
      create: { width: OG.w, height: OG.h, channels: 3, background: CREAM },
    })
      .composite([
        {
          input: logoBuf,
          left: Math.round((OG.w - OG.logoW) / 2),
          top: Math.round((OG.h - logoH) / 2),
        },
      ])
      .png({ compressionLevel: 9, palette: true, colors: 128 })
      .toBuffer(),
  );
  console.log(
    `og-image.png          ${OG.w}×${OG.h}  ${kb(`${OUT}/og-image.png`)}  (logo: ${logo})`,
  );
}

await main();
