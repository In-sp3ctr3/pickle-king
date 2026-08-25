#!/usr/bin/env node

import path from "node:path";
import sharp from "sharp";

const profiles = [
  profile(
    "regular-singles-feed",
    "reference-recap-singles-post.png",
    5,
    847,
    64,
    "feed",
  ),
  profile(
    "regular-singles-story",
    "reference-recap-singles-story.png",
    5,
    1208,
    81,
    "story",
  ),
  profile(
    "regular-doubles-feed",
    "reference-recap-doubles-post.png",
    6,
    762,
    64,
    "feed",
  ),
  profile(
    "regular-doubles-story",
    "reference-recap-doubles-story.png",
    6,
    960,
    82,
    "story",
  ),
  profile("dense-feed", "session-recap-8-post.png", 8, 690, 56, "feed"),
  profile("dense-story", "session-recap-8-story.png", 8, 930, 78, "story"),
  profile("compact-feed", "session-recap-12-post.png", 12, 600, 45, "feed"),
  profile("compact-story", "session-recap-12-story.png", 12, 870, 60, "story"),
  profile(
    "continuation-story",
    "session-recap-story-card-page-2.png",
    1,
    870,
    60,
    "story",
  ),
];

const report = {};
for (const current of profiles) {
  const image = await readImage(current.file);
  const rows = [];
  for (let index = 0; index < current.rowCount; index += 1) {
    const topRule = current.firstRuleY + index * current.rowPitch;
    const bottomRule = topRule + current.rowPitch;
    rows.push({
      row: index + 1,
      lanes: Object.fromEntries(
        Object.entries(current.lanes).map(([name, lane]) => [
          name,
          measureCell(image, lane, topRule, bottomRule),
        ]),
      ),
      rules: {
        bottom: rulePixels(
          image,
          current.tableLeft,
          current.tableRight,
          bottomRule,
        ),
        top: rulePixels(image, current.tableLeft, current.tableRight, topRule),
      },
    });
  }
  report[current.name] = rows;
}

console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--check")) verify(report);

function profile(name, fileName, rowCount, firstRuleY, rowPitch, format) {
  const story = format === "story";
  return {
    file: `output/playwright/${fileName}`,
    firstRuleY,
    lanes: story
      ? { differential: [790, 914], name: [142, 520], record: [540, 660] }
      : { differential: [800, 934], name: [128, 520], record: [560, 704] },
    name,
    rowCount,
    rowPitch,
    tableLeft: story ? 142 : 128,
    tableRight: story ? 938 : 952,
  };
}

async function readImage(file) {
  const { data, info } = await sharp(path.resolve(file))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, height: info.height, width: info.width };
}

function measureCell(image, [left, right], topRule, bottomRule) {
  let top = bottomRule;
  let bottom = topRule;
  let pixels = 0;
  for (let y = topRule + 2; y <= bottomRule - 2; y += 1) {
    let rowPixels = 0;
    for (let x = left; x <= right; x += 1) {
      const offset = (y * image.width + x) * 3;
      if (
        isInk(
          image.data[offset],
          image.data[offset + 1],
          image.data[offset + 2],
        )
      ) {
        rowPixels += 1;
      }
    }
    if (!rowPixels) continue;
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
    pixels += rowPixels;
  }
  if (!pixels) return null;
  const topGap = top - topRule - 1;
  const bottomGap = bottomRule - bottom - 1;
  return {
    bottom,
    bottomGap,
    clearGap: topGap + bottomGap,
    imbalance: Math.abs(topGap - bottomGap),
    pixels,
    top,
    topGap,
  };
}

function rulePixels(image, left, right, y) {
  let pixels = 0;
  for (let scanY = y - 1; scanY <= y + 1; scanY += 1) {
    for (let x = left; x <= right; x += 1) {
      const offset = (scanY * image.width + x) * 3;
      if (
        isInk(
          image.data[offset],
          image.data[offset + 1],
          image.data[offset + 2],
        )
      )
        pixels += 1;
    }
  }
  return pixels;
}

function isInk(red, green, blue) {
  return red < 100 && green < 100 && blue < 100;
}

function verify(results) {
  const failures = [];
  for (const [profileName, rows] of Object.entries(results)) {
    for (const row of rows) {
      if (row.rules.top < 500 || row.rules.bottom < 500) {
        failures.push(
          `${profileName}/row-${row.row} is missing a full divider`,
        );
      }
      for (const [laneName, measurement] of Object.entries(row.lanes)) {
        const label = `${profileName}/row-${row.row}/${laneName}`;
        if (!measurement) {
          failures.push(`${label} has no measurable ink`);
        } else if (measurement.topGap < 1 || measurement.bottomGap < 1) {
          failures.push(`${label} contacts a divider`);
        } else if (measurement.clearGap < 8) {
          failures.push(
            `${label} has only ${measurement.clearGap}px total clear gap`,
          );
        } else if (measurement.imbalance > 2) {
          failures.push(`${label} is off-center by ${measurement.imbalance}px`);
        }
      }
    }
  }
  if (failures.length)
    throw new Error(`Recap grid check failed:\n- ${failures.join("\n- ")}`);
}
