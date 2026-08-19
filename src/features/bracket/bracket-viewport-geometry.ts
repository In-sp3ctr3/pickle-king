export interface ViewportSize {
  height: number;
  width: number;
}

export interface ViewportPoint {
  x: number;
  y: number;
}

export interface PinchGesture {
  anchor: ViewportPoint;
  distance: number;
  kind: "pinch";
  scale: number;
}

export interface DragGesture {
  kind: "drag";
  last: ViewportPoint;
  moved: boolean;
  start: ViewportPoint;
}

export type BracketGesture = PinchGesture | DragGesture;

export interface PendingBracketView {
  scale: number;
  scroll: ViewportPoint | "center";
}

export type BracketViewportMode =
  "detail" | "overview" | "panning" | "readable";

export const BRACKET_MAX_SCALE = 2;
export const BRACKET_ZOOM_STEP = 0.25;
export const BRACKET_DRAG_THRESHOLD = 6;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function bracketCenteredScroll(
  viewport: Pick<
    HTMLElement,
    "clientHeight" | "clientWidth" | "scrollHeight" | "scrollWidth"
  >,
) {
  return {
    x: (viewport.scrollWidth - viewport.clientWidth) / 2,
    y: Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2),
  };
}

export function bracketDragScroll(
  current: number,
  delta: number,
  boardWidth: number,
  scale: number,
  viewportWidth: number,
) {
  return clamp(
    current - delta,
    0,
    Math.max(0, boardWidth * scale - viewportWidth),
  );
}

export function hasHorizontalDragStarted(
  gesture: DragGesture,
  point: ViewportPoint,
) {
  if (gesture.moved) return true;
  const deltaX = point.x - gesture.start.x;
  const deltaY = point.y - gesture.start.y;
  return (
    Math.hypot(deltaX, deltaY) >= BRACKET_DRAG_THRESHOLD &&
    Math.abs(deltaX) >= Math.abs(deltaY)
  );
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

export function bracketPinchView({
  board,
  center,
  fit,
  gesture,
  points,
  viewport,
}: {
  board: ViewportSize;
  center: ViewportPoint;
  fit: number;
  gesture: PinchGesture;
  points: ViewportPoint[];
  viewport: ViewportSize;
}) {
  const scale = clamp(
    gesture.scale * (pointerDistance(points) / gesture.distance),
    fit,
    BRACKET_MAX_SCALE,
  );
  return {
    scale,
    scroll: bracketAnchoredScroll({
      anchor: gesture.anchor,
      board,
      local: center,
      nextScale: scale,
      viewport,
    }),
  };
}

export function bracketNodeAnchor(
  board: Pick<DOMRect, "left" | "top">,
  node: Pick<DOMRect, "height" | "left" | "top" | "width">,
  scale: number,
) {
  return {
    x: (node.left + node.width / 2 - board.left) / scale,
    y: (node.top + node.height / 2 - board.top) / scale,
  };
}

export function bracketNodeScroll(
  boardBounds: Pick<DOMRect, "left" | "top">,
  nodeBounds: Pick<DOMRect, "height" | "left" | "top" | "width">,
  scale: number,
  board: ViewportSize,
  viewport: ViewportSize,
) {
  return bracketAnchoredScroll({
    anchor: bracketNodeAnchor(boardBounds, nodeBounds, scale),
    board,
    nextScale: 1,
    viewport,
  });
}

export function bracketPinchGesture(
  points: ViewportPoint[],
  center: ViewportPoint,
  scroll: ViewportPoint,
  scale: number,
): PinchGesture {
  return {
    anchor: {
      x: (scroll.x + center.x) / scale,
      y: (scroll.y + center.y) / scale,
    },
    distance: Math.max(1, pointerDistance(points)),
    kind: "pinch",
    scale,
  };
}

export function bracketViewportMode(
  scale: number,
  panning: boolean,
): BracketViewportMode {
  if (panning) return "panning";
  if (scale < 1) return "overview";
  if (scale > 1) return "detail";
  return "readable";
}

export function pointerDistance([first, second]: ViewportPoint[]) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function pointerMidpoint([first, second]: ViewportPoint[]) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}
