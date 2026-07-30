#!/usr/bin/env node

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const sourcePath = args.get("--source");
const renderPath = args.get("--render");
const outputPath = args.get("--out");

if (!sourcePath || !renderPath || !outputPath) {
  console.error(
    "Usage: node scripts/frontend-visual-compare.mjs --source source.png --render render.png --out comparison.png",
  );
  process.exit(2);
}

const [source, render] = await Promise.all([
  readFile(path.resolve(sourcePath)).then(PNG.sync.read),
  readFile(path.resolve(renderPath)).then(PNG.sync.read),
]);

if (source.width !== render.width || source.height !== render.height) {
  console.error(
    `Viewport mismatch: source=${source.width}x${source.height}, render=${render.width}x${render.height}`,
  );
  process.exit(1);
}

const diff = new PNG({ width: source.width, height: source.height });
const changed = pixelmatch(
  source.data,
  render.data,
  diff.data,
  source.width,
  source.height,
  { threshold: 0.1 },
);

const combined = new PNG({
  width: source.width * 3,
  height: source.height,
});

for (let y = 0; y < source.height; y += 1) {
  for (let x = 0; x < source.width; x += 1) {
    const sourceOffset = (source.width * y + x) * 4;
    const renderOffset = sourceOffset;
    const diffOffset = sourceOffset;
    const combinedSourceOffset = (combined.width * y + x) * 4;
    const combinedRenderOffset = (combined.width * y + x + source.width) * 4;
    const combinedDiffOffset = (combined.width * y + x + source.width * 2) * 4;
    source.data.copy(
      combined.data,
      combinedSourceOffset,
      sourceOffset,
      sourceOffset + 4,
    );
    render.data.copy(
      combined.data,
      combinedRenderOffset,
      renderOffset,
      renderOffset + 4,
    );
    diff.data.copy(
      combined.data,
      combinedDiffOffset,
      diffOffset,
      diffOffset + 4,
    );
  }
}

await mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
await writeFile(path.resolve(outputPath), PNG.sync.write(combined));
const ratio = changed / (source.width * source.height);
console.log(
  JSON.stringify({
    changedPixels: changed,
    totalPixels: source.width * source.height,
    ratio,
    output: path.resolve(outputPath),
    interpretation: "iteration-signal-only",
  }),
);
