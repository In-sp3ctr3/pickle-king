import type {
  MatchTeam,
  ServiceSide,
  ServiceState,
  ServiceTurn,
} from "./types";

type Sides = { sideA: { memberIds: string[] }; sideB: { memberIds: string[] } };

function other(team: MatchTeam): MatchTeam {
  return team === "A" ? "B" : "A";
}

function members(sides: Sides, team: MatchTeam): string[] {
  return team === "A" ? sides.sideA.memberIds : sides.sideB.memberIds;
}

export function isDoubles(sides: Sides, team: MatchTeam): boolean {
  return members(sides, team).length === 2;
}

export function serviceSide(score: number): ServiceSide {
  return score % 2 === 0 ? "right" : "left";
}

export function activeServer(input: {
  scores: Record<MatchTeam, number>;
  service: ServiceState;
  sides: Sides;
}): {
  playerId: string;
  side: ServiceSide;
  team: MatchTeam;
  turn: ServiceTurn;
} {
  const { service, scores } = input;
  const team = service.servingTeam;
  const rightAtZero = service.rightAtZero[team];
  const anchorSide = serviceSide(scores[team]);
  const playerId = service.serverId;
  return {
    playerId,
    side:
      playerId === rightAtZero
        ? anchorSide
        : anchorSide === "right"
          ? "left"
          : "right",
    team,
    turn: service.turn,
  };
}

export function activeReceiver(input: {
  scores: Record<MatchTeam, number>;
  service: ServiceState;
  sides: Sides;
}): { playerId: string; side: ServiceSide; team: MatchTeam } | null {
  const server = activeServer(input);
  const team = other(server.team);
  if (!isDoubles(input.sides, team)) return null;
  const right = playerOnRight(
    input.sides,
    team,
    input.scores[team],
    input.service,
  );
  return {
    playerId:
      server.side === "right"
        ? right
        : (members(input.sides, team).find((id) => id !== right) ?? right),
    side: server.side,
    team,
  };
}

export function playerOnRight(
  sides: Sides,
  team: MatchTeam,
  score: number,
  service: ServiceState,
): string {
  const anchor = service.rightAtZero[team];
  if (serviceSide(score) === "right") return anchor;
  return members(sides, team).find((id) => id !== anchor) ?? anchor;
}

export function nextService(input: {
  scores: Record<MatchTeam, number>;
  service: ServiceState;
  sides: Sides;
  winner: MatchTeam;
}): { scores: Record<MatchTeam, number>; service: ServiceState } {
  const { scores, service, sides, winner } = input;
  if (winner === service.servingTeam) {
    return {
      scores: { ...scores, [winner]: scores[winner] + 1 },
      service,
    };
  }
  if (service.turn === "first" && isDoubles(sides, service.servingTeam)) {
    return {
      scores,
      service: {
        ...service,
        serverId:
          members(sides, service.servingTeam).find(
            (id) => id !== service.serverId,
          ) ?? service.serverId,
        turn: "second",
      },
    };
  }
  const servingTeam = other(service.servingTeam);
  return {
    scores,
    service: {
      ...service,
      servingTeam,
      serverId: playerOnRight(sides, servingTeam, scores[servingTeam], service),
      turn: "first",
    },
  };
}

export function repairedService(
  input: {
    scores: Record<MatchTeam, number>;
    service: ServiceState;
    sides: Sides;
  },
  turn: "second" | "side-out",
): ServiceState {
  const { scores, service, sides } = input;
  if (turn === "second") {
    return {
      ...service,
      serverId:
        members(sides, service.servingTeam).find(
          (id) => id !== service.serverId,
        ) ?? service.serverId,
      turn: "second",
    };
  }
  const servingTeam = other(service.servingTeam);
  return {
    ...service,
    servingTeam,
    serverId: playerOnRight(sides, servingTeam, scores[servingTeam], service),
    turn: "first",
  };
}
