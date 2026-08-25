// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickShareStylePicker } from "./quick-share-style-picker";

afterEach(cleanup);

describe("QuickShareStylePicker", () => {
  it("exposes three named buttons and changes the selected style", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <QuickShareStylePicker onChange={onChange} value="poster" />,
    );

    expect(screen.getByRole("group", { name: "Image style" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Poster" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    screen.getByRole("button", { name: "Frame" }).focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("frame");

    rerender(<QuickShareStylePicker onChange={onChange} value="frame" />);
    expect(
      screen
        .getByRole("button", { name: "Frame" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
