import { convexTest } from "convex-test";
import schema from "./schema";

// The dotted test filename keeps this helper out of Convex's deployable modules.
const modules = import.meta.glob("./**/*.{js,ts}");

export const scoring = {
  gamesToWin: 1 as const,
  pointsPerGame: 11 as const,
  winBy: 2 as const,
  scoringSystem: "side-out" as const,
  timeCapMs: null,
};

export const createBackend = () => convexTest({ schema, modules });

export async function seedDomain(backend: ReturnType<typeof createBackend>) {
  return backend.run(async ({ db }) => {
    const users = await db.insert("users", {
      clerkId: "clerk-user",
      email: "player@example.test",
      displayName: "Ada",
      createdAt: 1,
      consentAt: 1,
      ageGateOk: true,
      leaderboardOptIn: false,
      skillSelf: "3.5",
    });
    const orgs = await db.insert("orgs", {
      kind: "club",
      name: "Kingston Club",
      ownerUserId: users,
    });
    const orgMembers = await db.insert("orgMembers", {
      orgId: orgs,
      userId: users,
      role: "owner",
      since: 1,
    });
    const players = await db.insert("players", {
      orgId: orgs,
      userId: users,
      displayName: "Ada",
      gender: "female",
      ageBracket: "35+",
    });
    const events = await db.insert("events", {
      orgId: orgs,
      createdByUserId: users,
      name: "Open",
      startsAt: 10,
      courtCount: 2,
      joinCodeDigest: "event-digest",
      joinCodeExpiresAt: 100,
      visibility: "code",
      status: "open",
    });
    const divisions = await db.insert("divisions", {
      eventId: events,
      name: "3.5 Singles",
      discipline: "singles",
      format: "round-robin",
      scoring,
      eligibility: {
        maxRating: 4,
        ratingSource: "pickle-king",
        allowProvisional: true,
      },
      teamCap: 64,
      minRestMs: 600_000,
      status: "registration",
    });
    const teams = await db.insert("teams", {
      divisionId: divisions,
      playerIds: [players],
      checkedIn: true,
      registeredByUserId: users,
    });
    const pools = await db.insert("pools", {
      divisionId: divisions,
      name: "A",
      teamIds: [teams],
    });
    const lobbies = await db.insert("lobbies", {
      orgId: orgs,
      hostUserId: users,
      name: "Friday",
      joinCodeDigest: "lobby-digest",
      discipline: "singles",
      scoring,
      status: "open",
    });
    const matches = await db.insert("matches", {
      divisionId: divisions,
      poolId: pools,
      lobbyId: lobbies,
      kind: "round-robin",
      round: 1,
      ordinal: 1,
      sourceA: { type: "team", teamId: teams },
      sourceB: { type: "standing", rank: 2 },
      teamAId: teams,
      status: "complete",
      scoring,
      games: [{ a: 11, b: 7 }],
      winnerTeamId: teams,
      outcome: "played",
      result: "final",
      signatures: [{ side: "A", userId: users, kind: "tap", at: 20 }],
      corrections: [],
      scorerClaim: { userId: users, claimedAt: 11, expiresAt: 21, revision: 1 },
      submittedByUserId: users,
      finalAt: 20,
      weight: "tournament",
    });
    const ratings = await db.insert("ratings", {
      subjectId: users,
      discipline: "singles",
      rating: 3.5,
      deviation: 0.5,
      volatility: 0.06,
      ratedMatches: 1,
      updatedAt: 20,
    });
    const ratingEvents = await db.insert("ratingEvents", {
      playerId: players,
      matchId: matches,
      discipline: "singles",
      before: { rating: 3.5, deviation: 0.5, volatility: 0.06 },
      after: { rating: 3.6, deviation: 0.45, volatility: 0.06 },
      weight: "tournament",
      at: 20,
    });
    const rallyLogs = await db.insert("rallyLogs", {
      matchId: matches,
      chunk: 0,
      snapshots: [
        {
          scoreA: 1,
          scoreB: 0,
          service: {
            startingTeam: "A",
            servingTeam: "A",
            serverId: "ada",
            turn: "opening",
            rightAtZero: { A: "ada", B: "grace" },
          },
          scoredTeam: "A",
        },
      ],
    });
    const liveScores = await db.insert("liveScores", {
      matchId: matches,
      a: 11,
      b: 7,
      updatedAt: 20,
    });
    const eventRoles = await db.insert("eventRoles", {
      eventId: events,
      userId: users,
      role: "director",
    });
    const invites = await db.insert("invites", {
      kind: "claim",
      tokenDigest: "invite-digest",
      issuedByUserId: users,
      targetPlayerId: players,
      expiresAt: 100,
    });
    const duprOutbox = await db.insert("duprOutbox", {
      matchId: matches,
      idempotencyKey: `${matches}:20`,
      status: "queued",
      attempts: 0,
      notBefore: 30,
      purgeAfter: 120,
    });
    const auditLog = await db.insert("auditLog", {
      actorUserId: users,
      action: "match.finalized",
      targetTable: "matches",
      targetId: matches,
      diff: { result: "final" },
      at: 20,
    });
    return {
      users,
      orgs,
      orgMembers,
      players,
      ratings,
      ratingEvents,
      events,
      divisions,
      teams,
      pools,
      matches,
      rallyLogs,
      liveScores,
      eventRoles,
      lobbies,
      invites,
      duprOutbox,
      auditLog,
    };
  });
}

export function matchRow(
  divisionId: Awaited<ReturnType<typeof seedDomain>>["divisions"],
  ordinal: number,
) {
  return {
    divisionId,
    kind: "winners" as const,
    round: 1,
    ordinal,
    sourceA: { type: "standing" as const, rank: 1 },
    sourceB: { type: "standing" as const, rank: 2 },
    status: "pending" as const,
    scoring,
    games: [],
    signatures: [],
    corrections: [],
    weight: "tournament" as const,
  };
}
