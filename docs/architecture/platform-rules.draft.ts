// Rulebook and trust logic for the platform revamp, spelled out once so it
// can be reviewed against USA Pickleball Official Rulebook 2025 §12 and the
// decisions in PLAN.md. Design artifact.
import type {
  AgeBracket,
  Division,
  Eligibility,
  Gender,
  Match,
  MatchWeight,
  Signature,
  SignatureKind,
  UserId,
} from "./platform-domain.draft";

const AGE_ORDER: AgeBracket[] = ["19+", "35+", "50+", "60+", "65+", "70+"];

// §12.L.1: skill level of a team is its higher-rated partner.
export function teamRating(ratings: number[]): number {
  return Math.max(...ratings);
}

// §12.L.1: age classification of a team is its lower-aged partner.
export function teamAgeBracket(brackets: AgeBracket[]): AgeBracket {
  return brackets.reduce((lo, b) =>
    AGE_ORDER.indexOf(b) < AGE_ORDER.indexOf(lo) ? b : lo,
  );
}

// Glicko-2 φ above which a rating is shown as provisional (product decision).
export const PROVISIONAL_DEVIATION = 0.25;

export interface EligibilityInput {
  ratings: number[];
  deviations: number[]; // same order as ratings (T21)
  genders: (Gender | undefined)[];
  ageBrackets: (AgeBracket | undefined)[];
}

// Returns human-readable violations. Empty array = eligible. TD may override.
export function checkEligibility(
  e: Eligibility,
  t: EligibilityInput,
): string[] {
  const out: string[] = [];
  if (e.maxCombinedRating !== undefined) {
    const sum = t.ratings.reduce((a, b) => a + b, 0);
    if (sum > e.maxCombinedRating)
      out.push(`combined rating ${sum} exceeds ${e.maxCombinedRating}`);
  } else {
    const r = teamRating(t.ratings);
    if (e.minRating !== undefined && r < e.minRating)
      out.push(`team rating ${r} below ${e.minRating}`);
    if (e.maxRating !== undefined && r >= e.maxRating)
      out.push(`team rating ${r} at or above ${e.maxRating}`);
  }
  if (
    e.ratingSource === "pickle-king" &&
    t.deviations.some((d) => d > PROVISIONAL_DEVIATION)
  ) {
    out.push(
      e.allowProvisional
        ? "warning: a player's rating is provisional"
        : "provisional ratings not allowed in this division",
    );
  }
  if (e.gender && e.gender !== "open") {
    if (t.genders.some((g) => g === undefined))
      out.push("gender required for this division");
    else if (e.gender === "mixed") {
      if (new Set(t.genders).size !== 2)
        out.push("mixed doubles needs one male and one female (12.A.2)");
    } else if (
      t.genders.some((g) => g !== (e.gender === "men" ? "male" : "female"))
    ) {
      out.push(`all players must be ${e.gender === "men" ? "male" : "female"}`);
    }
  }
  if (e.minAge) {
    if (t.ageBrackets.some((a) => a === undefined))
      out.push("age bracket required for this division");
    else {
      const team = teamAgeBracket(t.ageBrackets as AgeBracket[]);
      if (AGE_ORDER.indexOf(team) < AGE_ORDER.indexOf(e.minAge))
        out.push(`team age ${team} below ${e.minAge}`);
    }
  }
  return out;
}

// §12.B.1: rally scoring is not permitted for doubles double-elimination.
export function scoringAllowed(
  d: Pick<Division, "discipline" | "format" | "scoring">,
): boolean {
  return !(
    d.scoring.scoringSystem === "rally" &&
    d.discipline === "doubles" &&
    d.format === "double-elimination"
  );
}

// §12.C.4 tiebreak order, as a sortable tuple (higher is better everywhere).
export interface StandingKey {
  matchWins: number;
  headToHeadWins: number; // 12.C.4.b, among tied teams only
  pointDiff: number; // 12.C.4.c
  headToHeadPointDiff: number; // 12.C.4.d
  diffVsNextHighest: number; // 12.C.4.e
}

export function compareStandings(a: StandingKey, b: StandingKey): number {
  return (
    b.matchWins - a.matchWins ||
    b.headToHeadWins - a.headToHeadWins ||
    b.pointDiff - a.pointDiff ||
    b.headToHeadPointDiff - a.headToHeadPointDiff ||
    b.diffVsNextHighest - a.diffVsNextHighest
  );
}

// §12.C.3 via the gold-match slot convention (T16): side B is always the
// consolation champion, so a B win spawns the game to 15.
export function needsGoldTiebreaker(
  gold: Pick<Match, "kind" | "winnerTeamId" | "teamBId">,
): boolean {
  return (
    gold.kind === "gold" &&
    !!gold.winnerTeamId &&
    gold.winnerTeamId === gold.teamBId
  );
}

// D5: contribution multiplier inside the Glicko-2 rating period.
export const RATING_WEIGHT: Record<MatchWeight, number> = {
  tournament: 1,
  league: 0.75,
  casual: 0.5,
  conflicted: 0.25,
};

// D5: composite opponent for doubles. μ = mean, φ = root-mean-square so a
// provisional partner widens uncertainty instead of being ignored (T14).
export function compositeOpponent(
  pair: { rating: number; deviation: number }[],
): { rating: number; deviation: number } {
  const n = pair.length;
  return {
    rating: pair.reduce((s, p) => s + p.rating, 0) / n,
    deviation: Math.sqrt(pair.reduce((s, p) => s + p.deviation ** 2, 0) / n),
  };
}

// ------------------------------------------------------------ trust (D7)

export interface SignerContext {
  userId: UserId;
  isStaff: boolean; // non-member spectators are never staff
  participantOfSide?: "A" | "B"; // set when the signer plays in this match
  isPersonalOrgLobby: boolean;
  sideUnsignedForMs: number;
}

export const STAFF_OVERRIDE_AFTER_MS = 24 * 60 * 60 * 1000;

// Which signature, if any, this user may add for `side`. undefined = none.
export function allowedSignature(
  side: "A" | "B",
  c: SignerContext,
): SignatureKind | undefined {
  if (c.participantOfSide === side) return "tap";
  if (c.participantOfSide !== undefined) {
    // Conflict of interest (T5): a participant never signs for opponents,
    // except a lobby host, and then only as a flagged conflicted signature.
    return c.isStaff && c.isPersonalOrgLobby ? "conflicted" : undefined;
  }
  if (c.isStaff && c.sideUnsignedForMs >= STAFF_OVERRIDE_AFTER_MS)
    return "staff-override";
  return undefined;
}

// A result is final once each side carries at least one signature (D7 §3).
export function isFullySigned(signatures: Signature[]): boolean {
  const sides = new Set(signatures.map((s) => s.side));
  return sides.has("A") && sides.has("B");
}

// Conflicted signatures cap the match at the lowest weight and bar DUPR.
export function effectiveWeight(
  declared: MatchWeight,
  signatures: Signature[],
): MatchWeight {
  return signatures.some((s) => s.kind === "conflicted")
    ? "conflicted"
    : declared;
}

export function duprEligible(
  m: Pick<Match, "result" | "outcome" | "signatures">,
  allPlayersHaveDuprId: boolean,
): boolean {
  return (
    m.result === "final" &&
    m.outcome === "played" &&
    allPlayersHaveDuprId &&
    !m.signatures.some((s) => s.kind === "conflicted")
  );
}

// D7 Rule 2: claim only on a ready match with no live claim; staff manual
// entry always wins (T1–T3).
export const SCORING_CLAIM_STATUS_POLICY = {
  pending: false,
  ready: true,
  live: false,
  complete: false,
  void: false,
} as const satisfies Record<Match["status"], boolean>;

export function canClaimScoring(
  m: Pick<Match, "status" | "scorerClaim">,
  now: number,
  actor: { userId: UserId; isStaff: boolean; isParticipant: boolean },
): boolean {
  if (!SCORING_CLAIM_STATUS_POLICY[m.status]) return false;
  if (!actor.isStaff && !actor.isParticipant) return false;
  const live =
    m.scorerClaim !== undefined &&
    m.scorerClaim.expiresAt > now &&
    m.scorerClaim.userId !== actor.userId;
  return !live || actor.isStaff;
}

// Executable design-artifact checks. Run this file directly with Node's type
// stripping to keep the ready-only claim boundary from drifting before the
// implementation tickets add production tests.
function assertDesignInvariant(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Design invariant failed: ${message}`);
}

const selfCheckNow = 1_000;
const selfCheckActor = "claim-self-check" as UserId;
const selfCheckOther = "claim-other-self-check" as UserId;
const participant = {
  userId: selfCheckActor,
  isStaff: false,
  isParticipant: true,
};

assertDesignInvariant(
  canClaimScoring({ status: "ready" }, selfCheckNow, participant),
  "an eligible participant may claim an unclaimed ready match",
);

for (const status of ["pending", "live", "complete", "void"] as const) {
  assertDesignInvariant(
    !canClaimScoring(
      {
        status,
        scorerClaim: {
          userId: selfCheckActor,
          claimedAt: 0,
          expiresAt: selfCheckNow - 1,
          revision: 1,
        },
      },
      selfCheckNow,
      { ...participant, isStaff: true },
    ),
    `${status} matches cannot be claimed, even by staff or the prior claimant`,
  );
}

assertDesignInvariant(
  !canClaimScoring({ status: "ready" }, selfCheckNow, {
    userId: selfCheckActor,
    isStaff: false,
    isParticipant: false,
  }),
  "a spectator cannot claim a ready match",
);
assertDesignInvariant(
  !canClaimScoring(
    {
      status: "ready",
      scorerClaim: {
        userId: selfCheckOther,
        claimedAt: 0,
        expiresAt: selfCheckNow + 1,
        revision: 1,
      },
    },
    selfCheckNow,
    participant,
  ),
  "a participant cannot take over another active claim",
);
assertDesignInvariant(
  canClaimScoring(
    {
      status: "ready",
      scorerClaim: {
        userId: selfCheckOther,
        claimedAt: 0,
        expiresAt: selfCheckNow + 1,
        revision: 1,
      },
    },
    selfCheckNow,
    { ...participant, isStaff: true },
  ),
  "staff may take over another active claim on a ready match",
);
assertDesignInvariant(
  canClaimScoring(
    {
      status: "ready",
      scorerClaim: {
        userId: selfCheckOther,
        claimedAt: 0,
        expiresAt: selfCheckNow - 1,
        revision: 1,
      },
    },
    selfCheckNow,
    participant,
  ),
  "an eligible participant may claim after another claim expires",
);
