import { shareColors, shareText } from "./share-canvas";

export function drawExportBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  arena: HTMLImageElement | null,
  focusY = height * 0.36,
) {
  if (arena) drawImageCover(context, arena, width, height);
  else drawFallbackArena(context, width, height, focusY);
  const wash = context.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, "rgba(4, 6, 3, 0.12)");
  wash.addColorStop(0.56, "rgba(4, 6, 3, 0.3)");
  wash.addColorStop(1, "rgba(4, 6, 3, 0.78)");
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  context.drawImage(
    image,
    (image.naturalWidth - sourceWidth) / 2,
    (image.naturalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
}

function drawFallbackArena(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  focusY: number,
) {
  const light = context.createRadialGradient(
    width / 2,
    focusY,
    width * 0.04,
    width / 2,
    focusY,
    width * 0.72,
  );
  light.addColorStop(0, "#243115");
  light.addColorStop(0.34, "#10150c");
  light.addColorStop(1, shareColors.court);
  context.fillStyle = light;
  context.fillRect(0, 0, width, height);
}

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

export function drawEdgeFragments(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
) {
  const next = random(seed);
  const colors = [shareColors.lime, shareColors.chalk, shareColors.gold];
  for (let index = 0; index < 16; index += 1) {
    const onLeft = index % 2 === 0;
    const x = onLeft
      ? 18 + next() * width * 0.16
      : width * 0.84 + next() * width * 0.14;
    const y = 70 + next() * height;
    const size = 5 + next() * 8;
    context.save();
    context.translate(x, y);
    context.rotate(next() * Math.PI);
    context.globalAlpha = 0.38 + next() * 0.36;
    context.fillStyle = colors[index % colors.length];
    context.fillRect(-size / 2, -size, size, size * 2);
    context.restore();
  }
}

export function drawMedalBadge(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  place: "1" | "2" | "3",
  color: string,
  size = 68,
) {
  context.save();
  context.translate(x, y);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(-size * 0.32, -size * 0.66);
  context.lineTo(-size * 0.04, -size * 0.08);
  context.lineTo(size * 0.12, -size * 0.66);
  context.lineTo(size * 0.32, -size * 0.66);
  context.lineTo(size * 0.04, -size * 0.08);
  context.lineTo(-size * 0.12, -size * 0.66);
  context.closePath();
  context.fill();
  context.fillStyle = "#12160f";
  context.strokeStyle = color;
  context.lineWidth = Math.max(4, size * 0.07);
  context.beginPath();
  context.arc(0, 0, size * 0.48, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  shareText(context, place, 0, size * 0.18, {
    align: "center",
    color,
    font: `900 ${size * 0.56}px 'Archivo Black', sans-serif`,
  });
  context.restore();
}
