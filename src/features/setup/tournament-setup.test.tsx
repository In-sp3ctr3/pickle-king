// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TournamentSetup } from "./tournament-setup";

const initialValues = {
  players: ["Robbie", "Jadan", "Brad", "Samantha"].map((name) => ({
    name,
    rating: "3.5" as const,
  })),
};

function initialField(count: number, format?: "round-robin-finals") {
  return {
    format,
    players: Array.from({ length: count }, (_, index) => ({
      name: `Player ${index + 1}`,
      rating: "3.5" as const,
    })),
  };
}

afterEach(cleanup);

describe("tournament format setup", () => {
  it("defaults to fast knockout and submits the selected format", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TournamentSetup
        initialValues={initialValues}
        onQuickMatch={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen
        .getByRole("button", { name: /fast knockout/i })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByText(/4 matches · 2 per player · 26 min 45 sec cap each/i),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: /round robin \+ finals/i }),
    );
    expect(
      screen.getByRole("button", { name: /build tournament/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/8 matches · 4 per player · 12 min 52 sec cap each/i),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /build tournament/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ format: "round-robin-finals" }),
    );
  });

  it("keeps round robin for five and six, then falls back at seven", async () => {
    const user = userEvent.setup();
    render(
      <TournamentSetup
        initialValues={initialValues}
        onQuickMatch={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const roundRobin = screen.getByRole("button", {
      name: /round robin \+ finals/i,
    });
    await user.click(roundRobin);
    await user.click(
      screen.getByRole("button", { name: "Add another player" }),
    );
    expect(roundRobin.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByText(/12 matches · 4–5 per player · 8 min 15 sec cap each/i),
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Add another player" }),
    );
    expect(roundRobin.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByText(/17 matches · 5–6 per player · 5 min 31 sec cap each/i),
    ).toBeTruthy();
    expect(screen.getByText(/Tight timed schedule/i).textContent).toContain(
      "Tight timed schedule · 5 min 31 sec per match.",
    );
    expect(screen.queryByText(/advance automatically/i)).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Add another player" }),
    );

    expect(
      screen
        .getByRole("button", { name: /fast knockout/i })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByRole("status").textContent).toContain(
      "Fast knockout selected because round robin + finals supports 4–6 players.",
    );
    expect((roundRobin as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole("button", { name: "Remove player 7" }));
    expect((roundRobin as HTMLButtonElement).disabled).toBe(false);
    expect(roundRobin.getAttribute("aria-pressed")).toBe("false");
  });

  it("shows no schedule-risk advisory for an untimed six-player field", async () => {
    const user = userEvent.setup();
    render(
      <TournamentSetup
        initialValues={initialField(6, "round-robin-finals")}
        onQuickMatch={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "No time limit" }));
    expect(screen.getAllByText("17 matches · 5–6 per player")).toHaveLength(2);
    expect(screen.queryByText(/Tight timed schedule/i)).toBeNull();
  });

  it.each([5, 6])("restores a prefilled %i-player round robin", (count) => {
    render(
      <TournamentSetup
        initialValues={initialField(count, "round-robin-finals")}
        onQuickMatch={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen
        .getByRole("button", { name: /round robin \+ finals/i })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
