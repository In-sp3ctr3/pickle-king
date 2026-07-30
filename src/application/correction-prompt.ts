export interface CorrectionSide {
  id: string;
  label: string;
}

export interface CorrectedResult {
  scoreA: number;
  scoreB: number;
  winnerIdOverride?: string;
}

function parseScore(value: string | null): number | null {
  if (value === null || !/^\d+$/u.test(value.trim())) return null;
  const score = Number(value);
  return Number.isSafeInteger(score) ? score : null;
}

export function promptForCorrection(input: {
  currentScoreA: number;
  currentScoreB: number;
  currentWinnerId: string | null;
  prompt: (message: string, defaultValue?: string) => string | null;
  sideA: CorrectionSide;
  sideB: CorrectionSide;
}): CorrectedResult | null {
  const scoreA = parseScore(
    input.prompt(
      "Correct score for the first side",
      String(input.currentScoreA),
    ),
  );
  if (scoreA === null) return null;
  const scoreB = parseScore(
    input.prompt(
      "Correct score for the second side",
      String(input.currentScoreB),
    ),
  );
  if (scoreB === null) return null;
  if (scoreA !== scoreB) return { scoreA, scoreB };

  const currentWinner =
    input.currentWinnerId === input.sideA.id ? input.sideA : input.sideB;
  const selected = input.prompt(
    `The corrected score is tied. Type ${input.sideA.label} or ${input.sideB.label} as the winner.`,
    currentWinner.label,
  );
  if (selected === null) return null;
  const normalized = selected.trim().toLocaleLowerCase();
  const winner =
    [input.sideA, input.sideB].find(
      ({ label }) => label.toLocaleLowerCase() === normalized,
    ) ?? null;
  return winner ? { scoreA, scoreB, winnerIdOverride: winner.id } : null;
}
