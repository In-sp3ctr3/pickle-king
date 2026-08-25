export function quickHistoryFixture() {
  const completedAt = Date.UTC(2026, 7, 22, 18);
  const record = (
    id: string,
    offset: number,
    format: "singles" | "doubles",
    sideA: string[],
    sideB: string[],
  ) => ({
    id,
    completedAt: completedAt + offset,
    finishReason: "target",
    format,
    labels: { sideA: sideA.join(" + "), sideB: sideB.join(" + ") },
    participants: { sideA, sideB },
    score: { sideA: 11, sideB: 7 },
    targetScore: 11,
    winner: "A",
  });
  return {
    version: 2,
    quickMatches: [
      record("d7", 9_000, "doubles", ["Noa", "Pia"], ["Uma", "Vic"]),
      record("d6", 8_000, "doubles", ["Kai", "Leo"], ["Wes", "Sol"]),
      record("d5", 7_000, "doubles", ["Wes", "Maya"], ["Rae", "Sol"]),
      record("d4", 6_000, "doubles", ["Uma", "Vic"], ["Maya", "Rae"]),
      record("d3", 5_000, "doubles", ["Sol", "Taj"], ["Quin", "Rin"]),
      record("d2", 4_000, "doubles", ["Maya", "Rae"], ["Sol", "Taj"]),
      record("d1", 3_000, "doubles", ["Quin", "Rin"], ["Uma", "Vic"]),
      record("s2", 2_000, "singles", ["Maya"], ["Rae"]),
      record("s1", 1_000, "singles", ["Maya"], ["Sol"]),
    ],
    tournaments: [],
  };
}
