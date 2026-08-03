#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const referencePath = args.get("--reference");
const renderPath = args.get("--render");
const outputPath = args.get("--output");
const title = args.get("--title") ?? "Share export comparison";

if (!referencePath || !renderPath || !outputPath) {
  console.error(
    "Usage: node scripts/build-reference-contact-sheet.mjs --reference reference.png --render render.png --output comparison.webp [--title title]",
  );
  process.exit(2);
}

const width = 1920;
const height = 1080;
const panelWidth = 860;
const panelHeight = 900;
const [reference, render] = await Promise.all([
  containImage(referencePath, panelWidth, panelHeight),
  containImage(renderPath, panelWidth, panelHeight),
]);
const heading = Buffer.from(`
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#090b08"/>
    <text x="60" y="54" fill="#c8ff3d" font-family="Arial, sans-serif" font-size="22" font-weight="800">PICKLE KING · DESIGN QA</text>
    <text x="1860" y="54" text-anchor="end" fill="#f5f3e9" font-family="Arial, sans-serif" font-size="22" font-weight="800">${escapeXml(title)}</text>
    <text x="490" y="1035" text-anchor="middle" fill="#a8afa1" font-family="Arial, sans-serif" font-size="18" font-weight="700">SUPPLIED VISUAL AUTHORITY</text>
    <text x="1430" y="1035" text-anchor="middle" fill="#a8afa1" font-family="Arial, sans-serif" font-size="18" font-weight="700">CURRENT CODE-RENDERED EXPORT</text>
    <line x1="960" x2="960" y1="90" y2="1000" stroke="#394132" stroke-width="2"/>
  </svg>
`);

await mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
await sharp(heading)
  .composite([
    { input: reference, left: 60, top: 90 },
    { input: render, left: 1000, top: 90 },
  ])
  .webp({ quality: 88 })
  .toFile(path.resolve(outputPath));

console.log(path.resolve(outputPath));

async function containImage(input, targetWidth, targetHeight) {
  return sharp(path.resolve(input))
    .resize(targetWidth, targetHeight, {
      background: "#0d100c",
      fit: "contain",
      position: "centre",
    })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: "#0d100c",
    })
    .png()
    .toBuffer();
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
