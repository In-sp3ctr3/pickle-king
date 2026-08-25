#!/usr/bin/env node

import path from "node:path";
import sharp from "sharp";

const inputs = process.argv.slice(2).filter((value) => value !== "--check");
const shouldCheck = process.argv.includes("--check");
const referencePath =
  inputs[0] ?? "docs/frontend/references/share/quick-receipt.png";
const renderPath =
  inputs[1] ?? "output/playwright/reference-quick-receipt-story.png";

const regions = {
  heading: { left: 690, top: 50, width: 350, height: 120, color: "black" },
  winner: { left: 500, top: 1_120, width: 540, height: 310, color: "black" },
  score: { left: 90, top: 1_420, width: 930, height: 320, color: "lime" },
  opponent: { left: 690, top: 1_710, width: 340, height: 100, color: "black" },
  footer: { left: 300, top: 1_800, width: 480, height: 100, color: "black" },
};

const [reference, render] = await Promise.all([
  image(path.resolve(referencePath)),
  image(path.resolve(renderPath)),
]);

const report = Object.fromEntries(
  Object.entries(regions).map(([name, region]) => {
    const referenceMask = mask(reference, region);
    const renderMask = mask(render, region);
    return [
      name,
      {
        reference: bounds(referenceMask, region),
        render: bounds(renderMask, region),
        maskDifference: difference(referenceMask, renderMask),
      },
    ];
  }),
);

console.log(JSON.stringify(report, null, 2));
if (shouldCheck) verify(report);

async function image(input) {
  const { data, info } = await sharp(input)
    .resize(1080, 1920, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width };
}

function mask(source, region) {
  const result = new Uint8Array(region.width * region.height);
  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const sourceIndex =
        ((region.top + y) * source.width + region.left + x) * 3;
      const red = source.data[sourceIndex];
      const green = source.data[sourceIndex + 1];
      const blue = source.data[sourceIndex + 2];
      result[y * region.width + x] = isInk(red, green, blue, region.color)
        ? 1
        : 0;
    }
  }
  return result;
}

function isInk(red, green, blue, color) {
  if (color === "lime") {
    return red > 120 && green > 145 && blue < 80 && green >= red * 0.9;
  }
  return red + green + blue < 240;
}

function bounds(values, region) {
  let left = region.width;
  let top = region.height;
  let right = -1;
  let bottom = -1;
  let pixels = 0;
  values.forEach((value, index) => {
    if (!value) return;
    const x = index % region.width;
    const y = Math.floor(index / region.width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
    pixels += 1;
  });
  if (!pixels) return null;
  return {
    bottom: region.top + bottom,
    height: bottom - top + 1,
    left: region.left + left,
    pixels,
    right: region.left + right,
    top: region.top + top,
    width: right - left + 1,
  };
}

function difference(referenceMask, renderMask) {
  let changed = 0;
  let union = 0;
  for (let index = 0; index < referenceMask.length; index += 1) {
    if (referenceMask[index] || renderMask[index]) union += 1;
    if (referenceMask[index] !== renderMask[index]) changed += 1;
  }
  return union ? Number((changed / union).toFixed(4)) : 0;
}

function verify(result) {
  const failures = [];
  for (const [name, tolerance, maximumDifference] of [
    ["winner", 12, 0.55],
    ["score", 12, 0.5],
    ["opponent", 8, 0.65],
  ]) {
    const region = result[name];
    if (!region.reference || !region.render) {
      failures.push(`${name} has no measurable pixels`);
      continue;
    }
    for (const edge of ["left", "top", "right", "bottom"]) {
      const drift = Math.abs(region.reference[edge] - region.render[edge]);
      if (drift > tolerance) {
        failures.push(
          `${name} ${edge} drift is ${drift}px (max ${tolerance}px)`,
        );
      }
    }
    if (region.maskDifference > maximumDifference) {
      failures.push(
        `${name} mask difference is ${region.maskDifference} (max ${maximumDifference})`,
      );
    }
  }

  const heading = result.heading.render;
  if (!heading || heading.width < 145 || heading.height < 64) {
    failures.push("heading does not meet the 145×64px readability floor");
  }
  const footer = result.footer.render;
  if (
    !footer ||
    footer.width < 250 ||
    Math.abs((footer.left + footer.right) / 2 - 540) > 12
  ) {
    failures.push("footer lockup is not legible and centered");
  }
  if (failures.length) {
    throw new Error(
      `Receipt fidelity check failed:\n- ${failures.join("\n- ")}`,
    );
  }
}
