#!/usr/bin/env node

import path from "node:path";
import sharp from "sharp";

const profiles = {
  "quick-poster": {
    reference: "docs/frontend/references/share/quick-poster.png",
    render: "output/playwright/reference-quick-poster-story.png",
    regions: {
      heading: region(40, 60, 430, 130, "white"),
      winner: region(40, 190, 470, 440, "white"),
      scoreWinner: region(75, 680, 275, 370, "black"),
      scoreSeparator: region(150, 1_085, 180, 90, "black"),
      scoreLoser: region(80, 1_160, 300, 400, "black"),
      opponent: region(80, 1_560, 300, 80, "black"),
      tagline: region(40, 1_640, 430, 160, "lime"),
      footer: lockup(250, 1_790, 580, 110, "white", 280),
    },
  },
  "quick-frame": {
    reference: "docs/frontend/references/share/quick-frame.png",
    render: "output/playwright/reference-quick-frame-story.png",
    regions: {
      heading: region(90, 90, 360, 100, "lime"),
      winner: region(90, 900, 350, 500, "white"),
      score: region(90, 1_400, 900, 300, "lime"),
      opponent: region(90, 1_550, 520, 220, "white"),
      footer: lockup(250, 1_780, 580, 120, "white", 280),
    },
  },
  "recap-singles": {
    reference: "docs/frontend/references/share/recap-singles.png",
    render: "output/playwright/reference-recap-singles-story.png",
    regions: {
      date: region(190, 60, 700, 130, "black"),
      footer: lockup(220, 1_740, 640, 150, "black", 280),
    },
  },
  "recap-doubles": {
    reference: "docs/frontend/references/share/recap-doubles.png",
    render: "output/playwright/reference-recap-doubles-story.png",
    regions: {
      date: region(190, 60, 700, 130, "black"),
      footer: lockup(220, 1_740, 640, 150, "black", 280),
    },
  },
};

const selected = process.argv.find((value) => profiles[value]);
const names = selected ? [selected] : Object.keys(profiles);
const shouldCheck = process.argv.includes("--check");
const report = {};

for (const name of names) {
  const profile = profiles[name];
  const [reference, render] = await Promise.all([
    image(profile.reference),
    image(profile.render),
  ]);
  report[name] = {
    regions: Object.fromEntries(
      Object.entries(profile.regions).map(([regionName, target]) => {
        const referenceMask = mask(reference, target);
        const renderMask = mask(render, target);
        return [
          regionName,
          {
            reference: bounds(referenceMask, target),
            render: bounds(renderMask, target),
            maskDifference: difference(referenceMask, renderMask),
          },
        ];
      }),
    ),
  };
}

console.log(JSON.stringify(report, null, 2));
if (shouldCheck) verify(report);

function region(left, top, width, height, color) {
  return { color, height, left, top, width };
}

function lockup(left, top, width, height, color, minimumWidth) {
  return { ...region(left, top, width, height, color), lockup: minimumWidth };
}

async function image(input) {
  const { data, info } = await sharp(path.resolve(input))
    .resize(1080, 1920, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width };
}

function mask(source, target) {
  const result = new Uint8Array(target.width * target.height);
  for (let y = 0; y < target.height; y += 1) {
    for (let x = 0; x < target.width; x += 1) {
      const sourceIndex =
        ((target.top + y) * source.width + target.left + x) * 3;
      result[y * target.width + x] = isInk(
        source.data[sourceIndex],
        source.data[sourceIndex + 1],
        source.data[sourceIndex + 2],
        target.color,
      )
        ? 1
        : 0;
    }
  }
  return result;
}

function isInk(red, green, blue, color) {
  if (color === "white") return red + green + blue > 690;
  if (color === "lime")
    return red > 120 && green > 145 && blue < 90 && green >= red * 0.9;
  return red + green + blue < 240;
}

function bounds(values, target) {
  let left = target.width;
  let top = target.height;
  let right = -1;
  let bottom = -1;
  let pixels = 0;
  values.forEach((value, index) => {
    if (!value) return;
    const x = index % target.width;
    const y = Math.floor(index / target.width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
    pixels += 1;
  });
  return pixels
    ? {
        bottom: target.top + bottom,
        height: bottom - top + 1,
        left: target.left + left,
        pixels,
        right: target.left + right,
        top: target.top + top,
        width: right - left + 1,
      }
    : null;
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

function verify(results) {
  const failures = [];
  for (const [profile, result] of Object.entries(results)) {
    for (const [name, measured] of Object.entries(result.regions)) {
      if (!measured.reference || !measured.render) {
        failures.push(`${profile}/${name} has no measurable pixels`);
        continue;
      }
      const target = profiles[profile].regions[name];
      if (target.lockup) {
        const center = (measured.render.left + measured.render.right) / 2;
        if (measured.render.width < target.lockup)
          failures.push(`${profile}/${name} width ${measured.render.width}px`);
        if (Math.abs(center - 540) > 14)
          failures.push(
            `${profile}/${name} center drift ${Math.abs(center - 540)}px`,
          );
        continue;
      }
      if (name === "heading" && profile.startsWith("quick-")) {
        if (measured.render.width < 130 || measured.render.height < 60)
          failures.push(`${profile}/${name} misses readability floor`);
        continue;
      }
      if (
        name === "winner" &&
        (profile === "quick-poster" || profile === "quick-frame")
      ) {
        continue;
      }
      if (profile === "quick-poster" && name === "scoreLoser") {
        const winner = result.regions.scoreWinner.render;
        const loserCenter = (measured.render.left + measured.render.right) / 2;
        const winnerCenter = winner ? (winner.left + winner.right) / 2 : null;
        if (winnerCenter == null || Math.abs(loserCenter - winnerCenter) > 8)
          failures.push(`${profile}/${name} is not centered with winner score`);
        for (const edge of ["top", "bottom"]) {
          const drift = Math.abs(
            measured.reference[edge] - measured.render[edge],
          );
          if (drift > 14)
            failures.push(`${profile}/${name} ${edge} drift ${drift}px`);
        }
      } else if (profile === "quick-frame" && name === "opponent") {
        if (measured.render.width < 200)
          failures.push(`${profile}/${name} width ${measured.render.width}px`);
        for (const edge of ["left", "top", "bottom"]) {
          const drift = Math.abs(
            measured.reference[edge] - measured.render[edge],
          );
          if (drift > 14)
            failures.push(`${profile}/${name} ${edge} drift ${drift}px`);
        }
      } else {
        for (const edge of ["left", "top", "right", "bottom"]) {
          const drift = Math.abs(
            measured.reference[edge] - measured.render[edge],
          );
          if (drift > 14)
            failures.push(`${profile}/${name} ${edge} drift ${drift}px`);
        }
      }
      const shapeChecked =
        (profile === "quick-poster" &&
          [
            "scoreWinner",
            "scoreSeparator",
            "scoreLoser",
            "opponent",
            "tagline",
          ].includes(name)) ||
        (profile === "quick-frame" && name === "score");
      if (shapeChecked && measured.maskDifference > 0.5)
        failures.push(
          `${profile}/${name} mask difference ${measured.maskDifference}`,
        );
    }
    if (profile === "quick-frame") {
      const winnerBottom = result.regions.winner.render?.bottom;
      const scoreTop = result.regions.score.render?.top;
      if (
        winnerBottom == null ||
        scoreTop == null ||
        scoreTop - winnerBottom < 16
      ) {
        failures.push(`${profile} winner-to-score gap is below 16px`);
      }
    }
  }
  if (failures.length)
    throw new Error(`Share fidelity check failed:\n- ${failures.join("\n- ")}`);
}
