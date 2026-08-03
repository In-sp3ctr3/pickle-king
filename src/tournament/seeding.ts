import type { Player, SkillLevel } from "./types";

const RATING_VALUE: Record<SkillLevel, number> = {
  "2.5": 2.5,
  "3.0": 3,
  "3.5": 3.5,
  "4.0": 4,
  "4.5": 4.5,
  "5.0": 5,
  "5.5+": 5.5,
};

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFrom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function seedPlayers(players: Player[], randomSeed: string): Player[] {
  const random = randomFrom(randomSeed);
  const grouped = Map.groupBy(players, (player) => player.rating);
  return [...grouped.entries()]
    .sort(([left], [right]) => RATING_VALUE[right] - RATING_VALUE[left])
    .flatMap(([, group]) => shuffle(group, random))
    .map((player, index) => ({ ...player, seed: index + 1 }));
}

export function bracketSeedOrder(size: number): number[] {
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new Error("Bracket size must be a power of two.");
  }
  let order = [1, 2];
  while (order.length < size) {
    const nextSize = order.length * 2;
    order = order.flatMap((seed) => [seed, nextSize + 1 - seed]);
  }
  return order;
}

export function randomBracketSlots(
  seededPlayers: Player[],
  bracketSize: number,
  randomSeed: string,
): Array<Player | null> {
  const random = randomFrom(`${randomSeed}:random-draw`);
  const shuffledPlayers = shuffle(seededPlayers, random);
  const byeCount = bracketSize - seededPlayers.length;
  const byePlayers = shuffledPlayers.slice(0, byeCount);
  const activePlayers = shuffledPlayers.slice(byeCount);
  const matchups: Array<[Player, Player | null]> = [];
  for (let index = 0; index < activePlayers.length; index += 2) {
    matchups.push([activePlayers[index], activePlayers[index + 1]]);
  }
  for (const player of byePlayers) matchups.push([player, null]);
  return shuffle(matchups, random).flatMap(([left, right]) =>
    right && random() < 0.5 ? [right, left] : [left, right],
  );
}

export function allocateByes(
  seededPlayers: Player[],
  bracketSize: number,
): string[] {
  const playerBySeed = new Map(
    seededPlayers.map((player) => [player.seed, player]),
  );
  const order = bracketSeedOrder(bracketSize);
  const byePlayerIds: string[] = [];
  for (let index = 0; index < order.length; index += 2) {
    const left = playerBySeed.get(order[index]);
    const right = playerBySeed.get(order[index + 1]);
    if (left && !right) byePlayerIds.push(left.id);
    if (right && !left) byePlayerIds.push(right.id);
  }
  return byePlayerIds;
}

export function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(value));
}
