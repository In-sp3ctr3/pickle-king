export interface CapCalculation {
  totalMatches: number;
  transitionCount: number;
  playableMs: number;
  capMs: number;
}

export function calculateMatchCap(input: {
  entrantCount: number;
  bookingMinutes: number;
  warmupMinutes: number;
  transitionSeconds: number;
}): CapCalculation {
  if (
    !Number.isFinite(input.bookingMinutes) ||
    !Number.isFinite(input.warmupMinutes) ||
    !Number.isFinite(input.transitionSeconds) ||
    input.bookingMinutes <= 0 ||
    input.warmupMinutes < 0 ||
    input.warmupMinutes >= input.bookingMinutes ||
    input.transitionSeconds < 0
  ) {
    throw new Error("Booking, warm-up, and transition values are invalid.");
  }
  if (input.entrantCount < 4 || input.entrantCount > 16) {
    throw new Error("Tournament entrants must be between 4 and 16.");
  }
  const bookingMs = input.bookingMinutes * 60_000;
  const warmupMs = input.warmupMinutes * 60_000;
  const totalMatches = input.entrantCount;
  const transitionCount = totalMatches - 1;
  const transitionMs = transitionCount * input.transitionSeconds * 1_000;
  const playableMs = bookingMs - warmupMs - transitionMs;
  const capMs = Math.floor(playableMs / totalMatches);
  if (!Number.isFinite(capMs) || capMs < 1_000) {
    throw new Error(
      "The booking is too short. Increase it or reduce warm-up, transitions, or entrants.",
    );
  }
  return { totalMatches, transitionCount, playableMs, capMs };
}

export function rebalanceRemainingCap(input: {
  now: number;
  sessionDeadline: number;
  remainingMatches: number;
  transitionSeconds: number;
  currentCapMs: number;
}): { capMs: number; reduced: boolean } {
  if (input.remainingMatches < 1) {
    return { capMs: input.currentCapMs, reduced: false };
  }
  const transitions = Math.max(0, input.remainingMatches - 1);
  const remainingMs =
    input.sessionDeadline -
    input.now -
    transitions * input.transitionSeconds * 1_000;
  const neededCap = Math.floor(remainingMs / input.remainingMatches);
  if (neededCap >= input.currentCapMs) {
    return { capMs: input.currentCapMs, reduced: false };
  }
  if (neededCap < 1_000) {
    throw new Error("The remaining schedule cannot fit the booking.");
  }
  return { capMs: neededCap, reduced: true };
}
