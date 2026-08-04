import { MeasuredLabel } from "@/src/shared/ui";

export function FinalMatchSide({
  align,
  isLoser,
  isWinner,
  label,
  score,
  showScore,
}: {
  align: "left" | "right";
  isLoser: boolean;
  isWinner: boolean;
  label: string;
  score: number;
  showScore: boolean;
}) {
  const resultClass = isWinner
    ? "final-match-side--winner"
    : isLoser
      ? "final-match-side--loser"
      : "";
  return (
    <div
      className={`final-match-side is-${align} ${resultClass}`}
      data-show-score={showScore}
    >
      <MeasuredLabel maxSize={13} minSize={8} text={label} />
      <strong aria-hidden={!showScore}>{showScore ? score : ""}</strong>
    </div>
  );
}
