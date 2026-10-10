import type { DataModelFromSchemaDefinition } from "convex/server";
import type { GenericId } from "convex/values";
import { v } from "convex/values";
import type {
  AuditEntry,
  Division,
  DivisionId,
  DuprOutboxItem,
  Event,
  EventId,
  EventRole,
  Invite,
  LiveScore,
  Lobby,
  LobbyId,
  Match,
  MatchId,
  Org,
  OrgId,
  OrgMember,
  Player,
  PlayerId,
  Pool,
  PoolId,
  Rating,
  RatingEvent,
  RallyLog,
  Team,
  TeamId,
  User,
  UserId,
} from "../docs/architecture/platform-domain.draft";
import schema from "./schema";

type Model = DataModelFromSchemaDefinition<typeof schema>;
type TableName = keyof Model;
type StripSystem<T> = T extends unknown
  ? Omit<T, "_id" | "_creationTime">
  : never;
type Fields<T extends TableName> = StripSystem<Model[T]["document"]>;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

// Convex owns document IDs. Tuple arrays map to arrays because Convex 1.46 has
// no tuple validator; future team mutations enforce one-or-two cardinality.
type Persisted<T> = T extends UserId
  ? GenericId<"users">
  : T extends OrgId
    ? GenericId<"orgs">
    : T extends PlayerId
      ? GenericId<"players">
      : T extends EventId
        ? GenericId<"events">
        : T extends DivisionId
          ? GenericId<"divisions">
          : T extends TeamId
            ? GenericId<"teams">
            : T extends PoolId
              ? GenericId<"pools">
              : T extends MatchId
                ? GenericId<"matches">
                : T extends LobbyId
                  ? GenericId<"lobbies">
                  : T extends readonly (infer Item)[]
                    ? Persisted<Item>[]
                    : T extends object
                      ? { [Key in keyof T]: Persisted<T[Key]> }
                      : T;
type Entity<T extends { id: unknown }> = Persisted<Omit<T, "id">>;
type PersistedAudit = Omit<Persisted<AuditEntry>, "diff"> & {
  diff: ReturnType<typeof v.any>["type"];
};

export type SchemaConformance = [
  Assert<
    Equal<
      TableName,
      | "users"
      | "orgs"
      | "orgMembers"
      | "players"
      | "ratings"
      | "ratingEvents"
      | "events"
      | "divisions"
      | "teams"
      | "pools"
      | "matches"
      | "rallyLogs"
      | "liveScores"
      | "eventRoles"
      | "lobbies"
      | "invites"
      | "duprOutbox"
      | "auditLog"
    >
  >,
  Assert<Equal<Fields<"users">, Entity<User>>>,
  Assert<Equal<Fields<"orgs">, Entity<Org>>>,
  Assert<Equal<Fields<"orgMembers">, Persisted<OrgMember>>>,
  Assert<Equal<Fields<"players">, Entity<Player>>>,
  Assert<Equal<Fields<"ratings">, Persisted<Rating>>>,
  Assert<Equal<Fields<"ratingEvents">, Persisted<RatingEvent>>>,
  Assert<Equal<Fields<"events">, Entity<Event>>>,
  Assert<Equal<Fields<"divisions">, Entity<Division>>>,
  Assert<Equal<Fields<"teams">, Entity<Team>>>,
  Assert<Equal<Fields<"pools">, Entity<Pool>>>,
  Assert<Equal<Fields<"matches">, Entity<Match>>>,
  Assert<Equal<Fields<"rallyLogs">, Persisted<RallyLog>>>,
  Assert<Equal<Fields<"liveScores">, Persisted<LiveScore>>>,
  Assert<Equal<Fields<"eventRoles">, Persisted<EventRole>>>,
  Assert<Equal<Fields<"lobbies">, Entity<Lobby>>>,
  Assert<Equal<Fields<"invites">, Persisted<Invite>>>,
  Assert<Equal<Fields<"duprOutbox">, Persisted<DuprOutboxItem>>>,
  Assert<Equal<Fields<"auditLog">, PersistedAudit>>,
];
