import type { SessionHistoryV2 } from "../history";
import {
  sessionHistoryV1Schema,
  sessionHistoryV2Schema,
} from "./history-schema";
import type { StorageLike } from "./storage";

export const HISTORY_KEY = "pickle-king:history";

export type HistoryLoad =
  | { status: "empty" }
  | { status: "ok"; history: SessionHistoryV2 }
  | { status: "corrupt"; message: string };

export function migrateHistory(value: unknown): SessionHistoryV2 {
  if (!value || typeof value !== "object") {
    throw new Error("The saved match history is not an object.");
  }
  const version = "version" in value ? value.version : undefined;
  if (version !== 1 && version !== 2) {
    throw new Error(`Match history version ${String(version)} is unsupported.`);
  }
  if (version === 2) return parseHistoryV2(value);
  const parsed = sessionHistoryV1Schema.safeParse(value);
  if (!parsed.success) {
    throw new Error("The saved match history failed validation.");
  }
  return parseHistoryV2({
    ...parsed.data,
    version: 2,
    tournaments: parsed.data.tournaments.map((archive) => ({
      ...archive,
      bracket: { ...archive.bracket, format: "knockout" },
    })),
  });
}

function parseHistoryV2(value: unknown): SessionHistoryV2 {
  const parsed = sessionHistoryV2Schema.safeParse(value);
  if (!parsed.success) {
    throw new Error("The saved match history failed validation.");
  }
  return parsed.data;
}

export function loadHistory(storage: StorageLike): HistoryLoad {
  const raw = storage.getItem(HISTORY_KEY);
  if (raw === null) return { status: "empty" };
  try {
    return { status: "ok", history: migrateHistory(JSON.parse(raw)) };
  } catch (error) {
    return {
      status: "corrupt",
      message:
        error instanceof Error ? error.message : "Match history is invalid.",
    };
  }
}

export function saveHistory(
  storage: StorageLike,
  history: SessionHistoryV2,
): void {
  const validated = sessionHistoryV2Schema.parse(history);
  storage.setItem(HISTORY_KEY, JSON.stringify(validated));
}

export function clearHistory(storage: StorageLike): void {
  storage.removeItem(HISTORY_KEY);
}
