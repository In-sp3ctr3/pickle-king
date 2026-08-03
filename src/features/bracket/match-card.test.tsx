import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createTournamentBracket, type Player } from "@/src/tournament";
import { ByeCard, FinalMatchCard } from "./match-card";

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
});
