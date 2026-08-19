export interface ViewportSize {
  height: number;
  width: number;
}

export interface ViewportPoint {
  x: number;
  y: number;
}

export const BRACKET_MAX_SCALE = 2;
export const BRACKET_ZOOM_STEP = 0.25;
export const BRACKET_DRAG_THRESHOLD = 6;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function isBracketControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button, input, select, textarea, a, [contenteditable='true']",
      ),
    )
  );
}

export function bracketFitScale(
  viewport: ViewportSize,
  board: ViewportSize,
  inset = 24,
) {
  if (
    viewport.width <= inset * 2 ||
    viewport.height <= inset * 2 ||
    board.width <= 0 ||
    board.height <= 0
  ) {
    return 1;
  }
  return Math.min(
    1,
    (viewport.width - inset * 2) / board.width,
    (viewport.height - inset * 2) / board.height,
  );
}

export function bracketAnchoredScroll({
  anchor,
  board,
  local,
  nextScale,
  viewport,
}: {
  anchor: ViewportPoint;
  board: ViewportSize;
  local?: ViewportPoint;
  nextScale: number;
  viewport: ViewportSize;
}) {
  const fixed = local ?? { x: viewport.width / 2, y: viewport.height / 2 };
  return {
    x: clamp(
      anchor.x * nextScale - fixed.x,
      0,
      Math.max(0, board.width * nextScale - viewport.width),
    ),
    y: clamp(
      anchor.y * nextScale - fixed.y,
      0,
      Math.max(0, board.height * nextScale - viewport.height),
    ),
  };
}

export function pointerDistance([first, second]: ViewportPoint[]) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function pointerMidpoint([first, second]: ViewportPoint[]) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}
