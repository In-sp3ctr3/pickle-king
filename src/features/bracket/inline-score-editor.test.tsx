// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTournamentBracket, type Player } from "@/src/tournament";
import { InlineScoreEditor } from "./inline-score-editor";

const players: Player[] = ["Robbie", "Jadan", "Brad", "Samantha"].map(
  (name, index) => ({ id: `p${index + 1}`, name, rating: "3.5" }),
);
const bracket = createTournamentBracket(players, {
  drawStyle: "ranked",
  timingMode: "untimed",
  bookingMinutes: 120,
  warmupMinutes: 0,
  transitionSeconds: 0,
  targetScore: 7,
  randomSeed: "rename-editor",
});
const ready = bracket.matches.find(({ status }) => status === "ready")!;
const complete = {
  ...ready,
  scoreA: 7,
  scoreB: 3,
  status: "complete" as const,
  winnerId: ready.sideA!.memberIds[0],
  loserId: ready.sideB!.memberIds[0],
  completedAt: 1_000,
};

afterEach(cleanup);

describe("inline score editor", () => {
  it("renames a player without submitting an unchanged completed result", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onRenamePlayer = vi.fn(() => true);
    const onSave = vi.fn(() => true);
    render(
      <InlineScoreEditor
        match={complete}
        onCancel={onCancel}
        onRenamePlayer={onRenamePlayer}
        onSave={onSave}
        sideALabel="Robbie"
        sideBLabel="Jadan"
      />,
    );

    const name = screen.getByLabelText("Player name for Robbie");
    await user.clear(name);
    await user.type(name, "Smithy");
    await user.click(
      screen.getByRole("button", { name: "Save corrected score" }),
    );

    expect(onRenamePlayer).toHaveBeenCalledWith(
      complete.sideA!.memberIds[0],
      "Smithy",
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("submits when a completed match score actually changes", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(() => true);
    render(
      <InlineScoreEditor
        match={complete}
        onCancel={vi.fn()}
        onRenamePlayer={vi.fn(() => true)}
        onSave={onSave}
        sideALabel="Robbie"
        sideBLabel="Jadan"
      />,
    );

    const score = screen.getByLabelText("Score for Jadan");
    await user.clear(score);
    await user.type(score, "4");
    await user.click(
      screen.getByRole("button", { name: "Save corrected score" }),
    );

    expect(onSave).toHaveBeenCalledWith(complete.id, 7, 4, undefined);
  });

  it("rolls back the first label when the second rename is rejected", async () => {
    const user = userEvent.setup();
    const onRenamePlayer = vi
      .fn<(playerId: string, name: string) => boolean>()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(
      <InlineScoreEditor
        match={complete}
        onCancel={vi.fn()}
        onRenamePlayer={onRenamePlayer}
        onSave={vi.fn(() => true)}
        sideALabel="Robbie"
        sideBLabel="Jadan"
      />,
    );

    await user.clear(screen.getByLabelText("Player name for Robbie"));
    await user.type(screen.getByLabelText("Player name for Robbie"), "Smithy");
    await user.clear(screen.getByLabelText("Player name for Jadan"));
    await user.type(screen.getByLabelText("Player name for Jadan"), "Brad");
    await user.click(
      screen.getByRole("button", { name: "Save corrected score" }),
    );

    expect(onRenamePlayer.mock.calls).toEqual([
      [complete.sideA!.memberIds[0], "Smithy"],
      [complete.sideB!.memberIds[0], "Brad"],
      [complete.sideA!.memberIds[0], "Robbie"],
    ]);
  });
});
