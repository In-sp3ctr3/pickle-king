"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import * as geometry from "./bracket-viewport-geometry";

export function useBracketViewport(board: geometry.ViewportSize) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, geometry.ViewportPoint>());
  const gesture = useRef<geometry.BracketGesture | null>(null);
  const raf = useRef(0);
  const pendingView = useRef<geometry.PendingBracketView | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scaledBoardRef = useRef<HTMLDivElement>(null);
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
    const { clientHeight = 0, clientWidth = 0 } = viewportRef.current ?? {};
    return {
      height: clientHeight,
      width: clientWidth,
    };
  }

  function queueView(
    nextScale: number,
    nextScroll: geometry.ViewportPoint | "center",
  ) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    scaleRef.current = nextScale;
    pendingView.current = { scale: nextScale, scroll: nextScroll };
    if (raf.current) return;
    raf.current = -1;
    const frame = window.requestAnimationFrame(() => {
      raf.current = 0;
      const next = pendingView.current;
      pendingView.current = null;
      if (!next) return;
      if (stageRef.current)
        Object.assign(stageRef.current.style, {
          height: `${board.height * next.scale}px`,
          width: `${board.width * next.scale}px`,
        });
      if (scaledBoardRef.current)
        scaledBoardRef.current.style.transform = `scale(${next.scale})`;
      const nextScroll =
        next.scroll === "center"
          ? geometry.bracketCenteredScroll(viewport)
          : next.scroll;
      viewport.scrollLeft = nextScroll.x;
      viewport.scrollTop = nextScroll.y;
      setScale(next.scale);
    });
    if (raf.current === -1) raf.current = frame;
  }

  function scaleAround(next: number, local?: geometry.ViewportPoint) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    fitted.current = false;
    const size = viewportSize();
    const nextScale = geometry.clamp(
      next,
      fitRef.current,
      geometry.BRACKET_MAX_SCALE,
    );
    const point = local ?? { x: size.width / 2, y: size.height / 2 };
    queueView(
      nextScale,
      geometry.bracketAnchoredScroll({
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
    fitted.current = false;
    queueView(1, "center");
  }

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const nextFit = geometry.bracketFitScale(viewportSize(), board);
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
        scaleRef.current - Math.sign(event.deltaY) * geometry.BRACKET_ZOOM_STEP,
        localPoint({ x: event.clientX, y: event.clientY }),
      );
    };
    viewport.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      viewport.removeEventListener("wheel", wheel);
      window.cancelAnimationFrame(raf.current);
      pendingView.current = null;
      window.clearTimeout(suppressClickTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset closes over this board revision.
  }, [board]);

  function localPoint(point: geometry.ViewportPoint) {
    const bounds = viewportRef.current?.getBoundingClientRect();
    return {
      x: point.x - (bounds?.left ?? 0),
      y: point.y - (bounds?.top ?? 0),
    };
  }

  function beginPointer(event: PointerEvent<HTMLDivElement>) {
    const point = { x: event.clientX, y: event.clientY };
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
    for (const pointerId of pointers.current.keys()) {
      if (!event.currentTarget.hasPointerCapture(pointerId)) {
        event.currentTarget.setPointerCapture(pointerId);
      }
    }
    const viewport = viewportRef.current!;
    gesture.current = geometry.bracketPinchGesture(
      points,
      localPoint(geometry.pointerMidpoint(points)),
      { x: viewport.scrollLeft, y: viewport.scrollTop },
      scaleRef.current,
    );
    setPanning(true);
  }

  function movePinch(
    event: PointerEvent<HTMLDivElement>,
    points: geometry.ViewportPoint[],
  ) {
    if (gesture.current?.kind !== "pinch" || points.length < 2) return false;
    event.preventDefault();
    const next = geometry.bracketPinchView({
      board,
      center: localPoint(geometry.pointerMidpoint(points)),
      fit: fitRef.current,
      gesture: gesture.current,
      points,
      viewport: viewportSize(),
    });
    fitted.current = false;
    queueView(next.scale, next.scroll);
    return true;
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (movePinch(event, [...pointers.current.values()])) return;
    if (gesture.current.kind !== "drag") return;
    if (!geometry.hasHorizontalDragStarted(gesture.current, point)) return;
    event.preventDefault();
    gesture.current.moved = true;
    setPanning(true);
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const viewport = viewportRef.current!;
    const size = viewportSize();
    viewport.scrollLeft = geometry.bracketDragScroll(
      viewport.scrollLeft,
      point.x - gesture.current.last.x,
      board.width,
      scaleRef.current,
      size.width,
    );
    gesture.current.last = point;
  }

  function showReadableAt(node: HTMLElement) {
    const boardBounds = scaledBoardRef.current?.getBoundingClientRect();
    const nodeBounds = node.getBoundingClientRect();
    if (!boardBounds) return;
    fitted.current = false;
    queueView(
      1,
      geometry.bracketNodeScroll(
        boardBounds,
        nodeBounds,
        scaleRef.current,
        board,
        viewportSize(),
      ),
    );
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
    if (geometry.isBracketControl(event.target)) return;
    const viewport = viewportRef.current!;
    const key = event.key.toLowerCase();
    if (["+", "="].includes(key))
      scaleAround(scaleRef.current + geometry.BRACKET_ZOOM_STEP);
    else if (key === "-")
      scaleAround(scaleRef.current - geometry.BRACKET_ZOOM_STEP);
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
    mode: geometry.bracketViewportMode(scale, panning),
    movePointer,
    overview: scale < 1,
    reset,
    scale,
    scaledBoardRef,
    showFit,
    showReadableAt,
    stageRef,
    viewportRef,
    zoomIn: () => scaleAround(scaleRef.current + geometry.BRACKET_ZOOM_STEP),
    zoomOut: () => scaleAround(scaleRef.current - geometry.BRACKET_ZOOM_STEP),
  };
}
