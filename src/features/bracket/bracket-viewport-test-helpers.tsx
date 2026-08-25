import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { BracketViewport } from "./bracket-viewport";

export const BOARD = { width: 1_000, height: 500 };

class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe() {
    this.callback([], this as unknown as ResizeObserver);
  }
  disconnect() {}
  unobserve() {}
}

export function renderViewport(onMatchAction = vi.fn()) {
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

export function registerBracketViewportTestSetup() {
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
}
