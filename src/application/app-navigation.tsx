import type { TournamentSnapshotV1 } from "@/src/persistence/schema";
import { FloatingAppNav } from "@/src/shared/ui";

type Screen = TournamentSnapshotV1["screen"];
type NavigableScreen =
  "bracket" | "history" | "quick-setup" | "results" | "setup";

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
};

export function AppNavigation({
  onNavigate,
  screen,
}: {
  onNavigate: (screen: Screen) => void;
  screen: Screen;
}) {
  if (!(screen in navigation)) return null;
  const item = navigation[screen as NavigableScreen];
  return (
    <FloatingAppNav
      backLabel={item.backLabel}
      currentLabel={item.currentLabel}
      onBack={() => onNavigate(item.backScreen)}
      onHome={() => onNavigate("home")}
    />
  );
}
