import {
  type BrandLockupAssets,
  drawBrandLockup,
  shareColors,
  shareFittedText,
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
  let nameSize = fittedSize(nameLines);
  const winsSize = fittedSize(["WINS"]);
  context.font = `${weight} ${winsSize}px '${options.family}', sans-serif`;
  const winsTop =
    winsBaseline -
    (context.measureText("WINS").actualBoundingBoxAscent || winsSize * 0.75);
  const positionName = () => {
    context.font = `${weight} ${nameSize}px '${options.family}', sans-serif`;
    const metrics = nameLines.map((line) =>
      context.measureText(line.toUpperCase()),
    );
    const descent = Math.max(
      ...metrics.map((metric) => metric.actualBoundingBoxDescent ?? 0),
    );
    const lineStep = Math.max(
      Math.round(nameSize * 1.04),
      Math.ceil(
        Math.max(
          ...metrics.map(
            (metric) =>
              (metric.actualBoundingBoxAscent || nameSize * 0.75) +
              (metric.actualBoundingBoxDescent ?? 0),
          ),
        ) +
          nameSize * 0.08,
      ),
    );
    const lastBaseline =
      winsTop - Math.max(10, Math.round(nameSize * 0.08)) - descent;
    const baselines = nameLines.map(
      (_, index) => lastBaseline - (nameLines.length - index - 1) * lineStep,
    );
    const firstTop =
      baselines[0] - (metrics[0].actualBoundingBoxAscent || nameSize * 0.75);
    return { baselines, firstTop };
  };
  let positioned = positionName();
  while (nameSize > minSize && positioned.firstTop < top) {
    nameSize -= 2;
    positioned = positionName();
  }
  context.restore();
  nameLines.forEach((line, index) => {
    shareFittedText(
      context,
      line.toUpperCase(),
      x,
      positioned.baselines[index],
      {
        align: options.align,
        color: options.color,
        family: `'${options.family}', sans-serif`,
        maxSize: nameSize,
        maxWidth: options.maxWidth,
        minSize: nameSize,
        weight,
      },
    );
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
    scoreMinSize?: number;
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
    minSize: options.scoreMinSize ?? Math.round(options.scoreSize * 0.55),
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
