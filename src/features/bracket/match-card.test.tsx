import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createTournamentBracket, type Player } from "@/src/tournament";
import { ByeCard, FinalMatchCard, MatchCard } from "./match-card";

const players: Player[] = ["Maya", "Rae", "Kai", "Noah"].map((name, index) => ({
  id: `p${index + 1}`,
  name,
  rating: "3.5",
}));
const bracket = createTournamentBracket(players, {
  drawStyle: "ranked",
  timingMode: "untimed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "card-test",
});
const waitingFinal = bracket.matches.find(
  ({ id }) => id === bracket.finalMatchId,
)!;

describe("bracket cards", () => {
  it("presents an automatic advance without inventing a BYE participant", () => {
    const markup = renderToStaticMarkup(
      <ByeCard label="Round 1 · 1" playerName="Maya" />,
    );

    expect(markup).toContain("Automatic advance");
    expect(markup).toContain("No opponent this round");
    expect(markup).not.toMatch(/>Bye</);
  });

  it("keeps the waiting state in a compact final header and the faceoff centered", () => {
    const markup = renderToStaticMarkup(
      <FinalMatchCard
        canStart={false}
        label="Final"
        match={waitingFinal}
        onCorrectMatch={vi.fn()}
        onStartMatch={vi.fn()}
        sideALabel="TBD"
        sideBLabel="TBD"
      />,
    );

    expect(markup).toContain('data-qa="final-status"');
    expect(markup).toContain('data-qa="final-faceoff"');
    expect(markup).toContain('data-qa="final-title"');
    expect(markup).not.toContain(">Championship<");
    expect(markup).not.toContain("pencil-line");
  });

  it("labels a completed match as complete rather than final", () => {
    const markup = renderToStaticMarkup(
      <FinalMatchCard
        canStart={false}
        label="Final"
        match={{ ...waitingFinal, status: "complete" }}
        onCorrectMatch={vi.fn()}
        onStartMatch={vi.fn()}
        sideALabel="A very long finalist name that must stay bounded"
        sideBLabel="Another very long finalist name that must stay bounded"
      />,
    );
    expect(markup).toContain(">Complete<");
  });

  it("keeps the edit action in the header of a recommended match", () => {
    const match = bracket.matches.find(
      ({ kind, status }) => kind === "elimination" && status === "ready",
    )!;
    const markup = renderToStaticMarkup(
      <MatchCard
        canStart
        recommended
        label="Round 1 · 1"
        match={match}
        onCorrectMatch={vi.fn()}
        onRenamePlayer={vi.fn(() => true)}
        onStartMatch={vi.fn()}
        sideALabel="Shemar"
        sideBLabel="Samantha"
      />,
    );

    expect(markup).toContain("tree-match-card--next");
    expect(markup).toMatch(
      /tree-match-card__header-tools[\s\S]*edit-bracket-match/,
    );
  });

  it("gives a ready final a dedicated state and symmetrical score lanes", () => {
    const readyFinal = {
      ...waitingFinal,
      sideA: { memberIds: [players[0].id] },
      sideB: { memberIds: [players[1].id] },
      status: "ready" as const,
    };
    const markup = renderToStaticMarkup(
      <FinalMatchCard
        canStart
        recommended
        label="Final"
        match={readyFinal}
        onCorrectMatch={vi.fn()}
        onRenamePlayer={vi.fn(() => true)}
        onStartMatch={vi.fn()}
        sideALabel="Shemar"
        sideBLabel="Samantha"
      />,
    );

    expect(markup).toContain("final-match-card tree-match-card--ready");
    expect(markup).toContain("tree-match-card--next");
    expect(markup.match(/data-show-score="false"/g)).toHaveLength(2);
    expect(markup).not.toContain("final-match-side tree-match-side");
  });
});
