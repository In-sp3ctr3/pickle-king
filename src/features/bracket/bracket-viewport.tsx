"use client";

import { useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import {
  BRACKET_MAX_SCALE,
  type ViewportSize,
} from "./bracket-viewport-geometry";
import { useBracketViewport } from "./use-bracket-viewport";

type BracketFocus = "left" | "final" | "right";

export function BracketViewport({
  board,
  children,
}: {
  board: ViewportSize;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const [focus, setFocus] = useState<BracketFocus>("final");
  const {
    beginPointer,
    cancelPointer,
    clearDraggedClick,
    endPointer,
    fit,
    handleKey,
    mode,
    movePointer,
    overview,
    reset,
    scale,
    scaledBoardRef,
    showFit,
    showReadableAt,
    stageRef,
    viewportRef,
    zoomIn,
    zoomOut,
  } = useBracketViewport(board);

  function moveViewport(next: BracketFocus) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const left = next === "left" ? 0 : next === "right" ? max : max / 2;
    setFocus(next);
    viewport.scrollTo({ behavior: reducedMotion ? "auto" : "smooth", left });
  }

  function resetToFinal() {
    setFocus("final");
    reset();
  }

  return (
    <div className="bracket-tree-shell">
      <div className="bracket-tree-toolbar">
        <nav
          aria-label="Tournament bracket section"
          className="bracket-tree-nav"
        >
          <BracketControl
            active={focus === "left"}
            label="Show left draw"
            onClick={() => moveViewport("left")}
          >
            <ChevronLeft aria-hidden="true" size={19} />
          </BracketControl>
          <BracketControl
            active={focus === "final"}
            label="Show championship match"
            onClick={() => moveViewport("final")}
          >
            <Trophy aria-hidden="true" size={18} />
          </BracketControl>
          <BracketControl
            active={focus === "right"}
            label="Show right draw"
            onClick={() => moveViewport("right")}
          >
            <ChevronRight aria-hidden="true" size={19} />
          </BracketControl>
        </nav>
        <div
          aria-label="Bracket zoom controls"
          className="bracket-tree-zoom"
          role="group"
        >
          <button
            aria-label="Zoom out"
            data-qa="bracket-zoom-out"
            disabled={scale <= fit}
            onClick={zoomOut}
            type="button"
          >
            −
          </button>
          <button data-qa="bracket-fit" onClick={showFit} type="button">
            Fit
          </button>
          <button
            aria-label="Reset zoom to 100%"
            data-qa="bracket-reset"
            onClick={resetToFinal}
            type="button"
          >
            Reset
          </button>
          <button
            aria-label="Zoom in"
            data-qa="bracket-zoom-in"
            disabled={scale >= BRACKET_MAX_SCALE}
            onClick={zoomIn}
            type="button"
          >
            +
          </button>
          <output aria-label="Current bracket zoom">
            {Math.round(scale * 100)}%
          </output>
        </div>
      </div>
      <div
        aria-label="Connected tournament bracket. Pinch or drag horizontally to inspect the draw."
        className="bracket-tree-viewport"
        data-bracket-mode={mode}
        onClickCapture={(event) => {
          if (clearDraggedClick()) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          const node =
            event.target instanceof Element
              ? event.target.closest<HTMLElement>(".bracket-tree-node")
              : null;
          if (overview && node) {
            event.preventDefault();
            event.stopPropagation();
            showReadableAt(node);
          }
        }}
        onKeyDown={handleKey}
        onLostPointerCapture={endPointer}
        onPointerCancel={cancelPointer}
        onPointerDown={beginPointer}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        ref={viewportRef}
        role="region"
        style={{ height: `min(65vh, ${board.height}px)` }}
        tabIndex={0}
      >
        <div
          className="bracket-tree-stage"
          ref={stageRef}
          style={{ height: board.height * scale, width: board.width * scale }}
        >
          <div
            aria-label={
              overview
                ? "Fitted bracket overview. Tap a match to inspect it at full size."
                : undefined
            }
            className="bracket-tree-scaled-board"
            ref={scaledBoardRef}
            style={{
              height: board.height,
              transform: `scale(${scale})`,
              width: board.width,
            }}
          >
            {children}
          </div>
        </div>
      </div>
      {overview ? (
        <p className="bracket-tree-overview-note">
          Fit view · Tap a match, then use its controls
        </p>
      ) : null}
    </div>
  );
}

function BracketControl({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
