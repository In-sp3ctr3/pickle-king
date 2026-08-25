import type { KeyboardEvent } from "react";
import * as geometry from "./bracket-viewport-geometry";

interface NativeEventOptions {
  board: geometry.ViewportSize;
  fit(): number;
  getScale(): number;
  getTouchGesture(): geometry.PinchGesture | null;
  localPoint(point: geometry.ViewportPoint): geometry.ViewportPoint;
  markUnfitted(): void;
  queueView(scale: number, scroll: geometry.ViewportPoint): void;
  scaleAround(scale: number, point?: geometry.ViewportPoint): void;
  setPanning(panning: boolean): void;
  setTouchGesture(gesture: geometry.PinchGesture | null): void;
  suppressNextClick(timeout?: number): void;
  viewport: HTMLDivElement;
  viewportSize(): geometry.ViewportSize;
}

function touchPoints(touches: TouchList) {
  return [touches[0], touches[1]].map(({ clientX, clientY }) => ({
    x: clientX,
    y: clientY,
  }));
}

export function bracketViewportSize(viewport: HTMLDivElement | null) {
  const { clientHeight = 0, clientWidth = 0 } = viewport ?? {};
  return { height: clientHeight, width: clientWidth };
}

export function bracketViewportLocalPoint(
  viewport: HTMLDivElement | null,
  point: geometry.ViewportPoint,
) {
  const bounds = viewport?.getBoundingClientRect();
  return {
    x: point.x - (bounds?.left ?? 0),
    y: point.y - (bounds?.top ?? 0),
  };
}

export function bindBracketViewportNativeEvents(options: NativeEventOptions) {
  const endTouchPinch = () => {
    if (!options.getTouchGesture()) return;
    options.setTouchGesture(null);
    options.setPanning(false);
    options.suppressNextClick(350);
  };
  const wheel = (event: globalThis.WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    options.scaleAround(
      options.getScale() - Math.sign(event.deltaY) * geometry.BRACKET_ZOOM_STEP,
      options.localPoint({ x: event.clientX, y: event.clientY }),
    );
  };
  const touchStart = (event: TouchEvent) => {
    if (event.touches.length !== 2) {
      endTouchPinch();
      return;
    }
    event.preventDefault();
    const points = touchPoints(event.touches);
    options.setTouchGesture(
      geometry.bracketPinchGesture(
        points,
        options.localPoint(geometry.pointerMidpoint(points)),
        {
          x: options.viewport.scrollLeft,
          y: options.viewport.scrollTop,
        },
        options.getScale(),
      ),
    );
    options.setPanning(true);
  };
  const touchMove = (event: TouchEvent) => {
    const current = options.getTouchGesture();
    if (!current || event.touches.length !== 2) return;
    event.preventDefault();
    const points = touchPoints(event.touches);
    const next = geometry.bracketPinchView({
      board: options.board,
      center: options.localPoint(geometry.pointerMidpoint(points)),
      fit: options.fit(),
      gesture: current,
      points,
      viewport: options.viewportSize(),
    });
    options.markUnfitted();
    options.queueView(next.scale, next.scroll);
  };
  const touchEnd = (event: TouchEvent) => {
    if (event.touches.length !== 2) endTouchPinch();
  };

  options.viewport.addEventListener("wheel", wheel, { passive: false });
  options.viewport.addEventListener("touchstart", touchStart, {
    passive: false,
  });
  options.viewport.addEventListener("touchmove", touchMove, {
    passive: false,
  });
  options.viewport.addEventListener("touchend", touchEnd);
  options.viewport.addEventListener("touchcancel", endTouchPinch);

  return () => {
    options.viewport.removeEventListener("wheel", wheel);
    options.viewport.removeEventListener("touchstart", touchStart);
    options.viewport.removeEventListener("touchmove", touchMove);
    options.viewport.removeEventListener("touchend", touchEnd);
    options.viewport.removeEventListener("touchcancel", endTouchPinch);
    options.setTouchGesture(null);
  };
}

export function handleBracketViewportKey(
  event: KeyboardEvent<HTMLDivElement>,
  {
    reset,
    scale,
    scaleAround,
    showFit,
    viewport,
  }: {
    reset(): void;
    scale: number;
    scaleAround(next: number): void;
    showFit(): void;
    viewport: HTMLDivElement;
  },
) {
  if (geometry.isBracketControl(event.target)) return;
  const key = event.key.toLowerCase();
  if (["+", "="].includes(key)) scaleAround(scale + geometry.BRACKET_ZOOM_STEP);
  else if (key === "-") scaleAround(scale - geometry.BRACKET_ZOOM_STEP);
  else if (key === "0") reset();
  else if (key === "f") showFit();
  else if (key === "arrowleft") viewport.scrollLeft -= 48;
  else if (key === "arrowright") viewport.scrollLeft += 48;
  else if (key === "arrowup") viewport.scrollTop -= 48;
  else if (key === "arrowdown") viewport.scrollTop += 48;
  else return;
  event.preventDefault();
}
