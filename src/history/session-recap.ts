import type { QuickMatchRecord } from "./types";

export interface RecapPlayerRecord {
  differential: number;
  gamesPlayed: number;
  losses: number;
  name: string;
  pointsAgainst: number;
  pointsFor: number;
  wins: number;
}

export interface RecapPairRecord extends RecapPlayerRecord {
  names: [string, string];
}

export interface SessionRecapSection {
  completedAt: { first: number; last: number };
  format: QuickMatchRecord["format"];
  matchCount: number;
  players: RecapPlayerRecord[];
  showDifferential: boolean;
  targetScore: number | null;
  topPair: RecapPairRecord | null;
}

interface MutableRecord {
  differential: number;
  gamesPlayed: number;
  losses: number;
  pointsAgainst: number;
  pointsFor: number;
  wins: number;
}

const formats = ["singles", "doubles"] as const;

export function buildSessionRecaps(
  matches: QuickMatchRecord[],
): SessionRecapSection[] {
  return formats.flatMap((format) => {
    const selected = matches.filter((match) => match.format === format);
    return selected.length >= 2 ? [buildSection(selected, format)] : [];
  });
}

function buildSection(
  matches: QuickMatchRecord[],
  format: QuickMatchRecord["format"],
): SessionRecapSection {
  const names = newestNames(matches);
  const pairOrder = newestPairOrder(matches);
  const players = new Map<string, MutableRecord>();
  const pairs = new Map<string, MutableRecord>();
  const targetScore = matches[0]?.targetScore ?? null;
  const showDifferential = matches.every(
    (match) =>
      match.targetScore === targetScore && match.finishReason === "target",
  );

  for (const match of matches) {
    addSide(players, match, "A");
    addSide(players, match, "B");
    if (format === "doubles") {
      addPair(pairs, match, "A");
      addPair(pairs, match, "B");
    }
  }

  const playerValues = [...players].map(([key, value]) => ({
    ...value,
    name: names.get(key) ?? "Player",
  }));
  playerValues.sort((left, right) =>
    compareRecords(left, right, showDifferential),
  );
  const pairValues = [...pairs].map(([key, value]) => {
    const pair = pairOrder.get(key) ?? (JSON.parse(key) as [string, string]);
    return {
      ...value,
      name: pair.map((item) => names.get(item) ?? "Player").join(" + "),
      names: pair.map((item) => names.get(item) ?? "Player") as [
        string,
        string,
      ],
    };
  });
  const completed = matches.map(({ completedAt }) => completedAt);
  return {
    completedAt: {
      first: Math.min(...completed),
      last: Math.max(...completed),
    },
    format,
    matchCount: matches.length,
    players: playerValues,
    showDifferential,
    targetScore: showDifferential ? targetScore : null,
    topPair: uniqueTopPair(pairValues, showDifferential),
  };
}

function newestNames(matches: QuickMatchRecord[]) {
  const names = new Map<string, string>();
  for (const match of orderedMatches(matches)) {
    for (const name of [
      ...match.participants.sideA,
      ...match.participants.sideB,
    ]) {
      // ponytail: names are cross-match identity; add persisted player IDs if same-name collisions appear.
      names.set(normalizeName(name), name.trim());
    }
  }
  return names;
}

function newestPairOrder(matches: QuickMatchRecord[]) {
  const pairs = new Map<string, [string, string]>();
  for (const match of orderedMatches(matches)) {
    for (const participants of [
      match.participants.sideA,
      match.participants.sideB,
    ]) {
      if (participants.length !== 2) continue;
      const normalized = participants.map(normalizeName) as [string, string];
      pairs.set(JSON.stringify([...normalized].sort()), normalized);
    }
  }
  return pairs;
}

function orderedMatches(matches: QuickMatchRecord[]) {
  return [...matches].sort(
    (left, right) =>
      left.completedAt - right.completedAt || left.id.localeCompare(right.id),
  );
}

function addSide(
  values: Map<string, MutableRecord>,
  match: QuickMatchRecord,
  side: "A" | "B",
) {
  const won = match.winner === side;
  const pointsFor = side === "A" ? match.score.sideA : match.score.sideB;
  const pointsAgainst = side === "A" ? match.score.sideB : match.score.sideA;
  const participants =
    side === "A" ? match.participants.sideA : match.participants.sideB;
  for (const name of participants) {
    addResult(values, normalizeName(name), won, pointsFor, pointsAgainst);
  }
}

function addPair(
  values: Map<string, MutableRecord>,
  match: QuickMatchRecord,
  side: "A" | "B",
) {
  const participants =
    side === "A" ? match.participants.sideA : match.participants.sideB;
  if (participants.length !== 2) return;
  const key = JSON.stringify(participants.map(normalizeName).sort());
  const pointsFor = side === "A" ? match.score.sideA : match.score.sideB;
  const pointsAgainst = side === "A" ? match.score.sideB : match.score.sideA;
  addResult(values, key, match.winner === side, pointsFor, pointsAgainst);
}

function addResult(
  values: Map<string, MutableRecord>,
  key: string,
  won: boolean,
  pointsFor: number,
  pointsAgainst: number,
) {
  const value = values.get(key) ?? {
    differential: 0,
    gamesPlayed: 0,
    losses: 0,
    pointsAgainst: 0,
    pointsFor: 0,
    wins: 0,
  };
  value.gamesPlayed += 1;
  value.wins += won ? 1 : 0;
  value.losses += won ? 0 : 1;
  value.pointsFor += pointsFor;
  value.pointsAgainst += pointsAgainst;
  value.differential = value.pointsFor - value.pointsAgainst;
  values.set(key, value);
}

function uniqueTopPair(pairs: RecapPairRecord[], showDifferential: boolean) {
  const eligible = pairs
    .filter(({ gamesPlayed }) => gamesPlayed >= 2)
    .sort((left, right) => compareRecords(left, right, showDifferential));
  if (!eligible[0]) return null;
  if (
    eligible[1] &&
    compareNumericRecords(eligible[0], eligible[1], showDifferential) === 0
  ) {
    return null;
  }
  return eligible[0];
}

function compareRecords(
  left: RecapPlayerRecord,
  right: RecapPlayerRecord,
  showDifferential: boolean,
) {
  return (
    compareNumericRecords(left, right, showDifferential) ||
    left.name.localeCompare(right.name)
  );
}

function compareNumericRecords(
  left: RecapPlayerRecord,
  right: RecapPlayerRecord,
  showDifferential: boolean,
) {
  return (
    right.wins - left.wins ||
    left.losses - right.losses ||
    (showDifferential ? right.differential - left.differential : 0)
  );
}

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function paginateRecapPlayers<T>(values: T[], maximum = 6): T[][] {
  if (!values.length) return [];
  const pageCount = Math.ceil(values.length / maximum);
  const baseSize = Math.floor(values.length / pageCount);
  const largerPages = values.length % pageCount;
  const pages: T[][] = [];
  let start = 0;
  for (let page = 0; page < pageCount; page += 1) {
    const size = baseSize + (page < largerPages ? 1 : 0);
    pages.push(values.slice(start, start + size));
    start += size;
  }
  return pages;
}

export function latestQuickMatchDayIds(matches: QuickMatchRecord[]) {
  const latest = Math.max(...matches.map(({ completedAt }) => completedAt));
  if (!Number.isFinite(latest)) return new Set<string>();
  const day = localDayKey(latest);
  return new Set(
    matches
      .filter(({ completedAt }) => localDayKey(completedAt) === day)
      .map(({ id }) => id),
  );
}

export function receiptDateLabel(timestamps: number[]) {
  const first = new Date(Math.min(...timestamps));
  const last = new Date(Math.max(...timestamps));
  if (!Number.isFinite(first.getTime()) || !Number.isFinite(last.getTime())) {
    return "SESSION RECEIPTS";
  }
  const month = (value: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short" })
      .format(value)
      .toUpperCase();
  const sameYear = first.getFullYear() === last.getFullYear();
  const sameMonth = sameYear && first.getMonth() === last.getMonth();
  const sameDay = sameMonth && first.getDate() === last.getDate();
  if (sameDay) return `${month(first)} ${first.getDate()} RECEIPTS`;
  if (sameMonth) {
    return `${month(first)} ${first.getDate()}–${last.getDate()} RECEIPTS`;
  }
  const start = `${month(first)} ${first.getDate()}${sameYear ? "" : `, ${first.getFullYear()}`}`;
  const end = `${month(last)} ${last.getDate()}${sameYear ? "" : `, ${last.getFullYear()}`}`;
  return `${start}–${end} RECEIPTS`;
}

function localDayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
