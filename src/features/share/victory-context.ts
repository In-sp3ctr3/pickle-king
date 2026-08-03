import type { FinishReason, MatchTeam } from "../../match/types";

export interface VictoryContextInput {
  finishReason: FinishReason | null;
  scoreA: number;
  scoreB: number;
  winner: MatchTeam | null;
}

export function victoryContext(input: VictoryContextInput) {
  switch (input.finishReason) {
    case "golden-point":
      return "Golden point";
    case "buzzer":
      return "Buzzer win";
    case "ended-early":
      return "Ended early";
    case "operator-selection":
      return "Operator selected";
    case "target": {
      const margin = Math.abs(input.scoreA - input.scoreB);
      return `Won by ${margin}`;
    }
    default:
      return input.winner
        ? `Won by ${Math.abs(input.scoreA - input.scoreB)}`
        : "Final score";
  }
}
