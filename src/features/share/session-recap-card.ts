import type { RecapPlayerRecord, SessionRecapSection } from "../../history";
import {
  drawBrandMark,
  shareCanvasSurface,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { shareDimensions, type ShareFormat } from "./share-format";

const cream = "#f4f0e7";
const ink = "#10110f";
const lime = "#c8f000";

export async function sessionRecapCanvas(
  section: SessionRecapSection,
  players: RecapPlayerRecord[],
  options: { dateLabel: string; page: number; pageCount: number },
  format: ShareFormat,
) {
  const { width, height } = shareDimensions(format);
  const { context, element, mark } = await shareCanvasSurface(width, height);
  const story = format === "story";
  context.fillStyle = cream;
  context.fillRect(0, 0, width, height);
  drawPaperTexture(context, width, height);

  shareText(context, options.dateLabel, width / 2, story ? 128 : 96, {
    align: "center",
    color: ink,
    font: "900 30px 'Archivo Black', sans-serif",
  });
  context.fillStyle = lime;
  context.fillRect(width / 2 - 128, story ? 154 : 122, 256, 3);

  const headingY = story ? 650 : 440;
  shareFittedText(context, section.format.toUpperCase(), width / 2, headingY, {
    align: "center",
    color: ink,
    maxSize: section.format === "singles" ? 224 : 194,
    maxWidth: width - 92,
    minSize: 154,
  });
  drawBrandMark(context, mark, width - 88, headingY + 26, 98);

  const subtitleY = story ? 796 : 564;
  rule(context, 146, subtitleY - 12, 318);
  rule(context, width - 318, subtitleY - 12, width - 146);
  shareText(
    context,
    section.format === "doubles" ? "ROTATING PARTNERS" : "PLAYER RECORDS",
    width / 2,
    subtitleY,
    {
      align: "center",
      color: ink,
      font: "900 27px 'Archivo Black', sans-serif",
    },
  );

  const tableTop = story ? 860 : 618;
  const footerHeight = story ? 350 : 250;
  const tableBottom = height - footerHeight;
  context.fillStyle = lime;
  context.fillRect(0, tableTop, width, tableBottom - tableTop);
  drawTable(context, players, section.showDifferential, tableTop, tableBottom);

  const footerY = tableBottom + (story ? 90 : 64);
  let detailRows = 0;
  if (section.topPair) {
    shareFittedText(
      context,
      `TOP PAIR · ${section.topPair.names.join(" + ")} · ${section.topPair.wins}–${section.topPair.losses}`.toUpperCase(),
      width / 2,
      footerY,
      {
        align: "center",
        color: ink,
        maxSize: 26,
        maxWidth: width - 128,
        minSize: 22,
      },
    );
    detailRows += 1;
  }
  if (!section.showDifferential) {
    shareText(
      context,
      "MIXED RULES · POINT DIFFERENTIAL OMITTED",
      width / 2,
      footerY + detailRows * 38,
      {
        align: "center",
        color: ink,
        font: "900 22px 'Archivo Black', sans-serif",
      },
    );
    detailRows += 1;
  }
  shareText(
    context,
    `PAGE ${options.page + 1} OF ${options.pageCount}`,
    width / 2,
    footerY + 56 + Math.max(0, detailRows - 1) * 28,
    {
      align: "center",
      color: "#53564f",
      font: "800 19px Manrope, sans-serif",
    },
  );
  shareText(context, "PICKLE KING", width / 2, height - 46, {
    align: "center",
    color: ink,
    font: "900 25px 'Archivo Black', sans-serif",
  });
  return element;
}

function drawTable(
  context: CanvasRenderingContext2D,
  players: RecapPlayerRecord[],
  showDifferential: boolean,
  top: number,
  bottom: number,
) {
  const left = 106;
  const right = 974;
  const nameWidth = showDifferential ? 460 : 560;
  const gpX = showDifferential ? 640 : 730;
  const recordX = showDifferential ? 780 : 900;
  const differentialX = 952;
  const headerY = top + 72;
  const rowHeight = Math.min(112, (bottom - headerY - 34) / players.length);
  const labelFont = "900 25px 'Archivo Black', sans-serif";
  shareText(context, "PLAYER", left, headerY, { color: ink, font: labelFont });
  shareText(context, "GP", gpX, headerY, {
    align: "right",
    color: ink,
    font: labelFont,
  });
  shareText(context, "W–L", recordX, headerY, {
    align: "right",
    color: ink,
    font: labelFont,
  });
  if (showDifferential) {
    shareText(context, "+/−", differentialX, headerY, {
      align: "right",
      color: ink,
      font: labelFont,
    });
  }
  rule(context, left, headerY + 28, right);
  players.forEach((player, index) => {
    const y = headerY + 82 + index * rowHeight;
    shareFittedText(context, player.name, left, y, {
      color: ink,
      maxSize: 43,
      maxWidth: nameWidth,
      minSize: 30,
    });
    shareText(context, String(player.gamesPlayed), gpX, y, {
      align: "right",
      color: ink,
      font: "900 38px 'Archivo Black', sans-serif",
    });
    shareText(context, `${player.wins}–${player.losses}`, recordX, y, {
      align: "right",
      color: ink,
      font: "900 38px 'Archivo Black', sans-serif",
    });
    if (showDifferential) {
      shareText(
        context,
        `${player.differential > 0 ? "+" : ""}${player.differential}`,
        differentialX,
        y,
        {
          align: "right",
          color: ink,
          font: "900 38px 'Archivo Black', sans-serif",
        },
      );
    }
    if (index < players.length - 1) rule(context, left, y + 30, right);
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

function drawPaperTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = "rgba(16, 17, 15, 0.025)";
  for (let index = 0; index < 420; index += 1) {
    const x = (index * 73) % width;
    const y = (index * 149) % height;
    context.fillRect(x, y, 2 + (index % 3), 1);
  }
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
