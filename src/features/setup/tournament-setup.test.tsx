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

  it("returns to knockout after a fifth player and does not auto-restore", async () => {
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

    expect(
      screen
        .getByRole("button", { name: /fast knockout/i })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByRole("status").textContent).toContain(
      "Fast knockout selected because round robin + finals needs exactly four players.",
    );
    expect((roundRobin as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole("button", { name: "Remove player 5" }));
    expect((roundRobin as HTMLButtonElement).disabled).toBe(false);
    expect(roundRobin.getAttribute("aria-pressed")).toBe("false");
  });
});
