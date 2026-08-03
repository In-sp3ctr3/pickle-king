import { describe, expect, it } from "vitest";
import { emptySessionHistory } from "../history";
import type { TournamentSnapshotV1 } from "../persistence/schema";
import { stateFromSnapshot } from "./app-helpers";

const archivedScreen: TournamentSnapshotV1 = {
  version: 1,
  updatedAt: 1,
  screen: "history-results",
  setupDraft: null,
  tournament: null,
  activeMatchId: null,
  scorer: null,
  sessionDeadline: null,
  quickMatch: false,
  historyTournamentId: "missing-archive",
};

describe("application hydration", () => {
  it("returns to history when an archived result no longer exists", () => {
    const state = stateFromSnapshot(
      { status: "ok", snapshot: archivedScreen },
      { status: "ok", history: emptySessionHistory() },
    );

    expect(state).toMatchObject({
      screen: "history",
      historyTournamentId: null,
      tournament: null,
    });
  });
});
