import { playerOnRight } from "../../match/service";
import type { ScoringAction, ScoringState } from "../../match/types";
import { ServeFixDialog } from "./serve-fix-dialog";
import { ServeSetupDialog } from "./serve-setup-dialog";

export function ServeTrackerDialogs({
  mode,
  onAction,
  onClose,
  onStatus,
  scorer,
}: {
  mode: "fix" | "setup" | null;
  onAction: (action: ScoringAction) => void;
  onClose: () => void;
  onStatus: (message: string) => void;
  scorer: ScoringState;
}) {
  if (mode === "setup") {
    return (
      <ServeSetupDialog
        onClose={onClose}
        onConfirm={(service) => {
          onClose();
          if (scorer.status === "idle") {
            onStatus("Opening serve set.");
            onAction({ type: "start", now: Date.now(), service });
            return;
          }
          const team = service.startingTeam;
          onStatus("Serve set to Server 1.");
          onAction({
            type: "configure-serve",
            service: {
              ...service,
              serverId: playerOnRight(
                scorer,
                team,
                team === "A" ? scorer.scoreA : scorer.scoreB,
                service,
              ),
              turn: "first",
            },
          });
        }}
        scorer={scorer}
      />
    );
  }
  if (mode !== "fix" || !scorer.service) return null;
  const servingMembers =
    scorer.service.servingTeam === "A"
      ? scorer.sideA.memberIds
      : scorer.sideB.memberIds;
  return (
    <ServeFixDialog
      canAdvance={
        scorer.service.turn === "first" && servingMembers.length === 2
      }
      onClose={onClose}
      onConfirm={(turn) => {
        onClose();
        onStatus(
          turn === "second" ? "Advanced to Server 2." : "Side out recorded.",
        );
        onAction({ type: "repair-serve", turn });
      }}
    />
  );
}
