export interface ChampionCopyInput {
  championName: string;
  comebackCount: number;
  differential: number;
  seedKey: string;
  upsetCount: number;
  winningMargins: number[];
}

export function championCopy(input: ChampionCopyInput) {
  if (input.comebackCount > 0) {
    return {
      headline: "Never counted out.",
      subcomment: `${input.championName} came from behind when it mattered.`,
    };
  }
  if (input.upsetCount > 0) {
    return {
      headline: "Seedings, settled.",
      subcomment: `${input.championName} beat the draw, not just the predictions.`,
    };
  }
  if (input.differential >= 12) {
    return {
      headline: "Left no doubt.",
      subcomment: `${input.championName} controlled the night from first serve to final point.`,
    };
  }
  if (input.winningMargins.some((margin) => margin <= 2)) {
    return {
      headline: "Won the tight ones.",
      subcomment: `${input.championName} held steady when every point counted.`,
    };
  }
  const options = [
    ["Court claimed.", `${input.championName} finished the road to the crown.`],
    [
      "Last one standing.",
      `${input.championName} closed the bracket in style.`,
    ],
    [
      "The crown fits.",
      `${input.championName} owns this tournament's final word.`,
    ],
  ] as const;
  const [headline, subcomment] = options[hash(input.seedKey) % options.length];
  return { headline, subcomment };
}

function hash(value: string) {
  let output = 0;
  for (const character of value) {
    output = (Math.imul(output, 31) + character.charCodeAt(0)) >>> 0;
  }
  return output;
}
