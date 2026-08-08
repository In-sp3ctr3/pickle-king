import type { TournamentSnapshotV1 } from "@/src/persistence/schema";
import { FloatingAppNav } from "@/src/shared/ui";
import type { TournamentFormat } from "../tournament";

type Screen = TournamentSnapshotV1["screen"];
type NavigableScreen =
  | "bracket"
  | "history"
  | "history-results"
  | "quick-setup"
  | "results"
  | "setup";

const navigation: Record<
  NavigableScreen,
  { backLabel: string; backScreen: Screen; currentLabel: string }
> = {
  bracket: {
    backLabel: "Setup",
    backScreen: "setup",
    currentLabel: "Bracket",
  },
  "quick-setup": {
    backLabel: "Home",
    backScreen: "home",
    currentLabel: "Quick match",
  },
  results: {
    backLabel: "Bracket",
    backScreen: "bracket",
    currentLabel: "Results",
  },
  setup: {
    backLabel: "Home",
    backScreen: "home",
    currentLabel: "Tournament setup",
  },
  history: {
    backLabel: "Home",
    backScreen: "home",
    currentLabel: "Match history",
  },
  "history-results": {
    backLabel: "History",
    backScreen: "history",
    currentLabel: "Tournament results",
  },
};

export function AppNavigation({
  onNavigate,
  screen,
  tournamentFormat,
}: {
  onNavigate: (screen: Screen) => void;
  screen: Screen;
  tournamentFormat?: TournamentFormat;
}) {
  if (!(screen in navigation)) return null;
  const configured = navigation[screen as NavigableScreen];
  const roundRobin = tournamentFormat === "round-robin-finals";
  const item =
    screen === "bracket" && roundRobin
      ? { ...configured, currentLabel: "Round robin" }
      : screen === "results" && roundRobin
        ? { ...configured, backLabel: "Schedule" }
        : configured;
  return (
    <FloatingAppNav
      backLabel={item.backLabel}
      currentLabel={item.currentLabel}
      onBack={() => onNavigate(item.backScreen)}
      onHome={() => onNavigate("home")}
    />
  );
}
