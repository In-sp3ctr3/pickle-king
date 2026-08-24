// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuickMatchRecord } from "../../history";
import { QuickMatchHistory } from "./quick-match-history";

function match(
  id: string,
  completedAt: number,
  format: QuickMatchRecord["format"],
): QuickMatchRecord {
  const sideA = format === "singles" ? ["Maya"] : ["Maya", "Rae"];
  const sideB = format === "singles" ? ["Kai"] : ["Kai", "Noah"];
  return {
    id,
    completedAt,
    finishReason: "target",
    format,
    labels: { sideA: sideA.join(" + "), sideB: sideB.join(" + ") },
    participants: { sideA, sideB },
    score: { sideA: 11, sideB: 7 },
    targetScore: 11,
    winner: "A",
  };
}

afterEach(cleanup);

describe("Quick Match recap selection", () => {
  it("preselects the newest local day, allows toggling, and restores ledger actions on cancel", async () => {
    const user = userEvent.setup();
    const values = [
      match("new-2", new Date(2026, 7, 22, 20).getTime(), "doubles"),
      match("new-1", new Date(2026, 7, 22, 18).getTime(), "doubles"),
      match("old", new Date(2026, 7, 21, 20).getTime(), "singles"),
    ];
    render(<QuickMatchHistory matches={values} onRemove={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: "Share" })).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Create recap" }));

    expect(screen.getByText("2 selected")).toBeTruthy();
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(2);
    expect(
      document.querySelector(".session-ledger__row--selecting"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Preview recap",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);

    await user.click(screen.getByLabelText(/select maya versus kai/i));
    expect(screen.getByText("3 selected")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Share" })).toHaveLength(3);
  });

  it("omits a one-match format and explains its existing share path", async () => {
    const user = userEvent.setup();
    const day = new Date(2026, 7, 22, 18).getTime();
    render(
      <QuickMatchHistory
        matches={[
          match("single", day, "singles"),
          match("double-1", day + 1, "doubles"),
          match("double-2", day + 2, "doubles"),
        ]}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create recap" }));
    expect(screen.getByText(/one more Singles match/i)).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Preview recap",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
});
