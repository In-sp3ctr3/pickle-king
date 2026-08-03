export const shareColors = {
  court: "#090b08",
  surface: "#151b13",
  surfaceRaised: "#1b2218",
  chalk: "#f5f3e9",
  lime: "#c8ff3d",
  limeDeep: "#95c721",
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

export function fitCanvasText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
) {
  if (context.measureText(value).width <= maxWidth) return value;
  let end = value.length;
  while (
    end > 1 &&
    context.measureText(`${value.slice(0, end)}…`).width > maxWidth
  ) {
    end -= 1;
  }
  return `${value.slice(0, end)}…`;
}

export function shareFittedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  options: {
    align?: CanvasTextAlign;
    color?: string;
    family?: string;
    maxSize: number;
    maxWidth: number;
    minSize?: number;
    weight?: number;
  },
) {
  const family = options.family ?? "'Archivo Black', sans-serif";
  const weight = options.weight ?? 900;
  const minSize = options.minSize ?? 24;
  let size = options.maxSize;
  context.font = `${weight} ${size}px ${family}`;
  while (
    size > minSize &&
    context.measureText(value).width > options.maxWidth
  ) {
    size -= 2;
    context.font = `${weight} ${size}px ${family}`;
  }
  shareText(context, fitCanvasText(context, value, options.maxWidth), x, y, {
    align: options.align,
    color: options.color,
    font: `${weight} ${size}px ${family}`,
  });
  return size;
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

export function drawExportBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  focusY = height * 0.36,
) {
  const glow = context.createRadialGradient(
    width / 2,
    focusY,
    0,
    width / 2,
    focusY,
    width * 0.62,
  );
  glow.addColorStop(0, "rgba(149, 199, 33, 0.18)");
  glow.addColorStop(0.35, "rgba(90, 122, 19, 0.08)");
  glow.addColorStop(1, "rgba(9, 11, 8, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.52;
  context.strokeStyle = "#273020";
  context.lineWidth = Math.max(2, width / 700);
  const horizon = height * 0.54;
  for (const edge of [0.06, 0.27, 0.73, 0.94]) {
    context.beginPath();
    context.moveTo(width / 2, horizon);
    context.lineTo(width * edge, height * 0.93);
    context.stroke();
  }
  context.beginPath();
  context.moveTo(width * 0.05, height * 0.93);
  context.lineTo(width * 0.95, height * 0.93);
  context.stroke();
  context.restore();
}

export function drawLimeGlow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  const glow = context.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, "rgba(200, 255, 61, 0.24)");
  glow.addColorStop(1, "rgba(200, 255, 61, 0)");
  context.fillStyle = glow;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export function drawTrophy(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  context.save();
  context.translate(x, y);
  context.fillStyle = shareColors.gold;
  context.strokeStyle = shareColors.gold;
  context.lineWidth = Math.max(3, size * 0.06);
  context.beginPath();
  context.moveTo(-size * 0.3, -size * 0.28);
  context.lineTo(size * 0.3, -size * 0.28);
  context.quadraticCurveTo(size * 0.24, size * 0.16, 0, size * 0.2);
  context.quadraticCurveTo(
    -size * 0.24,
    size * 0.16,
    -size * 0.3,
    -size * 0.28,
  );
  context.fill();
  for (const direction of [-1, 1]) {
    context.beginPath();
    context.moveTo(direction * size * 0.28, -size * 0.2);
    context.quadraticCurveTo(
      direction * size * 0.52,
      -size * 0.14,
      direction * size * 0.32,
      size * 0.06,
    );
    context.stroke();
  }
  context.fillRect(-size * 0.055, size * 0.16, size * 0.11, size * 0.28);
  context.fillRect(-size * 0.25, size * 0.42, size * 0.5, size * 0.1);
  context.restore();
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
