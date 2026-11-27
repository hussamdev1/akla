#!/usr/bin/env node
// Generates the PWA / favicon PNGs from the Lugma brand mark (src/components/Logo.tsx, "happy" mood).
// Run after changing the mascot:  node scripts/build-icons.mjs   — then commit the outputs.
// Uses `sharp`, which ships with Next.js as an optional dependency (if it is missing: `npm i -D sharp`).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RICE = "#FFF8EE";
const INK = "#2B1B3D";

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("[icons] sharp is not installed. Run `npm i -D sharp` and try again.");
  process.exit(1);
}

// Lugma, 64×64 units — keep in sync with <Lugma mood="happy"> in src/components/Logo.tsx.
const lugma = `
  <defs>
    <mask id="bite"><rect width="64" height="64" fill="white"/><circle cx="55" cy="9" r="13" fill="black"/></mask>
    <clipPath id="bun"><circle cx="32" cy="34" r="27.5"/></clipPath>
  </defs>
  <g mask="url(#bite)">
    <circle cx="32" cy="34" r="26" fill="#E63462" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="22" cy="22" rx="7" ry="4" fill="#FF8FAB" transform="rotate(-25 22 22)"/>
  </g>
  <circle cx="55" cy="9" r="13" fill="none" stroke="${INK}" stroke-width="3" clip-path="url(#bun)"/>
  <circle cx="58" cy="27" r="1.8" fill="#FFD23F" stroke="${INK}" stroke-width="1"/>
  <circle cx="47" cy="3.5" r="1.4" fill="#FFD23F" stroke="${INK}" stroke-width="1"/>
  <circle cx="23" cy="33" r="3.3" fill="${INK}"/>
  <circle cx="39" cy="33" r="3.3" fill="${INK}"/>
  <circle cx="24.2" cy="31.8" r="1" fill="white"/>
  <circle cx="40.2" cy="31.8" r="1" fill="white"/>
  <circle cx="17.5" cy="40" r="3" fill="#F2542D" opacity="0.55"/>
  <circle cx="45" cy="40" r="3" fill="#F2542D" opacity="0.55"/>
  <path d="M23 42 Q31 50 40 42" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

/**
 * @param {object} o
 * @param {number} o.scale  mascot width as a fraction of the canvas
 * @param {"none"|"rounded"|"full"} o.bg  background tile
 */
function svg({ scale, bg }) {
  const S = 64;
  const m = S * scale;
  const off = (S - m) / 2;
  const tile =
    bg === "full" ? `<rect width="${S}" height="${S}" fill="${RICE}"/>`
    : bg === "rounded" ? `<rect x="1" y="1" width="${S - 2}" height="${S - 2}" rx="14" fill="${RICE}" stroke="${INK}" stroke-width="2"/>`
    : "";
  // translate so the bun (centre 32,34) sits optically centred
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">${tile}<g transform="translate(${off} ${off - (bg === "none" ? 0 : 1.5 * scale)}) scale(${scale})">${lugma}</g></svg>`;
}

const png = (s, size) => sharp(Buffer.from(s), { density: Math.ceil((72 * size) / 64) * 2 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

const any = svg({ scale: 0.8, bg: "rounded" }); // "any" purpose: rounded rice tile, shown as-is
const maskable = svg({ scale: 0.6, bg: "full" }); // full-bleed; mascot inside the 80 % safe circle
const apple = svg({ scale: 0.74, bg: "full" }); // iOS rounds the corners itself and needs an opaque square
const fav = svg({ scale: 1, bg: "none" });

await mkdir(path.join(ROOT, "public/icons"), { recursive: true });
const out = {
  "public/icons/icon-192.png": await png(any, 192),
  "public/icons/icon-512.png": await png(any, 512),
  "public/icons/maskable-512.png": await png(maskable, 512),
  "public/icons/maskable-192.png": await png(maskable, 192),
  "src/app/apple-icon.png": await png(apple, 180),
};

// favicon.ico = PNG-in-ICO container (16, 32, 48), supported by every current browser.
const sizes = [16, 32, 48];
const imgs = await Promise.all(sizes.map((s) => png(fav, s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4); // colour planes
  header.writeUInt16LE(32, e + 6); // bits per pixel
  header.writeUInt32LE(imgs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += imgs[i].length;
});
out["src/app/favicon.ico"] = Buffer.concat([header, ...imgs]);

for (const [file, buf] of Object.entries(out)) {
  await writeFile(path.join(ROOT, file), buf);
  console.log(`[icons] ${file} (${(buf.length / 1024).toFixed(1)} KB)`);
}
