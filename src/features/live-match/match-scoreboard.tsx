import { Play } from "lucide-react";
import type { RefObject } from "react";
import type { MatchTeam, ScoringState } from "../../match/types";
import { ScoreSide } from "./score-side";

export function MatchScoreboard({
  canScore,
  onRally,
  onUndo,
  scorer,
  startButtonRef,
  onStart,
  teamOrder,
}: {
  canScore: boolean;
  onRally: (team: "A" | "B") => void;
  onUndo: (team: "A" | "B") => void;
  scorer: ScoringState;
  startButtonRef: RefObject<HTMLButtonElement | null>;
  onStart: () => void;
  teamOrder: readonly MatchTeam[];
}) {
  return (
    <div className="scoreboard">
      {teamOrder.map((team) => (
        <ScoreSide
          disabled={!canScore}
          key={team}
          label={team === "A" ? scorer.labelA : scorer.labelB}
          leader={
            team === "A"
              ? scorer.scoreA > scorer.scoreB
              : scorer.scoreB > scorer.scoreA
          }
          onRallyWon={() => onRally(team)}
          onSubtract={() => onUndo(team)}
          score={team === "A" ? scorer.scoreA : scorer.scoreB}
          showHint={scorer.status !== "idle"}
          team={team}
        />
      ))}
      {scorer.status === "idle" ? (
        <div className="match-start-overlay">
          <button
            aria-label="Start match"
            className="match-start-button"
            data-qa="match-start"
            data-screen-initial-focus
            onClick={onStart}
            ref={startButtonRef}
            type="button"
          >
            <Play aria-hidden="true" fill="currentColor" size={28} />
            <strong>Start match</strong>
            <span>
              Play to {scorer.targetScore}
              {scorer.durationMs === null
                ? ""
                : ` · ${Math.round(scorer.durationMs / 60_000)} min`}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
