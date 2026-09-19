/**
 * Draft domain model for the platform revamp (see PLAN.md, sections 2–3, 7).
 * Design artifact only: nothing imports this. It exists so the schema in the
 * brief is typechecked and every reviewed decision has a typed home.
 * Rule references are USA Pickleball Official Rulebook 2025, Section 12.
 */

import type { SkillLevel } from "../../src/tournament/types";
import type { RallySnapshot } from "../../src/match/types";

type Id<T extends string> = string & { readonly __brand: T };
export type UserId = Id<"user">;
export type OrgId = Id<"org">;
export type PlayerId = Id<"player">;
export type EventId = Id<"event">;
export type DivisionId = Id<"division">;
export type PoolId = Id<"pool">;
export type TeamId = Id<"team">;
export type MatchId = Id<"match">;
export type LobbyId = Id<"lobby">;

// ---------------------------------------------------------------- identity

// Never hard-deleted: deletion scrubs email/name and sets deletedAt (D11, I8).
export interface User {
  id: UserId;
  clerkId: string;
  email: string;
  createdAt: number;
  consentAt: number; // ToS + privacy accepted (D11)
  ageGateOk: true; // 13+ attested at sign-up; under-13 never creates a row
  leaderboardOptIn: boolean;
  skillSelf: SkillLevel; // subject-level self assessment (D5, I6)
  skillLockedAt?: number; // frozen after first rated match, across all linked rows
  deletedAt?: number;
}

export type OrgKind = "personal" | "club";
// "player" is NOT an org role; non-members join one event via EventRole (I11).
export type OrgRole = "owner" | "admin" | "director" | "scorer" | "member";

export interface Org {
  id: OrgId;
  kind: OrgKind; // personal org auto-created per user (D9)
  name: string;
  ownerUserId: UserId; // transfer required before owner leaves (I9)
  duprClubId?: string; // only clubs; makes submissions club-verified (D6)
  archivedAt?: number; // club with no admin left, or owner deleted
}

export interface OrgMember {
  orgId: OrgId;
  userId: UserId;
  role: OrgRole;
  since: number; // longest-tenured admin is promoted on owner loss (I9)
}

export type Gender = "male" | "female";
// §12.A.3 convention; no birth date stored (D11). "junior" absent until a
// parent-consent flow exists (I11).
export type AgeBracket = "19+" | "35+" | "50+" | "60+" | "65+" | "70+";

// One person's appearance in one org. Ghost until userId is set (D3).
export interface Player {
  id: PlayerId;
  orgId: OrgId; // creating org; ghosts never globally searchable or on outside leaderboards (I7)
  userId?: UserId; // claim = set; unclaim = unset; never a merge
  displayName: string; // "Deleted player" after account deletion (I8)
  handle?: string;
  avatarUrl?: string;
  gender?: Gender; // asked only when a gendered division needs it
  ageBracket?: AgeBracket; // asked only when an age division needs it
  skillSelf?: SkillLevel; // ghost-only; a linked row reads User.skillSelf (I6)
  duprId?: string;
  claimEmail?: string; // optional: contact match skips organizer confirm (D3 §2)
  claimPhone?: string;
  claimedAt?: number;
  unclaimNoticeUntil?: number; // 7-day notice window; no new claim may attach (D3 §2b)
  lastMatchAt?: number; // zero-match ghosts purge after 90 days
}

export type Discipline = "singles" | "doubles";
// Resolved at read time: userId when the row is linked, else playerId (T15).
export type SubjectId = UserId | PlayerId;

export interface Rating {
  subjectId: SubjectId;
  discipline: Discipline;
  rating: number; // Glicko-2 μ, displayed on the 2.0–8.0 scale
  deviation: number; // Glicko-2 φ; drives the "provisional" indicator
  volatility: number;
  ratedMatches: number;
  updatedAt: number;
}

// Multiplier on the match's contribution inside the rating period (D5).
export type MatchWeight = "tournament" | "league" | "casual" | "conflicted";

// Append-only. Stores the appearance row that played, never a subject (T15).
export interface RatingEvent {
  playerId: PlayerId;
  matchId: MatchId;
  discipline: Discipline;
  before: Pick<Rating, "rating" | "deviation" | "volatility">;
  after: Pick<Rating, "rating" | "deviation" | "volatility">;
  weight: MatchWeight;
  at: number; // = Match.finalAt; recompute replays in this order
}

// -------------------------------------------------------------- tournament

// §12.C formats. Social formats are product decisions, not rulebook.
export type DivisionFormat =
  | "single-elimination" // 12.C.2
  | "single-elimination-consolation" // 12.C.1
  | "double-elimination" // 12.C.3
  | "round-robin" // 12.C.4
  | "pool-play-bracket" // 12.C.5
  | "round-robin-bracket" // 12.C.6
  | "king-of-the-court"
  | "ladder"
  | "rotating-partner-round-robin";

// §12.B scoring options. All win by `winBy` (rulebook: 2).
export interface ScoringOption {
  gamesToWin: 1 | 2 | 3; // 1 game, best of 3, best of 5
  pointsPerGame: 7 | 11 | 15 | 21; // 7 only as the 12.B.1.a weather fallback
  winBy: 1 | 2;
  scoringSystem: "side-out" | "rally"; // rally not allowed for doubles double-elim
  timeCapMs: number | null;
}

export type DivisionGender = "men" | "women" | "mixed" | "open";
export type RatingSource = "self" | "pickle-king" | "dupr";

// Conventions, not rulebook text (D8). Evaluated by `checkEligibility`.
export interface Eligibility {
  gender?: DivisionGender;
  minAge?: AgeBracket;
  minRating?: number;
  maxRating?: number; // e.g. 3.5 division = [3.5, 4.0)
  maxCombinedRating?: number; // e.g. "under 7.0" doubles
  ratingSource: RatingSource;
  allowProvisional: boolean; // default true; provisional players get a warning (T21)
}

export interface PoolPlayConfig {
  poolSize: number; // product default 4; actual sizes differ by ≤ 1 (T18)
  advancePerPool: number; // product default 2
  playoff: "single-elimination" | "double-elimination";
}

// scoring and eligibility lock when status leaves "registration" (T11).
export interface Division {
  id: DivisionId;
  eventId: EventId;
  name: string;
  discipline: Discipline;
  format: DivisionFormat;
  scoring: ScoringOption;
  eligibility: Eligibility;
  poolPlay?: PoolPlayConfig; // required when format is pool-play-bracket
  teamCap: number; // ≤ 64; capacity vs courts is a warning at lock (T20)
  minRestMs: number; // product default 10 min
  status: "registration" | "locked" | "in-progress" | "complete";
}

export type EventVisibility = "private" | "code" | "public";

export interface Event {
  id: EventId;
  orgId: OrgId; // every event belongs to exactly one org (D9)
  createdByUserId: UserId;
  name: string;
  venue?: string;
  startsAt: number;
  endsAt?: number;
  courtCount: number;
  joinCode: string; // ≥ 8 chars, 32-symbol alphabet, rotatable
  joinCodeExpiresAt: number;
  visibility: EventVisibility;
  status: "draft" | "open" | "live" | "complete" | "cancelled";
}

// Per-event override or join-by-code. Distinct from OrgRole (I11).
export interface EventRole {
  eventId: EventId;
  userId: UserId;
  role: "director" | "scorer" | "player";
}

// Server invariant: each player is a claimed account or a ghost of the
// event's own org (I5).
export interface Team {
  id: TeamId;
  divisionId: DivisionId;
  playerIds: [PlayerId] | [PlayerId, PlayerId];
  seed?: number;
  checkedIn: boolean;
  registeredByUserId: UserId;
  eligibilityOverrideBy?: UserId; // TD allowed a play-up; audit row exists
}

export interface Pool {
  id: PoolId;
  divisionId: DivisionId;
  name: string;
  teamIds: TeamId[];
}

export type MatchKind =
  | "winners"
  | "consolation"
  | "bronze"
  | "gold" // side A = winners champion, side B = consolation champion (T16)
  | "gold-tiebreaker" // 12.C.3: spawned iff gold.winnerTeamId === gold.teamBId
  | "pool"
  | "round-robin"
  | "challenge"
  | "lobby";

export type MatchSource =
  | { type: "team"; teamId: TeamId }
  | { type: "winner" | "loser"; matchId: MatchId }
  | { type: "pool-standing"; poolId: PoolId; rank: number }
  | { type: "standing"; rank: number };

// D7 Rule 3: every result is co-signed. recorded → signed → final; disputed halts.
export type ResultState = "recorded" | "signed" | "final" | "disputed";

export type SignatureKind =
  | "submit" // recorder's own side, automatic; desk staff gets none (T7)
  | "tap" // a linked player on that side
  | "staff-override" // non-participant staff after the 24h timeout (T8)
  | "conflicted"; // lobby host signing a side they played against (T5)

export interface Signature {
  side: "A" | "B";
  userId: UserId;
  kind: SignatureKind;
  at: number;
}

export interface Game {
  a: number;
  b: number;
}

// §12.F–12.I. Numeric games + outcome; display strings derived (T19).
// Forfeits count for standings, contribute 0 to rating.
export type Outcome = "played" | "forfeit" | "retired" | "withdrawn";

export interface Correction {
  byUserId: UserId; // staff only; reason required; re-signing required
  reason: string;
  at: number;
  previous: { games: Game[]; winnerTeamId?: TeamId; outcome?: Outcome };
}

export interface Resolution {
  byUserId: UserId; // never a participant of the match (T5)
  reason: string;
  at: number;
}

export interface Match {
  id: MatchId;
  divisionId?: DivisionId;
  poolId?: PoolId;
  lobbyId?: LobbyId;
  kind: MatchKind;
  round: number;
  ordinal: number;
  sourceA: MatchSource;
  sourceB: MatchSource;
  teamAId?: TeamId; // resolved lazily from sources, as today
  teamBId?: TeamId;
  court?: number;
  scheduledAt?: number;
  status: "pending" | "ready" | "live" | "complete" | "void";
  scoring: ScoringOption; // snapshot at creation (T11)
  games: Game[];
  winnerTeamId?: TeamId;
  outcome?: Outcome;
  result?: ResultState;
  signatures: Signature[];
  corrections: Correction[];
  resolution?: Resolution;
  // One live-scoring claim; only on status "ready"; 3h TTL; staff manual
  // entry always takes it over (T1–T3).
  scorerUserId?: UserId;
  scorerClaimedAt?: number;
  scorerClaimExpiresAt?: number;
  submittedByUserId?: UserId;
  finalAt?: number; // rating replay order and DUPR idempotency key
  weight: MatchWeight;
}

// Heavy rally snapshots live apart from the match document (T26).
export interface RallyLog {
  matchId: MatchId;
  chunk: number;
  snapshots: RallySnapshot[];
}

// Tiny document spectators subscribe to; one write per rally (T27).
export interface LiveScore {
  matchId: MatchId;
  a: number;
  b: number;
  updatedAt: number;
}

export interface Lobby {
  id: LobbyId;
  orgId: OrgId; // host's personal org
  hostUserId: UserId;
  name: string;
  joinCode: string;
  discipline: Discipline;
  scoring: ScoringOption;
  status: "open" | "closed";
}

// ------------------------------------------------------------- side tables

// Role is fixed by the issuer at creation; "owner" is never grantable (I4).
export interface Invite {
  kind: "claim" | "team" | "scorer" | "org";
  role?: Exclude<OrgRole, "owner"> | EventRole["role"];
  token: string; // single use, 7 days
  targetId: string;
  expiresAt: number;
  claimantUserId?: UserId; // claim: who opened the link (I1)
  confirmedAt?: number; // claim: organizer confirmed or contact matched (I1)
  usedAt?: number;
}

// Local outbox item states; drain re-checks match state (T4, T10).
export type OutboxState =
  "queued" | "sending" | "sent" | "superseded" | "failed";

export interface DuprOutboxItem {
  matchId: MatchId;
  idempotencyKey: string; // `${matchId}:${finalAt}` (T25)
  status: "queued" | "sent" | "failed" | "ineligible" | "correction-needed";
  attempts: number;
  notBefore: number; // finalAt + correction window (24h)
  lastError?: string;
  purgeAfter: number; // ineligible items purge after 90 days (T24)
}

export interface AuditEntry {
  actorUserId: UserId;
  action: string;
  targetTable: string;
  targetId: string;
  diff: unknown;
  at: number;
}

// Convex crons (T28). Named here so none is forgotten.
export type ScheduledJob =
  | "dupr-outbox-drain"
  | "ghost-purge-90d"
  | "scoring-claim-expiry-3h"
  | "unsigned-result-nudge-24h"
  | "dupr-outbox-purge-90d";
