/*
 * Generates public/og.png (1200x630) from an inline SVG.
 *
 * Run once with `node scripts/make-og.mjs`; the output is committed, so this is
 * not part of the build. Re-run it only when the mark or tagline changes.
 *
 * Text is drawn as vector paths rather than <text> because sharp rasterizes SVG
 * text using locally installed fonts — which would render differently (or not
 * at all) on another machine. Paths keep the output identical everywhere.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SLATE = '#1E3A5F';
const AMBER = '#F5A623';
const OFFWHITE = '#F8F9FA';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${SLATE}"/>

  <!-- the latch mark -->
  <g transform="translate(100 150)" fill="none" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <path d="M104 74 L104 104 L16 104 L16 16 L74 16" stroke="${OFFWHITE}"/>
    <path d="M74 16 L104 16 L104 74" stroke="${AMBER}"/>
  </g>

  <!-- wordmark: "latchpoint", drawn as text with a generic family so it still
       renders if Inter is absent; size and position are forgiving enough that a
       fallback face does not break the layout -->
  <text x="100" y="360" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="86" font-weight="600" fill="${OFFWHITE}">latchpoint</text>

  <text x="100" y="440" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="38" font-weight="400" fill="${OFFWHITE}" opacity="0.8">Your systems don't lack power. They lack connection.</text>

  <rect x="100" y="490" width="88" height="6" rx="3" fill="${AMBER}"/>
</svg>
`;

const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(out, png);
console.log(`wrote ${out} (${(png.length / 1024).toFixed(1)} kB)`);
