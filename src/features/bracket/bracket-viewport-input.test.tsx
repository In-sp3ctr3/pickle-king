// @vitest-environment jsdom

import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  registerBracketViewportTestSetup,
  renderViewport,
} from "./bracket-viewport-test-helpers";

registerBracketViewportTestSetup();

describe("bounded bracket viewport input", () => {
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

  it("leaves one-finger touch native and handles only two-touch pinch", async () => {
    const onMatchAction = vi.fn();
    renderViewport(onMatchAction);
    const frames: FrameRequestCallback[] = [];
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    const viewport = await screen.findByRole("region", {
      name: /connected tournament bracket/i,
    });
    const oneTouch = [{ clientX: 100, clientY: 100 }];
    expect(fireEvent.touchStart(viewport, { touches: oneTouch })).toBe(true);
    expect(fireEvent.touchMove(viewport, { touches: oneTouch })).toBe(true);
    fireEvent.pointerDown(viewport, {
      clientX: 100,
      clientY: 100,
      pointerId: 10,
      pointerType: "touch",
    });
    fireEvent.pointerMove(viewport, {
      clientX: 50,
      clientY: 100,
      pointerId: 10,
      pointerType: "touch",
    });
    expect(viewport.dataset.bracketMode).toBe("readable");
    expect(requestFrame).not.toHaveBeenCalled();

    const start = [
      { clientX: 100, clientY: 100 },
      { clientX: 200, clientY: 100 },
    ];
    expect(fireEvent.touchStart(viewport, { touches: start })).toBe(false);
    expect(viewport.dataset.bracketMode).toBe("panning");
    expect(
      fireEvent.touchMove(viewport, {
        touches: [start[0], { clientX: 250, clientY: 100 }],
      }),
    ).toBe(false);
    expect(requestFrame).toHaveBeenCalledOnce();
    act(() => frames[0](0));
    expect(screen.getByLabelText("Current bracket zoom").textContent).toBe(
      "150%",
    );
    expect(viewport.scrollLeft).toBe(530);

    fireEvent.touchEnd(viewport, { touches: oneTouch });
    expect(viewport.dataset.bracketMode).toBe("detail");
    fireEvent.click(screen.getByRole("button", { name: "Start match" }));
    expect(onMatchAction).not.toHaveBeenCalled();

    fireEvent.touchStart(viewport, { touches: start });
    expect(viewport.dataset.bracketMode).toBe("panning");
    fireEvent.touchCancel(viewport, { touches: [] });
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
