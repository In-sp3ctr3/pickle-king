// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLAYER_NAME_MAX_LENGTH } from "../../tournament";
import { QuickMatchSetup } from "./quick-match-setup";

afterEach(cleanup);

describe("Quick Match player names", () => {
  it("uses the shared player-name limit and excludes longer legacy suggestions", async () => {
    const user = userEvent.setup();
    render(
      <QuickMatchSetup
        onStart={vi.fn()}
        suggestions={["Maya", "A legacy player name that is much too long"]}
      />,
    );

    const sideA = screen.getByLabelText("Side A") as HTMLInputElement;
    expect(PLAYER_NAME_MAX_LENGTH).toBe(16);
    expect(sideA.maxLength).toBe(PLAYER_NAME_MAX_LENGTH);
    await user.click(sideA);
    expect(screen.getByRole("option", { name: /Maya/ })).toBeTruthy();
    expect(screen.queryByText(/legacy player name/i)).toBeNull();
  });

  it("accepts sixteen trimmed characters and rejects seventeen", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<QuickMatchSetup onStart={onStart} />);
    const sideA = screen.getByLabelText("Side A");
    const sideB = screen.getByLabelText("Side B");

    fireEvent.change(sideA, { target: { value: " Jean-Baptiste M. " } });
    await user.type(sideB, "Maya");
    await user.click(screen.getByRole("button", { name: /open scorer/i }));
    expect(onStart).toHaveBeenCalledOnce();

    fireEvent.change(sideA, { target: { value: "12345678901234567" } });
    await user.click(screen.getByRole("button", { name: /open scorer/i }));
    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.getByText("Use 16 characters or fewer.")).toBeTruthy();
  });
});
