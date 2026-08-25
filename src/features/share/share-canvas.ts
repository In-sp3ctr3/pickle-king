export const shareColors = {
  court: "#090b08",
  surface: "#151b13",
  surfaceRaised: "#1b2218",
  chalk: "#f5f3e9",
  lime: "#c8dc00",
  limeDeep: "#bdd600",
  mist: "#9da494",
  line: "#34402e",
  gold: "#f3c744",
};

let brandMarkPromise: Promise<HTMLImageElement> | null = null;
let brandLockupPromise: Promise<BrandLockupAssets> | null = null;
let shareFontPromise: Promise<void> | null = null;
const imagePromises = new Map<string, Promise<HTMLImageElement>>();

export const requiredShareFonts = [
  { family: "Anton", font: "400 24px Anton" },
  { family: "Alfa Slab One", font: "400 24px 'Alfa Slab One'" },
  { family: "Roboto Condensed", font: "700 24px 'Roboto Condensed'" },
  { family: "Roboto Condensed", font: "900 24px 'Roboto Condensed'" },
  { family: "Roboto Slab", font: "900 24px 'Roboto Slab'" },
  { family: "Manrope", font: "800 24px Manrope" },
] as const;

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

export interface BrandLockupAssets {
  chalk: HTMLImageElement;
  ink: HTMLImageElement;
}

function brandLockup() {
  brandLockupPromise ??= Promise.all([
    loadImage("/brand/pickle-king-lockup.png", "The Pickle King lockup"),
    loadImage(
      "/brand/pickle-king-lockup-chalk.png",
      "The light Pickle King lockup",
    ),
  ])
    .then(([ink, chalk]) => ({ chalk, ink }))
    .catch((error: unknown) => {
      brandLockupPromise = null;
      throw error;
    });
  return brandLockupPromise;
}

function loadImage(source: string, label: string) {
  const cached = imagePromises.get(source);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      void image.decode().then(() => resolve(image), reject);
    };
    image.onerror = () => reject(new Error(`${label} could not load.`));
    image.src = source;
  }).catch((error: unknown) => {
    imagePromises.delete(source);
    throw error;
  });
  imagePromises.set(source, promise);
  return promise;
}

export function loadShareTemplate(source: string) {
  return loadImage(source, "The share template");
}

export function waitForShareFonts() {
  shareFontPromise ??= loadShareFonts().catch((error: unknown) => {
    shareFontPromise = null;
    throw error;
  });
  return shareFontPromise;
}

async function loadShareFonts() {
  if (!document.fonts) {
    throw new Error(
      "This browser cannot verify the fonts used in share images.",
    );
  }
  const loadedFaces = await Promise.all(
    requiredShareFonts.map(({ font }) =>
      document.fonts.load(font, "PICKLE KING 11–7"),
    ),
  );
  const missing = requiredShareFonts.filter(
    ({ font }, index) =>
      !loadedFaces[index].some(({ status }) => status === "loaded") ||
      !document.fonts.check(font, "PICKLE KING 11–7"),
  );
  if (missing.length) {
    throw new Error(
      `Share image fonts did not load: ${[...new Set(missing.map(({ family }) => family))].join(", ")}.`,
    );
  }
}

export function prewarmShareAssets() {
  void Promise.all([brandMark(), brandLockup(), waitForShareFonts()]).catch(
    () => undefined,
  );
}

export async function shareCanvasSurface(
  width: number,
  height: number,
  templateSource?: string,
) {
  const [mark, lockup, template] = await Promise.all([
    brandMark(),
    brandLockup(),
    templateSource ? loadShareTemplate(templateSource) : null,
    waitForShareFonts(),
  ]);
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) throw new Error("This browser cannot create share images.");
  if (template) context.drawImage(template, 0, 0, width, height);
  else {
    context.fillStyle = shareColors.court;
    context.fillRect(0, 0, width, height);
  }
  return { context, element, lockup, mark };
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
  const graphemes = segmentGraphemes(value);
  let end = graphemes.length;
  while (
    end > 1 &&
    context.measureText(`${graphemes.slice(0, end).join("")}…`).width > maxWidth
  ) {
    end -= 1;
  }
  return `${graphemes.slice(0, end).join("")}…`;
}

function segmentGraphemes(value: string) {
  if (typeof Intl.Segmenter === "undefined") return Array.from(value);
  return Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
    ({ segment }) => segment,
  );
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

export const BRAND_LOCKUP_ASPECT_RATIO = 640 / 144;

export function drawBrandLockup(
  context: CanvasRenderingContext2D,
  lockup: BrandLockupAssets,
  centerX: number,
  centerY: number,
  width: number,
  wordmarkColor: "ink" | "chalk" = "ink",
) {
  const height = width / BRAND_LOCKUP_ASPECT_RATIO;
  const left = centerX - width / 2;
  const top = centerY - height / 2;
  context.drawImage(lockup[wordmarkColor], left, top, width, height);
}
