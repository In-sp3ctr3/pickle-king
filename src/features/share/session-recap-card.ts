import type { RecapPlayerRecord, SessionRecapSection } from "../../history";
import {
  drawBrandLockup,
  fitCanvasText,
  shareCanvasSurface,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { shareDimensions, type ShareFormat } from "./share-format";
import {
  drawRasterCenteredRecapText,
  sessionRecapDateLayout,
  sessionRecapFooterLayout,
  sessionRecapLayoutRowCount,
  sessionRecapNote,
  sessionRecapSubtitleY,
  sessionRecapTableLayout,
  sessionRecapTemplatePath,
} from "./session-recap-layout";

export * from "./session-recap-layout";

const ink = "#10110f";

export async function sessionRecapCanvas(
  section: SessionRecapSection,
  players: RecapPlayerRecord[],
  options: { dateLabel: string; page: number; pageCount: number },
  format: ShareFormat,
) {
  const { width, height } = shareDimensions(format);
  const layoutRowCount = sessionRecapLayoutRowCount(
    players.length,
    options.pageCount,
  );
  const { context, element, lockup } = await shareCanvasSurface(
    width,
    height,
    sessionRecapTemplatePath(section.format, format, layoutRowCount),
  );
  const story = format === "story";
  const date = sessionRecapDateLayout(section.format, format);
  const table = sessionRecapTableLayout(section.format, layoutRowCount, format);

  drawReceiptDate(context, options.dateLabel, date);
  if (section.format === "singles") {
    context.fillStyle = "#b6d800";
    context.fillRect(width / 2 - 186, story ? 164 : 88, 372, 3);
  }

  drawRecapSubtitle(
    context,
    section.format,
    sessionRecapSubtitleY(section.format, layoutRowCount, format),
    story,
  );
  drawTable(context, players, section.showDifferential, table, story);
  drawSectionNote(context, section, table.noteY);

  if (options.pageCount > 1) {
    shareText(
      context,
      `PAGE ${options.page + 1} OF ${options.pageCount}`,
      width / 2,
      table.pageY,
      {
        align: "center",
        color: table.dense ? ink : "#53564f",
        font: `800 ${table.dense ? 24 : 18}px Manrope, sans-serif`,
      },
    );
  }
  const footer = sessionRecapFooterLayout(format);
  drawBrandLockup(
    context,
    lockup,
    footer.centerX,
    footer.centerY,
    footer.width,
  );
  return element;
}

function drawRecapSubtitle(
  context: CanvasRenderingContext2D,
  section: SessionRecapSection["format"],
  baseline: number,
  story: boolean,
) {
  const value =
    section === "singles" ? "PLAYER STANDINGS" : "ROTATING PARTNERS";
  const fontSize = story ? 30 : 22;
  context.save();
  context.fillStyle = ink;
  context.font = `700 ${fontSize}px Manrope, sans-serif`;
  context.letterSpacing = `${story ? 4 : 3}px`;
  context.textAlign = "center";
  context.fillText(value, 540, baseline);
  const metrics = context.measureText(value);
  const centerY =
    baseline -
    (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  const halfWidth = metrics.width / 2;
  rule(context, 158, centerY, 540 - halfWidth - 24);
  rule(context, 540 + halfWidth + 24, centerY, 922);
  context.restore();
}

function drawReceiptDate(
  context: CanvasRenderingContext2D,
  value: string,
  layout: ReturnType<typeof sessionRecapDateLayout>,
) {
  context.save();
  context.fillStyle = ink;
  context.font = `800 ${layout.fontSize}px Manrope, sans-serif`;
  context.letterSpacing = `${layout.letterSpacing}px`;
  context.textAlign = "center";
  context.fillText(value, layout.x, layout.y);
  context.restore();
}

function drawTable(
  context: CanvasRenderingContext2D,
  players: RecapPlayerRecord[],
  showDifferential: boolean,
  layout: ReturnType<typeof sessionRecapTableLayout>,
  story: boolean,
) {
  const left = story ? 142 : 128;
  const right = story ? 938 : 952;
  const nameX = left + 8;
  const recordX = story ? 650 : showDifferential ? 690 : 890;
  const differentialX = story ? 902 : 922;
  const rowSize = layout.rowFontSize;
  drawCenteredText(
    context,
    "PLAYER",
    nameX,
    layout.headerTop,
    layout.firstRuleY,
    layout.headerFontSize,
    "left",
  );
  drawCenteredText(
    context,
    "W–L",
    recordX,
    layout.headerTop,
    layout.firstRuleY,
    layout.headerFontSize,
    "right",
  );
  if (showDifferential) {
    drawCenteredText(
      context,
      "+/−",
      differentialX,
      layout.headerTop,
      layout.firstRuleY,
      layout.headerFontSize,
      "right",
    );
  }
  rule(context, left, layout.firstRuleY, right);
  players.forEach((player, index) => {
    const topRule = layout.rowRules[index];
    const bottomRule = layout.rowRules[index + 1];
    drawCenteredFittedText(
      context,
      player.name,
      nameX,
      {
        maxSize: rowSize,
        maxWidth: showDifferential ? 470 : 610,
        minSize: story ? 42 : 28,
      },
      topRule,
      bottomRule,
    );
    drawCenteredText(
      context,
      `${player.wins}–${player.losses}`,
      recordX,
      topRule,
      bottomRule,
      rowSize,
      "right",
    );
    if (showDifferential) {
      drawCenteredText(
        context,
        `${player.differential > 0 ? "+" : ""}${player.differential}`,
        differentialX,
        topRule,
        bottomRule,
        rowSize,
        "right",
      );
    }
    rule(context, left, bottomRule, right);
  });
}

function drawCenteredFittedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  options: { maxSize: number; maxWidth: number; minSize: number },
  top: number,
  bottom: number,
) {
  let size = options.maxSize;
  let font = `700 ${size}px 'Roboto Condensed', sans-serif`;
  context.font = font;
  while (
    size > options.minSize &&
    context.measureText(value).width > options.maxWidth
  ) {
    size -= 2;
    font = `700 ${size}px 'Roboto Condensed', sans-serif`;
    context.font = font;
  }
  const fitted = fitCanvasText(context, value, options.maxWidth);
  drawRasterCenteredRecapText(
    context,
    fitted,
    font,
    size,
    x,
    top,
    bottom,
    "left",
  );
}

function drawCenteredText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  top: number,
  bottom: number,
  size: number,
  align: CanvasTextAlign,
) {
  const font = `700 ${size}px 'Roboto Condensed', sans-serif`;
  drawRasterCenteredRecapText(
    context,
    value,
    font,
    size,
    x,
    top,
    bottom,
    align === "right" ? "right" : "left",
  );
}

function drawSectionNote(
  context: CanvasRenderingContext2D,
  section: SessionRecapSection,
  baseline: number,
) {
  const note = sessionRecapNote(section);
  if (!note) return;
  shareFittedText(context, note, 540, baseline, {
    align: "center",
    color: ink,
    family: "'Roboto Condensed', sans-serif",
    maxSize: 34,
    maxWidth: 860,
    minSize: 24,
    weight: 900,
  });
}

function rule(
  context: CanvasRenderingContext2D,
  start: number,
  y: number,
  end: number,
) {
  context.strokeStyle = ink;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(start, y);
  context.lineTo(end, y);
  context.stroke();
}

export function sessionRecapFileName(
  dateLabel: string,
  format: SessionRecapSection["format"],
  page: number,
  pageCount: number,
) {
  const date = dateLabel
    .replace(/ receipts$/i, "")
    .replace(/[–—]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `pickle-king-${date}-${format}-receipts-${page + 1}-of-${pageCount}.png`;
}
