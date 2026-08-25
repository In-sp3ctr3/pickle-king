import { chmod, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = process.cwd();
const sourceDirectory = path.join(root, "docs/frontend/references/share");
const outputDirectory = path.join(root, "public/share/templates");
const brandDirectory = path.join(root, "public/brand");
const containedDoublesSource = path.join(
  sourceDirectory,
  "recap-doubles-contained.png",
);

const references = [
  {
    id: "recap-singles",
    original:
      "/var/folders/dz/wnp39jn543n8vkzsgdcdwf180000gn/T/codex-clipboard-021e9700-8f22-47bd-a4de-fafad0458bc1.png",
    erase: [
      clean("date", [215, 70, 510, 90], "recap-singles", [215, 170, 510, 90]),
      clean(
        "subtitle",
        [120, 830, 700, 82],
        "recap-singles",
        [120, 180, 700, 82],
      ),
      clean(
        "standings",
        [0, 932, 941, 575],
        "recap-singles",
        [0, 1435, 941, 60],
      ),
      clean(
        "footer",
        [180, 1510, 600, 150],
        "recap-singles",
        [180, 170, 600, 150],
      ),
    ],
  },
  {
    id: "recap-doubles",
    original:
      "/var/folders/dz/wnp39jn543n8vkzsgdcdwf180000gn/T/codex-clipboard-cbaaab96-c460-4264-9932-cbd95c3d84b8.png",
    erase: [
      clean("date", [250, 70, 450, 80], "recap-doubles", [250, 150, 450, 80]),
      clean(
        "subtitle",
        [120, 760, 700, 92],
        "recap-singles",
        [120, 180, 700, 92],
      ),
      clean(
        "standings",
        [0, 862, 941, 638],
        "recap-singles",
        [0, 1435, 941, 60],
      ),
      clean(
        "footer",
        [200, 1500, 540, 155],
        "recap-doubles",
        [700, 155, 30, 30],
      ),
    ],
  },
  {
    id: "quick-poster",
    original:
      "/var/folders/dz/wnp39jn543n8vkzsgdcdwf180000gn/T/codex-clipboard-7f672338-aab3-4c54-8fc2-5e65e0935bed.png",
    erase: [
      clean("meta", [45, 90, 320, 65], "quick-poster", [0, 0, 30, 30]),
      clean(
        "winner-line-1",
        [45, 160, 425, 190],
        "quick-poster",
        [0, 0, 30, 30],
      ),
      clean(
        "winner-line-2",
        [45, 350, 335, 205],
        "quick-poster",
        [0, 0, 30, 30],
      ),
      clean(
        "score-and-opponent",
        [61, 577, 300, 870],
        "quick-poster",
        [65, 580, 290, 32],
      ),
      clean("footer", [35, 1560, 430, 95], "quick-poster", [0, 0, 30, 30]),
    ],
  },
  {
    id: "quick-frame",
    original:
      "/var/folders/dz/wnp39jn543n8vkzsgdcdwf180000gn/T/codex-clipboard-e753f51b-f509-4f65-bb44-5e07eb45ad8f.png",
    erase: [
      clean("meta", [70, 80, 280, 60], "quick-frame", [100, 250, 30, 30]),
      clean("winner", [75, 800, 400, 370], "quick-frame", [100, 250, 30, 30]),
      clean(
        "score-and-opponent",
        [75, 1175, 720, 300],
        "quick-frame",
        [100, 250, 30, 30],
      ),
      clean("footer", [70, 1475, 420, 60], "quick-frame", [100, 250, 30, 30]),
    ],
  },
  {
    id: "quick-receipt",
    original:
      "/var/folders/dz/wnp39jn543n8vkzsgdcdwf180000gn/T/codex-clipboard-2c7cddf7-12d9-4690-8315-a220e2923023.png",
    erase: [
      clean("meta", [555, 35, 320, 90], "quick-receipt", [700, 250, 30, 30]),
      clean(
        "winner",
        [450, 945, 430, 235],
        "quick-receipt",
        [700, 250, 30, 30],
      ),
      clean(
        "score-and-opponent",
        [95, 1180, 785, 315],
        "quick-receipt",
        [700, 250, 30, 30],
      ),
      clean(
        "footer",
        [250, 1495, 400, 90],
        "quick-receipt",
        [700, 250, 30, 30],
      ),
    ],
  },
];

const sizes = {
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

const feedCropTop = {
  "recap-singles": 250,
  "recap-doubles": 250,
  "quick-poster": 0,
  "quick-frame": 0,
  "quick-receipt": 0,
};

function clean(name, [left, top, width, height], patchId, patch) {
  return {
    name,
    target: { left, top, width, height },
    patchId,
    patch: rectangle(patch),
  };
}

function rectangle([left, top, width, height]) {
  return { left, top, width, height };
}

async function exists(file) {
  try {
    await access(file, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function lockSources() {
  await mkdir(sourceDirectory, { recursive: true });
  for (const reference of references) {
    const locked = path.join(sourceDirectory, `${reference.id}.png`);
    if (await exists(reference.original))
      await copyFile(reference.original, locked);
    else if (!(await exists(locked))) {
      throw new Error(
        `Missing ${reference.id} authority at ${reference.original} and ${locked}.`,
      );
    }
    await chmod(locked, 0o644);
    reference.locked = locked;
  }
}

async function cleanReference(reference) {
  const composites = [];
  for (const region of reference.erase) {
    const patchSource = references.find(
      ({ id }) => id === region.patchId,
    )?.locked;
    if (!patchSource)
      throw new Error(`Unknown patch source: ${region.patchId}`);
    const input = await sharp(patchSource)
      .extract(region.patch)
      .resize(region.target.width, region.target.height, { fit: "fill" })
      .png()
      .toBuffer();
    composites.push({ input, ...region.target });
    region.expected = input;
  }

  const cleaned = await sharp(reference.locked)
    .composite(composites)
    .png()
    .toBuffer();
  await verifyErasedRegions(reference, cleaned);
  return cleaned;
}

async function verifyErasedRegions(reference, cleaned) {
  for (const region of reference.erase) {
    const actual = await sharp(cleaned)
      .extract(region.target)
      .ensureAlpha()
      .raw()
      .toBuffer();
    const expected = await sharp(region.expected)
      .ensureAlpha()
      .raw()
      .toBuffer();
    let matches = actual.length === expected.length;
    for (let index = 0; matches && index < actual.length; index += 4) {
      if (expected[index + 3] === 0) continue;
      matches =
        actual[index] === expected[index] &&
        actual[index + 1] === expected[index + 1] &&
        actual[index + 2] === expected[index + 2];
    }
    if (!matches) {
      throw new Error(
        `${reference.id} ${region.name} still contains source pixels after cleanup.`,
      );
    }
  }
}

async function buildBrandLockup() {
  const source = references.find(({ id }) => id === "recap-singles")?.locked;
  if (!source) throw new Error("The recap wordmark authority is unavailable.");
  const wordWidth = 466;
  const wordHeight = 76;
  const { data: alpha } = await sharp(source)
    .extract({ left: 368, top: 1562, width: 278, height: 52 })
    .greyscale()
    .negate()
    .threshold(96)
    .resize(wordWidth, wordHeight, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaPng = await sharp(alpha, {
    raw: { channels: 1, height: wordHeight, width: wordWidth },
  })
    .png()
    .toBuffer();
  const wordmark = async (background) =>
    sharp({
      create: {
        background,
        channels: 3,
        height: wordHeight,
        width: wordWidth,
      },
    })
      .joinChannel(alphaPng)
      .png()
      .toBuffer();
  const [inkWordmark, chalkWordmark] = await Promise.all([
    wordmark({ b: 8, g: 11, r: 9 }),
    wordmark({ b: 233, g: 243, r: 245 }),
  ]);
  const mark = await sharp(path.join(brandDirectory, "pickle-king-mark.png"))
    .resize(128, 128)
    .png()
    .toBuffer();
  for (const [fileName, lockupWordmark] of [
    ["pickle-king-lockup.png", inkWordmark],
    ["pickle-king-lockup-chalk.png", chalkWordmark],
  ]) {
    const output = path.join(brandDirectory, fileName);
    await sharp({
      create: {
        background: { b: 0, g: 0, r: 0, alpha: 0 },
        channels: 4,
        height: 144,
        width: 640,
      },
    })
      .composite([
        { input: mark, left: 16, top: 8 },
        { input: lockupWordmark, left: 157, top: 34 },
      ])
      .png()
      .toFile(output);
    const metadata = await sharp(output).metadata();
    if (
      metadata.width !== 640 ||
      metadata.height !== 144 ||
      !metadata.hasAlpha
    ) {
      throw new Error(`${fileName} must be a transparent 640x144 PNG.`);
    }
    console.log(`${path.relative(root, output)} 640x144`);
  }
}

async function buildDensityRecap(referenceId, rendered, format, density) {
  const story = format === "story";
  const compact = density === "compact";
  const artTop = story
    ? referenceId === "recap-singles"
      ? 350
      : 290
    : referenceId === "recap-singles"
      ? 60
      : 20;
  const artHeight = 520;
  const clearTop = story ? 250 : 0;
  const slabTop = compact ? (story ? 800 : 550) : story ? 860 : 620;
  const slabBottom = story ? 1730 : 1230;
  const paper = await sharp(rendered)
    .extract({ left: 0, top: story ? 180 : 1260, width: 1080, height: 80 })
    .resize(1080, slabTop - clearTop, { fit: "fill" })
    .png()
    .toBuffer();
  const masthead = await buildRecapMasthead(
    referenceId,
    rendered,
    artTop,
    artHeight,
    compact ? (story ? 400 : 360) : story ? 440 : 430,
  );
  const slab = await sharp(rendered)
    .extract({ left: 0, top: story ? 1200 : 800, width: 1080, height: 100 })
    .resize(1080, slabBottom - slabTop, { fit: "fill" })
    .png()
    .toBuffer();
  const result = await sharp(rendered)
    .composite([
      { input: paper, left: 0, top: clearTop },
      {
        input: masthead,
        left: 64,
        top: compact ? (story ? 260 : 85) : story ? 280 : 110,
      },
      { input: slab, left: 0, top: slabTop },
    ])
    .png()
    .toBuffer();
  await verifyMastheadSafeArea(referenceId, result, format);
  return result;
}

async function buildSafeRegularRecap(referenceId, rendered, format) {
  const story = format === "story";
  const moveDoublesStorySlab = story && referenceId === "recap-doubles";
  const artTop = story
    ? referenceId === "recap-singles"
      ? 350
      : 290
    : referenceId === "recap-singles"
      ? 60
      : 20;
  const clearTop = story ? 250 : 0;
  const clearBottom = story
    ? referenceId === "recap-singles"
      ? 1070
      : 860
    : referenceId === "recap-singles"
      ? 784
      : 702;
  const clearHeight = clearBottom - clearTop;
  const paper = await sharp(rendered)
    .extract({ left: 0, top: story ? 180 : 1260, width: 1080, height: 80 })
    .resize(1080, clearHeight, { fit: "fill" })
    .png()
    .toBuffer();
  const masthead = await buildRecapMasthead(
    referenceId,
    rendered,
    artTop,
    520,
    story ? 440 : 430,
  );
  const slab = moveDoublesStorySlab
    ? await sharp(rendered)
        .extract({ left: 0, top: 1200, width: 1080, height: 100 })
        .resize(1080, 1730 - clearBottom, { fit: "fill" })
        .png()
        .toBuffer()
    : null;
  const safe = await sharp(rendered)
    .composite([
      { input: paper, left: 0, top: clearTop },
      { input: masthead, left: 64, top: story ? 280 : 110 },
      ...(slab ? [{ input: slab, left: 0, top: clearBottom }] : []),
    ])
    .png()
    .toBuffer();
  await verifyMastheadSafeArea(referenceId, safe, format);
  return safe;
}

async function buildRecapMasthead(
  referenceId,
  rendered,
  artTop,
  artHeight,
  targetHeight,
) {
  const contained = referenceId === "recap-doubles";
  const source = contained ? await correctedDoublesSource() : rendered;
  const region = contained
    ? { left: 32, top: 298, width: 1016, height: 452 }
    : { left: 0, top: artTop, width: 1080, height: artHeight };
  const opaque = await sharp(source)
    .extract(region)
    .ensureAlpha()
    .resize(952, targetHeight, {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      fit: "contain",
    })
    .png()
    .toBuffer();
  const masthead = await stripPaper(opaque);
  await verifyMastheadInternalPadding(referenceId, masthead);
  if (referenceId === "recap-doubles") {
    await verifyDoublesFinalSContour(masthead);
  }
  return masthead;
}

async function verifyDoublesFinalSContour(masthead) {
  const { data, info } = await sharp(masthead)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rightEdges = [];
  for (let y = 0; y < info.height; y += 1) {
    let right = -1;
    for (let x = Math.floor(info.width * 0.8); x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] >= 32) right = x;
    }
    if (right >= 0) rightEdges.push(right);
  }
  const outerEdge = Math.max(...rightEdges);
  const plateau = rightEdges.filter((x) => x === outerEdge).length;
  if (plateau > Math.ceil(rightEdges.length * 0.12)) {
    throw new Error(
      `recap-doubles final S has a ${plateau}px flat right edge across ${rightEdges.length}px of glyph height.`,
    );
  }
}

async function correctedDoublesSource() {
  const singlesSource = references.find(
    ({ id }) => id === "recap-singles",
  )?.locked;
  if (!singlesSource) throw new Error("The complete Singles S is unavailable.");
  const eraseRegion = { left: 880, top: 310, width: 170, height: 420 };
  const letterRegion = { left: 890, top: 310, width: 150, height: 420 };
  const replacement = await sharp(singlesSource)
    .extract({ left: 703, top: 330, width: 127, height: 420 })
    .resize(letterRegion.width, letterRegion.height, { fit: "fill" })
    .ensureAlpha()
    .png()
    .toBuffer();
  const paper = await sharp(containedDoublesSource)
    .extract({ left: 0, top: 0, width: 170, height: 300 })
    .resize(eraseRegion.width, eraseRegion.height, { fit: "fill" })
    .png()
    .toBuffer();
  const transparentReplacement = await stripPaper(replacement);
  return sharp(containedDoublesSource)
    .composite([
      {
        input: paper,
        left: eraseRegion.left,
        top: eraseRegion.top,
      },
      {
        input: transparentReplacement,
        left: letterRegion.left,
        top: letterRegion.top,
      },
    ])
    .png()
    .toBuffer();
}

async function verifyMastheadInternalPadding(referenceId, masthead) {
  const { data, info } = await sharp(masthead)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width;
  let right = -1;
  let top = info.height;
  let bottom = -1;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 32) continue;
    const pixel = (index - 3) / 4;
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  if (
    left < 8 ||
    right > info.width - 9 ||
    top < 8 ||
    bottom > info.height - 9
  ) {
    throw new Error(
      `${referenceId} masthead content ${left},${top}…${right},${bottom} touches its internal crop.`,
    );
  }
}

async function stripPaper(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const darkness = Math.max(0, (220 - Math.min(red, green, blue)) * 8);
    const saturation = Math.max(
      0,
      (Math.max(red, green, blue) - Math.min(red, green, blue) - 18) * 10,
    );
    data[index + 3] = Math.min(
      data[index + 3],
      255,
      Math.max(darkness, saturation),
    );
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function verifyMastheadSafeArea(referenceId, rendered, format) {
  const story = format === "story";
  const top = 0;
  const height = story ? 860 : 620;
  const { data, info } = await sharp(rendered)
    .extract({ left: 0, top, width: 1080, height })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let firstInk = info.width;
  let lastInk = -1;
  let firstInkY = info.height;
  let lastInkY = -1;
  for (let index = 0; index < data.length; index += info.channels) {
    if (data[index] + data[index + 1] + data[index + 2] > 210) continue;
    const x = (index / info.channels) % info.width;
    const y = Math.floor(index / info.channels / info.width);
    firstInk = Math.min(firstInk, x);
    lastInk = Math.max(lastInk, x);
    firstInkY = Math.min(firstInkY, y);
    lastInkY = Math.max(lastInkY, y);
  }
  const minimumY = story ? 250 : 100;
  const maximumY = story ? 760 : 560;
  if (
    firstInk < 64 ||
    lastInk > 1015 ||
    firstInkY < minimumY ||
    lastInkY > maximumY
  ) {
    throw new Error(
      `${referenceId}-${format} masthead ink ${firstInk},${firstInkY}…${lastInk},${lastInkY} crosses its protected region.`,
    );
  }
}

async function shiftQuickArtwork(referenceId, rendered) {
  const { height, width } = await sharp(rendered).metadata();
  if (!height || !width) throw new Error(`Missing dimensions: ${referenceId}`);
  if (referenceId === "quick-receipt") {
    const paper = await sharp(rendered)
      .extract({ height: 120, left: 940, top: height - 150, width: 120 })
      .ensureAlpha()
      .png()
      .toBuffer();
    const artwork = await sharp(rendered)
      .extract({ height: Math.min(1320, height), left: 0, top: 0, width: 820 })
      .png()
      .toBuffer();
    const base = await sharp({
      create: {
        background: { alpha: 1, b: 239, g: 241, r: 244 },
        channels: 4,
        height,
        width,
      },
    })
      .composite([{ input: paper, tile: true }])
      .png()
      .toBuffer();
    return sharp(base)
      .composite([{ input: artwork, left: -120, top: -20 }])
      .png()
      .toBuffer();
  }
  const artLeft = referenceId === "quick-frame" ? 420 : 430;
  const artwork = await sharp(rendered)
    .extract({ height, left: artLeft, top: 0, width: width - artLeft })
    .png()
    .toBuffer();
  const black = await sharp({
    create: {
      background: { alpha: 1, b: 0, g: 0, r: 0 },
      channels: 4,
      height,
      width: width - artLeft,
    },
  })
    .png()
    .toBuffer();
  return sharp(rendered)
    .composite([
      { input: black, left: artLeft, top: 0 },
      { input: artwork, left: artLeft + 90, top: 70 },
    ])
    .png()
    .toBuffer();
}

async function build() {
  await lockSources();
  await mkdir(outputDirectory, { recursive: true });
  await buildBrandLockup();
  for (const reference of references) {
    const cleaned = await cleanReference(reference);
    for (const [format, size] of Object.entries(sizes)) {
      const output = path.join(
        outputDirectory,
        `${reference.id}-${format}.webp`,
      );
      const sourceMetadata = await sharp(cleaned).metadata();
      if (!sourceMetadata.width || !sourceMetadata.height) {
        throw new Error(`${reference.id} has no measurable dimensions.`);
      }
      const scale = Math.max(
        size.width / sourceMetadata.width,
        size.height / sourceMetadata.height,
      );
      const scaledWidth = Math.ceil(sourceMetadata.width * scale);
      const scaledHeight = Math.round(sourceMetadata.height * scale);
      const top =
        format === "feed" ? Math.round(feedCropTop[reference.id] * scale) : 0;
      let rendered = await sharp(cleaned)
        .resize(scaledWidth, scaledHeight)
        .extract({
          left: Math.floor((scaledWidth - size.width) / 2),
          top,
          width: size.width,
          height: size.height,
        })
        .png()
        .toBuffer();
      if (format === "feed" && reference.id.startsWith("recap-")) {
        const footerPaper = await sharp(cleaned)
          .extract({
            left: 0,
            top: 1507,
            width: sourceMetadata.width,
            height: sourceMetadata.height - 1507,
          })
          .resize(size.width, 120, { fit: "fill" })
          .png()
          .toBuffer();
        rendered = await sharp(rendered)
          .composite([{ input: footerPaper, left: 0, top: 1230 }])
          .png()
          .toBuffer();
      }
      if (format === "feed" && reference.id === "quick-poster") {
        const tagline = await sharp(cleaned)
          .extract({ left: 40, top: 1455, width: 350, height: 115 })
          .resize(Math.round(350 * scale), Math.round(115 * scale))
          .png()
          .toBuffer();
        const footerBlack = await sharp(cleaned)
          .extract({ left: 0, top: 0, width: 30, height: 30 })
          .resize(size.width, 110, { fit: "fill" })
          .png()
          .toBuffer();
        rendered = await sharp(rendered)
          .composite([
            {
              input: tagline,
              left: Math.round(40 * scale),
              top: 1148,
            },
            { input: footerBlack, left: 0, top: 1240 },
          ])
          .png()
          .toBuffer();
      }
      if (reference.id.startsWith("quick-")) {
        rendered = await shiftQuickArtwork(reference.id, rendered);
      }
      const recapSource = rendered;
      if (reference.id.startsWith("recap-")) {
        rendered = await buildSafeRegularRecap(
          reference.id,
          recapSource,
          format,
        );
      }
      await sharp(rendered).webp({ effort: 6, quality: 90 }).toFile(output);
      const metadata = await sharp(output).metadata();
      if (metadata.width !== size.width || metadata.height !== size.height) {
        throw new Error(`${path.basename(output)} has the wrong dimensions.`);
      }
      console.log(
        `${path.relative(root, output)} ${size.width}x${size.height}`,
      );
      if (reference.id.startsWith("recap-")) {
        const dense = await buildDensityRecap(
          reference.id,
          recapSource,
          format,
          "dense",
        );
        const denseOutput = path.join(
          outputDirectory,
          `${reference.id}-dense-${format}.webp`,
        );
        await sharp(dense).webp({ effort: 6, quality: 90 }).toFile(denseOutput);
        const denseMetadata = await sharp(denseOutput).metadata();
        if (
          denseMetadata.width !== size.width ||
          denseMetadata.height !== size.height
        ) {
          throw new Error(
            `${path.basename(denseOutput)} has the wrong dimensions.`,
          );
        }
        console.log(
          `${path.relative(root, denseOutput)} ${size.width}x${size.height}`,
        );
        const compact = await buildDensityRecap(
          reference.id,
          recapSource,
          format,
          "compact",
        );
        const compactOutput = path.join(
          outputDirectory,
          `${reference.id}-compact-${format}.webp`,
        );
        await sharp(compact)
          .webp({ effort: 6, quality: 90 })
          .toFile(compactOutput);
        const compactMetadata = await sharp(compactOutput).metadata();
        if (
          compactMetadata.width !== size.width ||
          compactMetadata.height !== size.height
        ) {
          throw new Error(
            `${path.basename(compactOutput)} has the wrong dimensions.`,
          );
        }
        console.log(
          `${path.relative(root, compactOutput)} ${size.width}x${size.height}`,
        );
      }
    }
  }
}

await build();
