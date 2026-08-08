// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  completeMatch,
  createTournament,
  getNextMatch,
  type Player,
  type TournamentBracket,
  type TournamentConfig,
} from "@/src/tournament";
import { RoundRobinScreen } from "./round-robin-screen";

const players: Player[] = ["Maya", "Rae", "Kai", "Noah"].map((name, index) => ({
  id: `p${index + 1}`,
  name,
  rating: "3.5",
}));

const config: TournamentConfig = {
  format: "round-robin-finals",
  drawStyle: "random",
  timingMode: "untimed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "screen-test",
};

function tournament(): TournamentBracket {
  return createTournament(players, config);
}

function completedTournament(): TournamentBracket {
  let current = tournament();
  let timestamp = 1_000;
  while (getNextMatch(current)) {
    current = completeMatch(
      current,
      getNextMatch(current)!.id,
      11,
      5,
      timestamp,
    );
    timestamp += 1_000;
  }
  return current;
}

afterEach(cleanup);

let canvasContextMock: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  canvasContextMock = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(null);
});

afterAll(() => canvasContextMock.mockRestore());

describe("round robin tournament screen", () => {
  it("shows live standings, paired rounds, and unresolved placement matches", () => {
    render(
      <RoundRobinScreen
        bracket={tournament()}
        onCorrectMatch={vi.fn()}
        onRenamePlayer={vi.fn(() => true)}
        onStartMatch={vi.fn()}
        sessionLabel="Court booked until 4:00 PM"
        timingWarning="The current pace is tight."
      />,
    );

    const table = screen.getByRole("table", {
      name: /preliminary standings/i,
    });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map(({ textContent }) => textContent?.trim()),
    ).toEqual(["Place", "Player", "W–L", "For", "Against", "Diff"]);
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(screen.getByText(/two-player head-to-head/i)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(
      "The current pace is tight.",
    );

    for (const round of [1, 2, 3]) {
      expect(
        screen.getByRole("heading", { name: `Round ${round}` }),
      ).toBeTruthy();
    }
    expect(screen.getByText("3rd in standings")).toBeTruthy();
    expect(screen.getByText("4th in standings")).toBeTruthy();
    expect(screen.getByText("1st in standings")).toBeTruthy();
    expect(screen.getByText("2nd in standings")).toBeTruthy();
    expect(screen.queryByText(/share bracket/i)).toBeNull();
    expect(screen.queryByText(/edit draw/i)).toBeNull();
  });

  it("starts the recommended match and rerolls only an untouched random order", async () => {
    const user = userEvent.setup();
    const onStartMatch = vi.fn();
    const onRerollRandomDraw = vi.fn();
    const current = tournament();
    render(
      <RoundRobinScreen
        bracket={current}
        drawStyle="random"
        onCorrectMatch={vi.fn()}
        onRenamePlayer={vi.fn(() => true)}
        onRerollRandomDraw={onRerollRandomDraw}
        onStartMatch={onStartMatch}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /shuffle random player order/i }),
    );
    expect(onRerollRandomDraw).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: /start next match/i }));
    expect(onStartMatch).toHaveBeenCalledWith(getNextMatch(current)!.id);
  });

  it("announces qualified standings and exposes results after all eight matches", async () => {
    const user = userEvent.setup();
    const onViewResults = vi.fn();
    render(
      <RoundRobinScreen
        bracket={completedTournament()}
        onCorrectMatch={vi.fn()}
        onRenamePlayer={vi.fn(() => true)}
        onStartMatch={vi.fn()}
        onViewResults={onViewResults}
      />,
    );

    expect(screen.getAllByText("Final position")).toHaveLength(2);
    expect(screen.getAllByText("Third-place position")).toHaveLength(2);
    expect(screen.getByText(/8 of 8 matches complete/i)).toBeTruthy();
    expect(screen.getByText(/standings confirmed/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /view results/i }));
    expect(onViewResults).toHaveBeenCalledOnce();
  });
});
