import {
  type BrandLockupAssets,
  drawBrandLockup,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { quickWinnerLines } from "./quick-winner-lines";

export { quickWinnerLines } from "./quick-winner-lines";

export interface QuickShareCardData {
  date: string;
  format: "SINGLES" | "DOUBLES";
  heading: [string, string];
  loserName: string;
  loserScore: number;
  winnerName: string;
  winnerScore: number;
}

export function drawQuickHeading(
  context: CanvasRenderingContext2D,
  lines: QuickShareCardData["heading"],
  x: number,
  y: number,
  options: {
    align?: CanvasTextAlign;
    color: string;
    lineHeight?: number;
    secondSize?: number;
    size: number;
    tracking?: number;
  },
) {
  lines.forEach((line, index) => {
    const size =
      index === 1 ? (options.secondSize ?? options.size) : options.size;
    if (options.tracking) {
      context.save();
      context.letterSpacing = `${options.tracking}px`;
      shareText(
        context,
        line,
        x,
        y + index * (options.lineHeight ?? options.size * 1.25),
        {
          align: options.align,
          color: options.color,
          font: `800 ${size}px Manrope, sans-serif`,
        },
      );
      context.restore();
      return;
    }
    shareText(context, line, x, y + index * options.size * 1.25, {
      align: options.align,
      color: options.color,
      font: `800 ${size}px Manrope, sans-serif`,
    });
  });
}

export function drawQuickWinner(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  top: number,
  options: {
    align?: CanvasTextAlign;
    color: string;
    family: "Anton" | "Archivo Black" | "Roboto Condensed";
    lineHeight: number;
    maxHeight?: number;
    maxSize?: number;
    maxWidth: number;
    minSize?: number;
  },
) {
  context.save();
  const weight = options.family === "Roboto Condensed" ? 900 : 400;
  const minSize = options.minSize ?? Math.round(options.lineHeight * 0.44);
  context.font = `${weight} ${minSize}px '${options.family}', sans-serif`;
  const nameLines = quickWinnerLines(
    value,
    (line) => context.measureText(line.toUpperCase()).width <= options.maxWidth,
  );
  const winsBaseline = top + (options.maxHeight ?? options.lineHeight * 2);
  const maxSize = Math.min(
    options.maxSize ?? options.lineHeight,
    Math.round(options.lineHeight * 1.25),
  );
  const fittedSize = (values: string[]) => {
    let size = maxSize;
    while (size > minSize) {
      context.font = `${weight} ${size}px '${options.family}', sans-serif`;
      if (
        values.every(
          (line) =>
            context.measureText(line.toUpperCase()).width <= options.maxWidth,
        )
      )
        break;
      size -= 2;
    }
    return size;
  };
  const nameSize = fittedSize(nameLines);
  const winsSize = fittedSize(["WINS"]);
  context.font = `${weight} ${winsSize}px '${options.family}', sans-serif`;
  const winsTop =
    winsBaseline -
    (context.measureText("WINS").actualBoundingBoxAscent || winsSize * 0.75);
  context.font = `${weight} ${nameSize}px '${options.family}', sans-serif`;
  const nameDescent =
    context.measureText("Hg").actualBoundingBoxDescent || nameSize * 0.2;
  const lastNameBaseline =
    winsTop - Math.max(12, Math.round(nameSize * 0.35)) - nameDescent;
  const nameBaselines =
    nameLines.length === 1
      ? [top + options.lineHeight]
      : nameLines.map(
          (_, index) =>
            lastNameBaseline -
            (nameLines.length - index - 1) * Math.round(nameSize * 1.15),
        );
  context.restore();
  nameLines.forEach((line, index) => {
    shareFittedText(context, line.toUpperCase(), x, nameBaselines[index], {
      align: options.align,
      color: options.color,
      family: `'${options.family}', sans-serif`,
      maxSize: nameSize,
      maxWidth: options.maxWidth,
      minSize: nameSize,
      weight,
    });
  });
  shareFittedText(context, "WINS", x, winsBaseline, {
    align: options.align,
    color: options.color,
    family: `'${options.family}', sans-serif`,
    maxSize: winsSize,
    maxWidth: options.maxWidth,
    minSize: minSize,
    weight,
  });
  return winsBaseline;
}

export function drawQuickStackedScore(
  context: CanvasRenderingContext2D,
  data: QuickShareCardData,
  x: number,
  positions: [number, number, number],
  maxWidth: number,
  scoreSize: number,
  horizontalScale = 1,
  options: {
    family?: "Anton" | "Roboto Slab";
    separatorBox?: { height: number; width: number };
    separatorScale?: number;
    weight?: number;
  } = {},
) {
  [data.winnerScore, "–", data.loserScore].forEach((value, index) => {
    context.save();
    context.translate(x, 0);
    context.scale(horizontalScale, 1);
    if (index === 1 && options.separatorBox) {
      context.fillStyle = shareColors.court;
      context.fillRect(
        -options.separatorBox.width / horizontalScale / 2,
        positions[index] - options.separatorBox.height / 2,
        options.separatorBox.width / horizontalScale,
        options.separatorBox.height,
      );
      context.restore();
      return;
    }
    shareFittedText(context, String(value), 0, positions[index], {
      align: "center",
      color: shareColors.court,
      family: `'${options.family ?? "Roboto Slab"}', ${options.family === "Anton" ? "sans-serif" : "serif"}`,
      maxSize:
        index === 1
          ? Math.round(scoreSize * (options.separatorScale ?? 0.48))
          : scoreSize,
      maxWidth: maxWidth / horizontalScale,
      minSize: Math.round(scoreSize * 0.5),
      weight: options.weight ?? 900,
    });
    context.restore();
  });
}

export function drawQuickInlineResult(
  context: CanvasRenderingContext2D,
  data: QuickShareCardData,
  x: number,
  scoreY: number,
  options: {
    align?: CanvasTextAlign;
    color: string;
    maxWidth: number;
    opponentAlign?: CanvasTextAlign;
    opponentMaxWidth?: number;
    opponentHorizontalScale?: number;
    opponentSize?: number;
    opponentWeight?: number;
    opponentX?: number;
    opponentY: number;
    scoreColor: string;
    scoreFamily?: "Alfa Slab One" | "Roboto Slab";
    scoreHorizontalScale?: number;
    scoreSize: number;
    scoreWeight?: number;
  },
) {
  const score = `${data.winnerScore}–${data.loserScore}`;
  const scoreOptions = {
    align: options.align,
    color: options.scoreColor,
    family: `'${options.scoreFamily ?? "Roboto Slab"}', serif`,
    maxSize: options.scoreSize,
    maxWidth: options.maxWidth,
    minSize: Math.round(options.scoreSize * 0.55),
    weight: options.scoreWeight ?? 900,
  };
  if (options.scoreHorizontalScale) {
    context.save();
    context.translate(x, 0);
    context.scale(options.scoreHorizontalScale, 1);
    shareFittedText(context, score, 0, scoreY, {
      ...scoreOptions,
      maxWidth: options.maxWidth / options.scoreHorizontalScale,
    });
    context.restore();
  } else {
    shareFittedText(context, score, x, scoreY, scoreOptions);
  }
  const opponent = `over ${data.loserName}`;
  const opponentOptions = {
    align: options.opponentAlign ?? options.align,
    color: options.color,
    family: "Manrope, sans-serif",
    maxSize: options.opponentSize ?? Math.round(options.scoreSize * 0.18),
    maxWidth: options.opponentMaxWidth ?? options.maxWidth,
    minSize: 24,
    weight: options.opponentWeight ?? 700,
  };
  const opponentX = options.opponentX ?? x;
  if (options.opponentHorizontalScale) {
    context.save();
    context.translate(opponentX, 0);
    context.scale(options.opponentHorizontalScale, 1);
    shareFittedText(context, opponent, 0, options.opponentY, {
      ...opponentOptions,
      maxWidth: opponentOptions.maxWidth / options.opponentHorizontalScale,
    });
    context.restore();
  } else {
    shareFittedText(
      context,
      opponent,
      opponentX,
      options.opponentY,
      opponentOptions,
    );
  }
}

export function drawQuickFooter(
  context: CanvasRenderingContext2D,
  lockup: BrandLockupAssets,
  centerX: number,
  centerY: number,
  color: string,
  width: number,
) {
  drawBrandLockup(
    context,
    lockup,
    centerX,
    centerY,
    width,
    color === shareColors.chalk ? "chalk" : "ink",
  );
}
