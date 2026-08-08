import {
  snapshotV1Schema,
  snapshotV2Schema,
  type TournamentSnapshotV2,
} from "./schema";

export const SNAPSHOT_KEY = "pickle-king:snapshot";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type SnapshotLoad =
  | { status: "empty" }
  | { status: "ok"; snapshot: TournamentSnapshotV2 }
  | { status: "corrupt"; message: string };

export function migrateSnapshot(value: unknown): TournamentSnapshotV2 {
  if (!value || typeof value !== "object") {
    throw new Error("The saved session is not an object.");
  }
  const version = "version" in value ? value.version : undefined;
  if (version !== 1 && version !== 2) {
    throw new Error(`Saved session version ${String(version)} is unsupported.`);
  }
  const prepared = migrateLegacyDrawStyle(value);
  if (version === 2) return parseSnapshotV2(prepared);
  const parsed = snapshotV1Schema.safeParse(prepared);
  if (!parsed.success) {
    throw new Error("The saved session failed validation.");
  }
  return parseSnapshotV2({
    ...parsed.data,
    version: 2,
    setupDraft: parsed.data.setupDraft
      ? {
          ...parsed.data.setupDraft,
          config: { ...parsed.data.setupDraft.config, format: "knockout" },
        }
      : null,
    tournament: parsed.data.tournament
      ? { ...parsed.data.tournament, format: "knockout" }
      : null,
  });
}

function parseSnapshotV2(value: unknown): TournamentSnapshotV2 {
  const parsed = snapshotV2Schema.safeParse(value);
  if (!parsed.success) throw new Error("The saved session failed validation.");
  return parsed.data;
}

function migrateLegacyDrawStyle(value: object): object {
  if (!("setupDraft" in value) || !value.setupDraft) return value;
  const setupDraft = value.setupDraft;
  if (typeof setupDraft !== "object" || !("config" in setupDraft)) return value;
  const config = setupDraft.config;
  if (!config || typeof config !== "object") return value;
  const drawStyle = "drawStyle" in config ? config.drawStyle : undefined;
  const migrated =
    drawStyle === "competitive"
      ? "ranked"
      : drawStyle === "social"
        ? "random"
        : drawStyle;
  return {
    ...value,
    setupDraft: {
      ...setupDraft,
      config: { ...config, ...(migrated ? { drawStyle: migrated } : {}) },
    },
  };
}

export function loadSnapshot(storage: StorageLike): SnapshotLoad {
  const raw = storage.getItem(SNAPSHOT_KEY);
  if (raw === null) return { status: "empty" };
  try {
    return { status: "ok", snapshot: migrateSnapshot(JSON.parse(raw)) };
  } catch (error) {
    return {
      status: "corrupt",
      message:
        error instanceof Error
          ? error.message
          : "The saved session is invalid.",
    };
  }
}

export function saveSnapshot(
  storage: StorageLike,
  snapshot: TournamentSnapshotV2,
): void {
  const validated = snapshotV2Schema.parse(snapshot);
  storage.setItem(SNAPSHOT_KEY, JSON.stringify(validated));
}

export function clearSnapshot(storage: StorageLike): void {
  storage.removeItem(SNAPSHOT_KEY);
}
