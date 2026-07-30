import { snapshotV1Schema, type TournamentSnapshotV1 } from "./schema";

export const SNAPSHOT_KEY = "pickle-king:snapshot";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type SnapshotLoad =
  | { status: "empty" }
  | { status: "ok"; snapshot: TournamentSnapshotV1 }
  | { status: "corrupt"; message: string };

export function migrateSnapshot(value: unknown): TournamentSnapshotV1 {
  if (!value || typeof value !== "object") {
    throw new Error("The saved session is not an object.");
  }
  const version = "version" in value ? value.version : undefined;
  if (version !== 1) {
    throw new Error(`Saved session version ${String(version)} is unsupported.`);
  }
  const parsed = snapshotV1Schema.safeParse(value);
  if (!parsed.success) {
    throw new Error("The saved session failed validation.");
  }
  return parsed.data;
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
  snapshot: TournamentSnapshotV1,
): void {
  const validated = snapshotV1Schema.parse(snapshot);
  storage.setItem(SNAPSHOT_KEY, JSON.stringify(validated));
}

export function clearSnapshot(storage: StorageLike): void {
  storage.removeItem(SNAPSHOT_KEY);
}
