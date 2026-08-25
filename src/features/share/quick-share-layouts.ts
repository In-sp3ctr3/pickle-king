import {
  type BrandLockupAssets,
  shareColors,
  shareFittedText,
} from "./share-canvas";
import type { QuickShareStyle } from "./quick-share-card";
import {
  drawQuickFooter,
  drawQuickHeading,
  drawQuickInlineResult,
  drawQuickStackedScore,
  drawQuickWinner,
  type QuickShareCardData,
} from "./quick-share-layout-helpers";

export type { QuickShareCardData } from "./quick-share-layout-helpers";

export function drawQuickShareLayout(
  context: CanvasRenderingContext2D,
  lockup: BrandLockupAssets,
  data: QuickShareCardData,
  width: number,
  height: number,
  style: QuickShareStyle,
) {
  if (style === "frame") drawFrame(context, lockup, data, width, height);
  else if (style === "receipt")
    drawReceipt(context, lockup, data, width, height);
  else drawPoster(context, lockup, data, width, height);
}

function drawPoster(
  context: CanvasRenderingContext2D,
  lockup: BrandLockupAssets,
  data: QuickShareCardData,
  width: number,
  height: number,
) {
  const story = height > 1500;
  drawQuickHeading(context, data.heading, 68, story ? 135 : 78, {
    color: shareColors.chalk,
    lineHeight: story ? 44 : undefined,
    size: story ? 36 : 21,
  });
  drawQuickWinner(context, data.winnerName, 68, story ? 109 : 128, {
    color: shareColors.chalk,
    family: "Anton",
    lineHeight: story ? 250 : 130,
    maxHeight: story ? 500 : undefined,
    maxSize: story ? 313 : undefined,
    maxWidth: story ? 355 : 370,
    minSize: story ? 46 : 36,
  });
  if (story) {
    drawQuickStackedScore(
      context,
      data,
      228,
      [1048, 1124, 1550],
      300,
      403,
      1.32,
      {
        family: "Anton",
        separatorBox: { height: 54, width: 120 },
        weight: 400,
      },
    );
    shareFittedText(context, `over ${data.loserName}`, 239, 1614, {
      align: "center",
      color: shareColors.court,
      family: "Manrope, sans-serif",
      maxSize: 46,
      maxWidth: 340,
      minSize: 24,
      weight: 800,
    });
    drawQuickFooter(context, lockup, width / 2, 1844, shareColors.chalk, 320);
  } else {
    drawQuickStackedScore(context, data, 242, [820, 860, 1040], 285, 170, 1, {
      family: "Anton",
      separatorBox: { height: 12, width: 76 },
      weight: 400,
    });
    shareFittedText(context, `over ${data.loserName}`, 242, 1125, {
      align: "center",
      color: shareColors.court,
      family: "Manrope, sans-serif",
      maxSize: 27,
      maxWidth: 310,
      minSize: 20,
      weight: 800,
    });
    drawQuickFooter(context, lockup, width / 2, 1300, shareColors.chalk, 280);
  }
}

function drawFrame(
  context: CanvasRenderingContext2D,
  lockup: BrandLockupAssets,
  data: QuickShareCardData,
  width: number,
  height: number,
) {
  const story = height > 1500;
  drawQuickHeading(context, data.heading, 106, story ? 135 : 118, {
    color: shareColors.limeDeep,
    lineHeight: story ? 40 : undefined,
    size: story ? 32 : 20,
  });
  const winsY = drawQuickWinner(
    context,
    data.winnerName,
    story ? 120 : 104,
    story ? 964 : 650,
    {
      color: shareColors.chalk,
      family: "Anton",
      lineHeight: story ? 218 : 115,
      maxHeight: story ? 436 : undefined,
      maxSize: story ? 238 : undefined,
      maxWidth: story ? 423 : 430,
      minSize: story ? 46 : 36,
    },
  );
  drawQuickInlineResult(
    context,
    data,
    story ? 131 : 104,
    story ? 1648 : winsY + 205,
    {
      color: shareColors.chalk,
      maxWidth: story ? 800 : 420,
      opponentHorizontalScale: story ? 1.15 : undefined,
      opponentMaxWidth: story ? 300 : undefined,
      opponentSize: story ? 40 : 30,
      opponentWeight: story ? 400 : undefined,
      opponentX: story ? 128 : undefined,
      opponentY: story ? 1717 : winsY + 270,
      scoreColor: shareColors.limeDeep,
      scoreFamily: story ? "Alfa Slab One" : undefined,
      scoreHorizontalScale: story ? 1.17 : undefined,
      scoreSize: story ? 295 : 205,
      scoreWeight: story ? 400 : undefined,
    },
  );
  if (story) {
    drawQuickFooter(context, lockup, width / 2, 1805, shareColors.chalk, 320);
  } else {
    drawQuickFooter(context, lockup, width / 2, 1280, shareColors.chalk, 280);
  }
}

function drawReceipt(
  context: CanvasRenderingContext2D,
  lockup: BrandLockupAssets,
  data: QuickShareCardData,
  width: number,
  height: number,
) {
  const story = height > 1500;
  drawQuickHeading(context, data.heading, width - 70, story ? 102 : 82, {
    align: "right",
    color: shareColors.court,
    lineHeight: story ? 40 : 32,
    secondSize: story ? 26 : 22,
    size: story ? 34 : 28,
    tracking: story ? 4 : 3,
  });
  drawQuickWinner(
    context,
    data.winnerName,
    width - (story ? 66 : 70),
    story ? 1121 : 700,
    {
      align: "right",
      color: shareColors.court,
      family: "Archivo Black",
      lineHeight: story ? 132 : 105,
      maxHeight: story ? 264 : 210,
      maxSize: story ? 164 : 130,
      maxWidth: story ? 465 : 300,
      minSize: story ? 46 : 36,
    },
  );
  drawQuickInlineResult(
    context,
    data,
    story ? 586 : width - 70,
    story ? 1710 : 1065,
    {
      align: story ? "center" : "right",
      color: shareColors.court,
      maxWidth: story ? 860 : 390,
      opponentAlign: "right",
      opponentSize: story ? 40 : 30,
      opponentMaxWidth: story ? 410 : 360,
      opponentWeight: 400,
      opponentX: width - (story ? 79 : 70),
      opponentY: story ? 1759 : 1128,
      scoreColor: shareColors.limeDeep,
      scoreFamily: "Alfa Slab One",
      scoreHorizontalScale: story ? 1.16 : undefined,
      scoreSize: story ? 330 : 215,
      scoreWeight: 400,
    },
  );
  drawQuickFooter(
    context,
    lockup,
    width / 2,
    story ? 1844 : 1292,
    shareColors.court,
    story ? 320 : 280,
  );
}
