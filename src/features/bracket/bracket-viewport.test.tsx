// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  bracketAnchoredScroll,
  bracketFitScale,
} from "./bracket-viewport-geometry";
import {
  BOARD,
  registerBracketViewportTestSetup,
  renderViewport,
} from "./bracket-viewport-test-helpers";

registerBracketViewportTestSetup();

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
});
