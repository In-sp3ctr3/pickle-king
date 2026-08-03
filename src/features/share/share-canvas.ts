export const shareColors = {
  court: "#090b08",
  surface: "#151b13",
  chalk: "#f5f3e9",
  lime: "#c8ff3d",
  mist: "#9da494",
  line: "#34402e",
  gold: "#f3c744",
};

let brandMarkPromise: Promise<HTMLImageElement> | null = null;

function loadBrandMark() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      void image.decode().then(() => resolve(image), reject);
    };
    image.onerror = () =>
      reject(new Error("The Pickle King mark could not load."));
    image.src = "/brand/pickle-king-mark.png";
  });
}

function brandMark() {
  brandMarkPromise ??= loadBrandMark().catch((error: unknown) => {
    brandMarkPromise = null;
    throw error;
  });
  return brandMarkPromise;
}

export async function shareCanvasSurface(width: number, height: number) {
  const [mark] = await Promise.all([brandMark(), document.fonts.ready]);
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) throw new Error("This browser cannot create share images.");
  context.fillStyle = shareColors.court;
  context.fillRect(0, 0, width, height);
  return { context, element, mark };
}

export function shareText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  options: { align?: CanvasTextAlign; color?: string; font?: string } = {},
) {
  context.fillStyle = options.color ?? shareColors.chalk;
  context.font = options.font ?? "800 34px Manrope, sans-serif";
  context.textAlign = options.align ?? "left";
  context.fillText(value, x, y);
}

export function fitShareText(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function drawBrandMark(
  context: CanvasRenderingContext2D,
  mark: HTMLImageElement,
  centerX: number,
  top: number,
  size: number,
) {
  context.drawImage(mark, centerX - size / 2, top, size, size);
}

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

export function drawStaticConfetti(
  context: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  seed: number,
  count = 48,
) {
  const next = random(seed);
  const colors = [
    shareColors.lime,
    shareColors.chalk,
    shareColors.gold,
    "#86a825",
  ];
  for (let index = 0; index < count; index += 1) {
    const x = bounds.x + next() * bounds.width;
    const y = bounds.y + next() * bounds.height;
    const size = 5 + next() * 10;
    context.save();
    context.translate(x, y);
    context.rotate(next() * Math.PI);
    context.globalAlpha = 0.55 + next() * 0.4;
    context.fillStyle = colors[index % colors.length];
    if (index % 4 === 0) {
      context.beginPath();
      context.arc(0, 0, size / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(-size / 2, -size, size, size * 2);
    }
    context.restore();
  }
}

export function drawShareFooter(
  context: CanvasRenderingContext2D,
  width: number,
  y: number,
) {
  shareText(context, "PICKLE KING", 64, y, {
    color: shareColors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  shareText(context, "SETTLED ON COURT · STORED ON DEVICE", width - 64, y, {
    align: "right",
    color: shareColors.mist,
    font: "800 18px Manrope, sans-serif",
  });
}
