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

    expect(screen.getByRole("radiogroup", { name: "Design" })).toBeTruthy();
    expect(
      screen
        .getByRole("radio", { name: "Poster" })
        .getAttribute("aria-checked"),
    ).toBe("true");

    screen.getByRole("radio", { name: "Frame" }).focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("frame");

    rerender(<QuickShareStylePicker onChange={onChange} value="frame" />);
    expect(
      screen.getByRole("radio", { name: "Frame" }).getAttribute("aria-checked"),
    ).toBe("true");
  });
});
