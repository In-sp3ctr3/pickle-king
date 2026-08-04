import {
  PLAYER_NAME_MAX_LENGTH,
  SKILL_LEVELS,
  type Player,
  type TournamentBracket,
} from "./types";

function validateName(
  players: Player[],
  playerId: string,
  name: string,
): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > PLAYER_NAME_MAX_LENGTH) {
    throw new Error(
      `Player names must be between 1 and ${PLAYER_NAME_MAX_LENGTH} characters.`,
    );
  }
  const duplicate = players.some(
    (player) =>
      player.id !== playerId &&
      player.name.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
  );
  if (duplicate) throw new Error("Player names must be unique.");
  return trimmed;
}

export function renameTournamentPlayer(
  bracket: TournamentBracket,
  playerId: string,
  name: string,
): TournamentBracket {
  if (!bracket.players.some(({ id }) => id === playerId)) {
    throw new Error("Player not found.");
  }
  const trimmed = validateName(bracket.players, playerId, name);
  return {
    ...bracket,
    players: bracket.players.map((player) =>
      player.id === playerId ? { ...player, name: trimmed } : player,
    ),
  };
}

export function tournamentHasStarted(bracket: TournamentBracket): boolean {
  return bracket.matches.some(
    ({ startedAt, status }) => startedAt !== null || status === "complete",
  );
}

export function validateTournamentField(players: Player[]): void {
  if (players.length < 4 || players.length > 16) {
    throw new Error("Tournament entrants must be between 4 and 16.");
  }
  const ids = new Set(players.map(({ id }) => id));
  const names = new Set<string>();
  for (const player of players) {
    if (!ids.has(player.id) || !SKILL_LEVELS.includes(player.rating)) {
      throw new Error("Every player needs a valid identity and rating.");
    }
    const normalized = validateName(
      players,
      player.id,
      player.name,
    ).toLowerCase();
    names.add(normalized);
  }
  if (ids.size !== players.length || names.size !== players.length) {
    throw new Error("Player ids and names must be unique.");
  }
}
