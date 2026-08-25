export function quickWinnerLines(
  value: string,
  fits: (line: string) => boolean = () => true,
) {
  const team = value.split(/\s*\+\s*/).filter(Boolean);
  if (team.length > 1) return [team[0], `+ ${team.slice(1).join(" + ")}`];
  const trimmed = value.trim();
  const natural = balancedNaturalLines(trimmed, fits);
  if (natural) return natural;
  if (fits(trimmed)) return [trimmed];
  const graphemes = segmentGraphemes(trimmed);
  let split = Math.ceil(graphemes.length / 2);
  for (let index = 1; index < graphemes.length; index += 1) {
    const candidate = [
      graphemes.slice(0, index).join(""),
      graphemes.slice(index).join(""),
    ];
    if (
      candidate.every(fits) &&
      Math.abs(graphemes.length / 2 - index) <
        Math.abs(graphemes.length / 2 - split)
    ) {
      split = index;
    }
  }
  return [graphemes.slice(0, split).join(""), graphemes.slice(split).join("")];
}

function balancedNaturalLines(value: string, fits: (line: string) => boolean) {
  const spaces = Array.from(value.matchAll(/\s+/g), ({ index }) => index);
  const hyphens = Array.from(
    value.matchAll(/-+/g),
    (match) => match.index + match[0].length,
  );
  let positions = spaces.filter((position) => position > 0);
  if (
    !positions.some((position) =>
      [value.slice(0, position).trim(), value.slice(position).trim()].every(
        fits,
      ),
    )
  ) {
    positions = [...positions, ...hyphens];
  }
  const candidates = positions
    .filter((position) => position > 0 && position < value.length)
    .map((position) => [
      value.slice(0, position).trim(),
      value.slice(position).trim(),
    ]);
  if (!candidates.length) return null;
  return candidates.reduce((best, candidate) => {
    const candidateFits = candidate.every(fits);
    const bestFits = best.every(fits);
    if (candidateFits !== bestFits) return candidateFits ? candidate : best;
    return Math.abs(candidate[0].length - candidate[1].length) <
      Math.abs(best[0].length - best[1].length)
      ? candidate
      : best;
  });
}

function segmentGraphemes(value: string) {
  if (typeof Intl.Segmenter === "undefined") return Array.from(value);
  return Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
    ({ segment }) => segment,
  );
}
