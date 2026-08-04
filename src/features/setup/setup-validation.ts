import type {
  SetupErrors,
  SetupNumberDrafts,
  SetupPlayerDraft,
  TournamentSetupValues,
} from "./setup-types";
import { calculateMatchCap, PLAYER_NAME_MAX_LENGTH } from "@/src/tournament";

function integerInRange(
  value: string,
  minimum: number,
  maximum: number,
): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

export function validateSetup(
  players: SetupPlayerDraft[],
  numbers: SetupNumberDrafts,
  timingMode: "timed" | "untimed",
): {
  errors: SetupErrors;
  values?: Omit<TournamentSetupValues, "drawStyle">;
} {
  const errors: SetupErrors = { names: {}, ratings: {} };
  const normalizedNames = players.map((player) =>
    player.name.trim().toLocaleLowerCase(),
  );

  if (players.length < 4 || players.length > 16) {
    errors.form = "Add between 4 and 16 players.";
  }

  players.forEach((player, index) => {
    if (!normalizedNames[index]) {
      errors.names[player.id] = "Enter a player name.";
    } else if (player.name.trim().length > PLAYER_NAME_MAX_LENGTH) {
      errors.names[player.id] =
        `Use ${PLAYER_NAME_MAX_LENGTH} characters or fewer.`;
    } else if (
      normalizedNames.filter((name) => name === normalizedNames[index]).length >
      1
    ) {
      errors.names[player.id] = "Use a unique player name.";
    }
    if (!player.rating) {
      errors.ratings[player.id] = "Choose a rating.";
    }
  });

  const parsedBooking = integerInRange(numbers.bookingMinutes, 30, 480);
  const parsedWarmup = integerInRange(numbers.warmupMinutes, 0, 60);
  const parsedTransition = integerInRange(numbers.transitionSeconds, 0, 600);
  const bookingMinutes = parsedBooking ?? 120;
  const warmupMinutes = parsedWarmup ?? 10;
  const transitionSeconds = parsedTransition ?? 60;
  const targetScore = integerInRange(numbers.targetScore, 1, 99);

  if (timingMode === "timed" && parsedBooking === null) {
    errors.bookingMinutes = "Use a whole number from 30 to 480.";
  }
  if (timingMode === "timed" && parsedWarmup === null) {
    errors.warmupMinutes = "Use a whole number from 0 to 60.";
  } else if (
    timingMode === "timed" &&
    parsedBooking !== null &&
    parsedWarmup !== null &&
    warmupMinutes >= bookingMinutes
  ) {
    errors.warmupMinutes = "Warmup must be shorter than the booking.";
  }
  if (timingMode === "timed" && parsedTransition === null) {
    errors.transitionSeconds = "Use a whole number from 0 to 600.";
  }
  if (targetScore === null) {
    errors.targetScore = "Use a whole number from 1 to 99.";
  }
  if (
    timingMode === "timed" &&
    parsedBooking !== null &&
    parsedWarmup !== null &&
    parsedTransition !== null &&
    players.length >= 4 &&
    players.length <= 16
  ) {
    try {
      calculateMatchCap({
        entrantCount: players.length,
        bookingMinutes,
        warmupMinutes,
        transitionSeconds,
      });
    } catch (error) {
      errors.form =
        error instanceof Error ? error.message : "This schedule cannot fit.";
    }
  }

  const hasErrors =
    Boolean(errors.form) ||
    Object.keys(errors.names).length > 0 ||
    Object.keys(errors.ratings).length > 0 ||
    Boolean(
      errors.bookingMinutes ||
      errors.warmupMinutes ||
      errors.transitionSeconds ||
      errors.targetScore,
    );

  if (hasErrors || targetScore === null) {
    return { errors };
  }

  return {
    errors,
    values: {
      players: players.map((player) => ({
        name: player.name.trim(),
        rating: player.rating || "2.5",
      })),
      timingMode,
      bookingMinutes,
      warmupMinutes,
      transitionSeconds,
      targetScore,
    },
  };
}
