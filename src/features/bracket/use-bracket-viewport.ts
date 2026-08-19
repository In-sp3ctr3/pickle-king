"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  BRACKET_DRAG_THRESHOLD,
  BRACKET_MAX_SCALE,
  BRACKET_ZOOM_STEP,
  bracketAnchoredScroll,
  bracketFitScale,
  clamp,
  isBracketControl,
  pointerDistance,
  pointerMidpoint,
  type ViewportPoint,
  type ViewportSize,
} from "./bracket-viewport-geometry";

interface DragGesture {
  kind: "drag";
  last: ViewportPoint;
  moved: boolean;
  start: ViewportPoint;
}

interface PinchGesture {
  anchor: ViewportPoint;
  distance: number;
  kind: "pinch";
  scale: number;
}

type Gesture = DragGesture | PinchGesture;

export function useBracketViewport(board: ViewportSize) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, ViewportPoint>());
  const gesture = useRef<Gesture | null>(null);
  const raf = useRef(0);
  const suppressClickTimer = useRef(0);
  const scaleRef = useRef(1);
  const fitRef = useRef(1);
  const fitted = useRef(false);
  const measured = useRef(false);
  const dragged = useRef(false);
  const [fit, setFit] = useState(1);
  const [scale, setScale] = useState(1);
  const [panning, setPanning] = useState(false);

  function viewportSize() {
    const viewport = viewportRef.current;
    return {
      height: viewport?.clientHeight ?? 0,
      width: viewport?.clientWidth ?? 0,
    };
  }

  function queueView(nextScale: number, nextScroll: ViewportPoint) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    scaleRef.current = nextScale;
    setScale(nextScale);
    window.cancelAnimationFrame(raf.current);
    raf.current = window.requestAnimationFrame(() => {
      viewport.scrollLeft = nextScroll.x;
      viewport.scrollTop = nextScroll.y;
    });
  }

  function scaleAround(next: number, local?: ViewportPoint) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    fitted.current = false;
    const size = viewportSize();
    const nextScale = clamp(next, fitRef.current, BRACKET_MAX_SCALE);
    const point = local ?? { x: size.width / 2, y: size.height / 2 };
    queueView(
      nextScale,
      bracketAnchoredScroll({
        anchor: {
          x: (viewport.scrollLeft + point.x) / scaleRef.current,
          y: (viewport.scrollTop + point.y) / scaleRef.current,
        },
        board,
        local: point,
        nextScale,
        viewport: size,
      }),
    );
  }

  function showFit() {
    fitted.current = true;
    queueView(fitRef.current, { x: 0, y: 0 });
  }

  function reset() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    fitted.current = false;
    scaleRef.current = 1;
    setScale(1);
    window.cancelAnimationFrame(raf.current);
    raf.current = window.requestAnimationFrame(() => {
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
      viewport.scrollTop = Math.max(
        0,
        (viewport.scrollHeight - viewport.clientHeight) / 2,
      );
    });
  }

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const nextFit = bracketFitScale(viewportSize(), board);
      fitRef.current = nextFit;
      setFit(nextFit);
      if (!measured.current) {
        measured.current = true;
        reset();
      } else if (fitted.current || scaleRef.current < nextFit) {
        queueView(nextFit, { x: 0, y: 0 });
      } else if (scaleRef.current === 1) {
        reset();
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    const wheel = (event: globalThis.WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      scaleAround(
        scaleRef.current - Math.sign(event.deltaY) * BRACKET_ZOOM_STEP,
        localPoint({ x: event.clientX, y: event.clientY }),
      );
    };
    viewport.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      viewport.removeEventListener("wheel", wheel);
      window.cancelAnimationFrame(raf.current);
      window.clearTimeout(suppressClickTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset closes over this board revision.
  }, [board]);

  function localPoint(point: ViewportPoint) {
    const bounds = viewportRef.current?.getBoundingClientRect();
    return {
      x: point.x - (bounds?.left ?? 0),
      y: point.y - (bounds?.top ?? 0),
    };
  }

  function beginPointer(event: PointerEvent<HTMLDivElement>) {
    if (isBracketControl(event.target)) return;
    const point = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, point);
    const points = [...pointers.current.values()];
    if (points.length === 1) {
      gesture.current = {
        kind: "drag",
        last: point,
        moved: false,
        start: point,
      };
      return;
    }
    const center = localPoint(pointerMidpoint(points));
    const viewport = viewportRef.current!;
    gesture.current = {
      anchor: {
        x: (viewport.scrollLeft + center.x) / scaleRef.current,
        y: (viewport.scrollTop + center.y) / scaleRef.current,
      },
      distance: Math.max(1, pointerDistance(points)),
      kind: "pinch",
      scale: scaleRef.current,
    };
    setPanning(true);
  }

  function movePinch(
    event: PointerEvent<HTMLDivElement>,
    points: ViewportPoint[],
  ) {
    if (gesture.current?.kind !== "pinch" || points.length < 2) return false;
    event.preventDefault();
    const center = localPoint(pointerMidpoint(points));
    const nextScale = clamp(
      gesture.current.scale *
        (pointerDistance(points) / gesture.current.distance),
      fitRef.current,
      BRACKET_MAX_SCALE,
    );
    fitted.current = false;
    queueView(
      nextScale,
      bracketAnchoredScroll({
        anchor: gesture.current.anchor,
        board,
        local: center,
        nextScale,
        viewport: viewportSize(),
      }),
    );
    return true;
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (movePinch(event, [...pointers.current.values()])) return;
    if (gesture.current.kind !== "drag") return;
    const deltaX = point.x - gesture.current.start.x;
    const deltaY = point.y - gesture.current.start.y;
    if (
      !gesture.current.moved &&
      (Math.hypot(deltaX, deltaY) < BRACKET_DRAG_THRESHOLD ||
        Math.abs(deltaY) > Math.abs(deltaX))
    ) {
      return;
    }
    event.preventDefault();
    gesture.current.moved = true;
    setPanning(true);
    const viewport = viewportRef.current!;
    const size = viewportSize();
    viewport.scrollLeft = clamp(
      viewport.scrollLeft - (point.x - gesture.current.last.x),
      0,
      Math.max(0, board.width * scaleRef.current - size.width),
    );
    gesture.current.last = point;
  }

  function endPointer(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const shouldSuppressClick =
      !cancelled &&
      (gesture.current?.kind === "pinch" || gesture.current?.moved === true);
    for (const pointerId of cancelled
      ? pointers.current.keys()
      : [event.pointerId]) {
      if (event.currentTarget.hasPointerCapture(pointerId)) {
        event.currentTarget.releasePointerCapture(pointerId);
      }
      pointers.current.delete(pointerId);
    }
    const remaining = [...pointers.current.values()];
    gesture.current = remaining[0]
      ? { kind: "drag", last: remaining[0], moved: false, start: remaining[0] }
      : null;
    setPanning(false);
    if (shouldSuppressClick) {
      dragged.current = true;
      window.clearTimeout(suppressClickTimer.current);
      suppressClickTimer.current = window.setTimeout(() => {
        dragged.current = false;
      }, 0);
    }
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (isBracketControl(event.target)) return;
    const viewport = viewportRef.current!;
    const key = event.key.toLowerCase();
    if (["+", "="].includes(key))
      scaleAround(scaleRef.current + BRACKET_ZOOM_STEP);
    else if (key === "-") scaleAround(scaleRef.current - BRACKET_ZOOM_STEP);
    else if (key === "0") reset();
    else if (key === "f") showFit();
    else if (key === "arrowleft") viewport.scrollLeft -= 48;
    else if (key === "arrowright") viewport.scrollLeft += 48;
    else if (key === "arrowup") viewport.scrollTop -= 48;
    else if (key === "arrowdown") viewport.scrollTop += 48;
    else return;
    event.preventDefault();
  }

  return {
    beginPointer,
    cancelPointer: (event: PointerEvent<HTMLDivElement>) =>
      endPointer(event, true),
    clearDraggedClick: () => {
      if (!dragged.current) return false;
      dragged.current = false;
      window.clearTimeout(suppressClickTimer.current);
      return true;
    },
    endPointer,
    fit,
    handleKey,
    mode: panning
      ? "panning"
      : scale < 1
        ? "overview"
        : scale > 1
          ? "detail"
          : "readable",
    movePointer,
    overview: scale < 1,
    reset,
    scale,
    showFit,
    viewportRef,
    zoomIn: () => scaleAround(scaleRef.current + BRACKET_ZOOM_STEP),
    zoomOut: () => scaleAround(scaleRef.current - BRACKET_ZOOM_STEP),
  };
}
