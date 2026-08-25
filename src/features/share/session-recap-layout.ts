import type { SessionRecapSection } from "../../history";
import { RECAP_ROWS_PER_PAGE } from "../../history";
import type { ShareFormat } from "./share-format";

let recapTextScratch: HTMLCanvasElement | null = null;

export function centeredRecapRasterTop(
  top: number,
  bottom: number,
  inkTop: number,
  inkBottom: number,
) {
  return Math.round((top + bottom - inkTop - inkBottom) / 2);
}

export function drawRasterCenteredRecapText(
  context: CanvasRenderingContext2D,
  value: string,
  font: string,
  size: number,
  x: number,
  top: number,
  bottom: number,
  align: "left" | "right",
) {
  recapTextScratch ??= document.createElement("canvas");
  const padding = 8;
  context.font = font;
  const metrics = context.measureText(value);
  const ascent = Number.isFinite(metrics.actualBoundingBoxAscent)
    ? metrics.actualBoundingBoxAscent
    : size * 0.75;
  const descent = Number.isFinite(metrics.actualBoundingBoxDescent)
    ? metrics.actualBoundingBoxDescent
    : size * 0.2;
  recapTextScratch.width = Math.max(1, Math.ceil(metrics.width + padding * 2));
  recapTextScratch.height = Math.max(
    1,
    Math.ceil(ascent + descent + padding * 2),
  );
  const scratch = recapTextScratch.getContext("2d", {
    willReadFrequently: true,
  });
  if (!scratch) return;
  const scratchBaseline = padding + ascent;
  scratch.font = font;
  scratch.fillStyle = "#000";
  scratch.textAlign = "left";
  scratch.textBaseline = "alphabetic";
  scratch.fillText(value, padding, scratchBaseline);
  const pixels = scratch.getImageData(
    0,
    0,
    recapTextScratch.width,
    recapTextScratch.height,
  ).data;
  let inkTop = recapTextScratch.height;
  let inkBottom = -1;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 32) continue;
    const y = Math.floor(index / 4 / recapTextScratch.width);
    inkTop = Math.min(inkTop, y);
    inkBottom = Math.max(inkBottom, y);
  }
  if (inkBottom < 0) return;
  const destinationX =
    align === "right" ? x - padding - metrics.width : x - padding;
  context.drawImage(
    recapTextScratch,
    destinationX,
    centeredRecapRasterTop(top, bottom, inkTop, inkBottom),
  );
}

export function sessionRecapTemplatePath(
  section: SessionRecapSection["format"],
  format: ShareFormat,
  rowCount = 0,
) {
  const density = rowCount >= 9 ? "-compact" : rowCount >= 7 ? "-dense" : "";
  return `/share/templates/recap-${section}${density}-${format}.webp`;
}

export function sessionRecapLayoutRowCount(
  visibleRows: number,
  pageCount: number,
) {
  return pageCount > 1 ? RECAP_ROWS_PER_PAGE : visibleRows;
}

export function sessionRecapTableLayout(
  section: SessionRecapSection["format"],
  rowCount: number,
  format: ShareFormat,
) {
  const density =
    rowCount >= 9 ? "compact" : rowCount >= 7 ? "dense" : "regular";
  const profile = tableProfile(section, format, density, rowCount);
  return {
    ...profile,
    density,
    dense: density !== "regular",
    rowRules: Array.from(
      { length: rowCount + 1 },
      (_, index) => profile.firstRuleY + index * profile.rowPitch,
    ),
  };
}

function tableProfile(
  section: SessionRecapSection["format"],
  format: ShareFormat,
  density: "regular" | "dense" | "compact",
  rowCount: number,
) {
  if (density === "regular" && format === "feed") {
    return {
      firstRuleY: section === "singles" ? 847 : 762,
      headerFontSize: 26,
      headerTop: section === "singles" ? 802 : 714,
      noteY: 1194,
      pageY: 1220,
      rowFontSize: 34,
      rowPitch: section === "singles" && rowCount === 6 ? 52 : 64,
    } as const;
  }
  if (density === "regular") {
    return section === "singles"
      ? ({
          firstRuleY: 1208,
          headerFontSize: 34,
          headerTop: 1128,
          noteY: 1669,
          pageY: 1720,
          rowFontSize: 54,
          rowPitch: rowCount === 6 ? 70 : 81,
        } as const)
      : ({
          firstRuleY: 960,
          headerFontSize: 34,
          headerTop: 880,
          noteY: 1669,
          pageY: 1720,
          rowFontSize: 54,
          rowPitch: 82,
        } as const);
  }
  if (density === "dense" && format === "feed") {
    return {
      firstRuleY: 690,
      headerFontSize: 26,
      headerTop: 624,
      noteY: 1179,
      pageY: 1208,
      rowFontSize: 34,
      rowPitch: Math.min(64, Math.floor(448 / rowCount)),
    } as const;
  }
  if (density === "dense") {
    return {
      firstRuleY: 930,
      headerFontSize: 34,
      headerTop: 852,
      noteY: 1620,
      pageY: 1660,
      rowFontSize: 48,
      rowPitch: Math.min(82, Math.floor(624 / rowCount)),
    } as const;
  }
  return format === "feed"
    ? ({
        firstRuleY: 600,
        headerFontSize: 24,
        headerTop: 552,
        noteY: 1178,
        pageY: 1212,
        rowFontSize: 32,
        rowPitch: Math.min(60, Math.floor(540 / rowCount)),
      } as const)
    : ({
        firstRuleY: 870,
        headerFontSize: 34,
        headerTop: 812,
        noteY: 1640,
        pageY: 1690,
        rowFontSize: 44,
        rowPitch: Math.min(72, Math.floor(720 / rowCount)),
      } as const);
}

export function sessionRecapSubtitleY(
  section: SessionRecapSection["format"],
  rowCount: number,
  format: ShareFormat,
) {
  if (rowCount >= 9) return format === "story" ? 750 : 510;
  if (rowCount >= 7) return format === "story" ? 810 : 590;
  if (format === "story") return section === "singles" ? 1009 : 810;
  return section === "singles" ? 722 : 640;
}

export function sessionRecapDateLayout(
  section: SessionRecapSection["format"],
  format: ShareFormat,
) {
  if (format === "story") {
    return {
      fontSize: section === "singles" ? 36 : 30,
      letterSpacing: section === "singles" ? 7 : 6,
      x: 547,
      y: 135,
    };
  }
  return { fontSize: 24, letterSpacing: 5, x: 540, y: 64 };
}

export function sessionRecapFooterLayout(format: ShareFormat) {
  return format === "story"
    ? {
        centerX: 540,
        centerY: 1815,
        width: 420,
      }
    : {
        centerX: 540,
        centerY: 1280,
        width: 280,
      };
}

export function sessionRecapNote(
  section: Pick<SessionRecapSection, "showDifferential" | "topPair">,
) {
  if (!section.showDifferential) {
    return "MIXED RULES · POINT DIFFERENTIAL OMITTED";
  }
  return section.topPair
    ? `TOP PAIR · ${section.topPair.names.join(" + ")} · ${section.topPair.wins}–${section.topPair.losses}`.toUpperCase()
    : null;
}
