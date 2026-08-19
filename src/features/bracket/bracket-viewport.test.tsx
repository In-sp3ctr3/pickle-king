// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bracketAnchoredScroll,
  bracketFitScale,
} from "./bracket-viewport-geometry";
import { BracketViewport } from "./bracket-viewport";

const BOARD = { width: 1_000, height: 500 };

class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe() {
    this.callback([], this as unknown as ResizeObserver);
  }
  disconnect() {}
  unobserve() {}
}

function renderViewport(onMatchAction = vi.fn()) {
  render(
    <BracketViewport board={BOARD}>
      <div className="bracket-tree-board" role="list">
        <div className="bracket-tree-node" role="listitem">
          <article>
            <span>Match details</span>
            <button onClick={onMatchAction} type="button">
              Start match
            </button>
          </article>
        </div>
      </div>
    </BracketViewport>,
  );
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  Object.defineProperties(HTMLElement.prototype, {
    clientHeight: { configurable: true, get: () => 300 },
    clientWidth: { configurable: true, get: () => 400 },
    hasPointerCapture: { configurable: true, value: () => true },
    releasePointerCapture: { configurable: true, value: vi.fn() },
    scrollHeight: { configurable: true, get: () => BOARD.height },
    scrollWidth: { configurable: true, get: () => BOARD.width + 40 },
    scrollTo: {
      configurable: true,
      value(options: ScrollToOptions) {
        this.scrollLeft = options.left ?? this.scrollLeft;
      },
    },
    setPointerCapture: { configurable: true, value: vi.fn() },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("bounded bracket viewport", () => {
  it("fits the complete board and clamps anchored scroll to finite bounds", () => {
    expect(bracketFitScale({ width: 400, height: 300 }, BOARD)).toBeCloseTo(
      0.352,
    );
    expect(
      bracketAnchoredScroll({
        anchor: { x: 500, y: 250 },
        board: BOARD,
        nextScale: 2,
        viewport: { width: 400, height: 300 },
      }),
    ).toEqual({ x: 800, y: 350 });
  });

  it("opens centered and keeps fitted match actions available", async () => {
    const onMatchAction = vi.fn();
    renderViewport(onMatchAction);
    await waitFor(() =>
      expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
        "100%",
      ),
    );
    const board = document.querySelector(".bracket-tree-scaled-board")!;
    expect(board.hasAttribute("inert")).toBe(false);
    expect(
      screen.getByLabelText("Current bracket zoom").hasAttribute("aria-live"),
    ).toBe(false);

    const viewport = screen.getByRole("region", {
      name: /connected tournament bracket/i,
    });
    expect(viewport.scrollLeft).toBe(320);
    fireEvent.click(screen.getByRole("button", { name: "Fit" }));
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "35%",
    );
    expect(board.hasAttribute("inert")).toBe(false);
    expect(
      screen.getByText("Fit view · Tap a match, then use its controls"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start match" }));
    expect(onMatchAction).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "100%",
    );
    fireEvent.click(screen.getByRole("button", { name: "Start match" }));
    expect(onMatchAction).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Fit" }));
    fireEvent.click(screen.getByText("Match details"));
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "100%",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset zoom to 100%" }));
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "100%",
    );
    expect(board.hasAttribute("inert")).toBe(false);
    expect(viewport.scrollLeft).toBe(320);

    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    }
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "200%",
    );
    expect(
      (screen.getByRole("button", { name: "Zoom in" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("anchors pinch zoom and clears horizontal drag on pointer cancellation", async () => {
    renderViewport();
    const frames: FrameRequestCallback[] = [];
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    const viewport = await screen.findByRole("region", {
      name: /connected tournament bracket/i,
    });
    fireEvent.pointerDown(viewport, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerDown(viewport, {
      clientX: 200,
      clientY: 100,
      pointerId: 2,
    });
    fireEvent.pointerMove(viewport, {
      clientX: 220,
      clientY: 100,
      pointerId: 2,
    });
    fireEvent.pointerMove(viewport, {
      clientX: 250,
      clientY: 100,
      pointerId: 2,
    });
    expect(requestFrame).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "100%",
    );
    act(() => frames[0](0));
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "150%",
    );
    expect(viewport.scrollLeft).toBe(530);
    expect(viewport.dataset.bracketMode).toBe("panning");

    fireEvent.pointerCancel(viewport, { pointerId: 2 });
    expect(viewport.dataset.bracketMode).toBe("detail");
    const before = viewport.scrollLeft;
    fireEvent.pointerDown(viewport, {
      clientX: 200,
      clientY: 100,
      pointerId: 3,
    });
    fireEvent.pointerMove(viewport, {
      clientX: 197,
      clientY: 100,
      pointerId: 3,
    });
    expect(viewport.scrollLeft).toBe(before);
    fireEvent.pointerMove(viewport, {
      clientX: 180,
      clientY: 100,
      pointerId: 3,
    });
    expect(viewport.scrollLeft).toBeGreaterThan(before);
    fireEvent.lostPointerCapture(viewport, { pointerId: 3 });
    expect(viewport.dataset.bracketMode).toBe("detail");
  });

  it("supports controls, wheel, keyboard, and control-origin gestures", async () => {
    renderViewport();
    const viewport = await screen.findByRole("region", {
      name: /connected tournament bracket/i,
    });
    const matchButton = screen.getByRole("button", { name: "Start match" });
    fireEvent.pointerDown(matchButton, {
      clientX: 200,
      clientY: 100,
      pointerId: 4,
    });
    fireEvent.pointerMove(matchButton, {
      clientX: 150,
      clientY: 100,
      pointerId: 4,
    });
    expect(viewport.dataset.bracketMode).toBe("panning");
    fireEvent.pointerCancel(viewport, { pointerId: 4 });
    expect(viewport.dataset.bracketMode).toBe("readable");

    fireEvent.keyDown(viewport, { key: "+" });
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "125%",
    );
    fireEvent.wheel(viewport, {
      clientX: 200,
      clientY: 150,
      ctrlKey: true,
      deltaY: -1,
    });
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "150%",
    );
    const before = viewport.scrollLeft;
    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    expect(viewport.scrollLeft).toBe(before + 48);
    fireEvent.keyDown(viewport, { key: "f" });
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "35%",
    );
    expect(screen.getByRole("button", { name: "Show left draw" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Show championship match" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Show right draw" }),
    ).toBeTruthy();
  });

  it("suppresses only the click produced by a drag", async () => {
    const onMatchAction = vi.fn();
    renderViewport(onMatchAction);
    await screen.findByRole("region", {
      name: /connected tournament bracket/i,
    });
    const matchButton = screen.getByRole("button", { name: "Start match" });
    fireEvent.pointerDown(matchButton, {
      clientX: 200,
      clientY: 100,
      pointerId: 5,
    });
    fireEvent.pointerMove(matchButton, {
      clientX: 170,
      clientY: 100,
      pointerId: 5,
    });
    fireEvent.pointerUp(matchButton, { pointerId: 5 });
    fireEvent.click(matchButton);
    expect(onMatchAction).not.toHaveBeenCalled();

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    fireEvent.click(matchButton);
    expect(onMatchAction).toHaveBeenCalledOnce();
  });
});
