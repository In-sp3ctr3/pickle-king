# Implementation Plan

## Design Contract

This slice changes only the persisted shape and indexes. There are no public
queries or mutations. Future server functions remain responsible for lifecycle
and authorization invariants that a Convex validator cannot express.

Positive path:

`future authorized mutation -> Convex validator -> typed references/state -> indexed persistence`

Material negative paths:

- Wrong/missing field, literal, reference-table ID, or union
  variant -> schema validation rejects the write.
- Deleted account -> `deletedAt` may coexist with scrubbed
  `clerkId`/`email`/`displayName`; active-account completeness remains a
  documented future mutation invariant.
- Invite/join/claim bearer value -> only a scoped digest has a schema field;
  raw token/code has no persisted destination. Invite variants bind typed
  target, issuer, fixed role where applicable, expiry, revocation, and use.
- Stale scoring submission -> future mutation compares the server-issued claim
  revision stored inside the indivisible claim object; this ticket implements
  no claim behavior.
- Cross-org/unauthorized access -> N/A here because no callable data surface is
  added; future functions must derive identity and authorize every resource.
- Deploy against incompatible existing data -> inspect target identity/data,
  deploy to development/isolated preview first, and stop before production
  unless the protected release gate is satisfied.

## Schema and Index Decisions

- Use `_id`/`_creationTime` and `v.id(table)` for entity identity/references.
- Keep domain-owned timestamps rather than substituting `_creationTime`.
- Store `users.clerkId`, `users.email`, and `users.displayName` as optional for
  anonymization; index `clerkId`. An active row without all three is invalid
  business state, not valid onboarding input.
- Replace `Event.joinCode`, `Lobby.joinCode`, and `Invite.token` with
  `joinCodeDigest`/`tokenDigest`; index each digest lookup.
- Refine the flat invite draft into exact SPE-93-bound variants sharing
  `tokenDigest`, `issuedByUserId`, `expiresAt`, `revokedAt?`, and `usedAt?`:
  `claim` targets `players` and may carry claimant/confirmation fields with no
  role; `team` targets `teams` with literal role `player`; `scorer` targets
  `events` with literal role `scorer`; `org` targets `orgs` with role
  `admin|director|scorer|member`. `owner` remains impossible to persist.
- Replace the three independent scorer-claim fields with one optional
  `scorerClaim` object containing `userId`, `claimedAt`, `expiresAt`, and
  required `revision`, so persisted claims cannot omit replay state.
- Convex 1.46 provides array but not tuple validators. Persist
  `teams.playerIds` as an ID array and keep one-or-two cardinality as a future
  mutation invariant. Tests demonstrate schema capability separately from that
  business rule; conformance lists this as a platform representation exception.
- Use compound indexes where the read naturally constrains/order fields:
  membership (`orgId,userId`), rating (`subjectId,discipline`), rally chunks
  (`matchId,chunk`), and outbox processing (`status,notBefore`). Keep the live
  issue's direct match result/final-time and rating replay indexes. Each index
  below has an explicit query shape and is checked structurally; representative
  groups are also exercised through indexed reads.

Planned indexes:

`users.by_clerkId`; `orgs.by_ownerUserId`;
`orgMembers.by_orgId_userId`, `orgMembers.by_userId`;
`players.by_orgId`, `players.by_userId`;
`ratings.by_subjectId_discipline`;
`ratingEvents.by_playerId`, `ratingEvents.by_at`;
`events.by_orgId`, `events.by_joinCodeDigest`;
`divisions.by_eventId`; `teams.by_divisionId`; `pools.by_divisionId`;
`matches.by_divisionId`, `matches.by_poolId`, `matches.by_lobbyId`,
`matches.by_result`, `matches.by_finalAt`;
`rallyLogs.by_matchId_chunk`; `liveScores.by_matchId`;
`eventRoles.by_eventId_userId`, `eventRoles.by_userId`;
`lobbies.by_orgId`, `lobbies.by_joinCodeDigest`;
`invites.by_tokenDigest`; `duprOutbox.by_status_notBefore`;
`auditLog.by_target`.

Query shapes are equality lookup/list unless stated otherwise: Clerk identity;
owner's organizations; org membership pair and a user's memberships; org and
user player appearances; one current rating; one player's events and global
`at` replay order; org events and join-digest resolution; event divisions;
division teams/pools/matches; pool/lobby matches; result filtering; global
`finalAt` replay order; ordered rally chunks; match live score; event role pair
and a user's roles; org lobbies and join-digest resolution; invite digest;
outbox status ordered by `notBefore`; audit target history. These are the
minimum ticketed reads; no general search indexes are added.

## Conformance Exceptions

Compile-time assertions compare every document's exact keys and recursively
mapped value types after removing Convex system fields. They also assert the
nested discriminated unions (`MatchSource`, invite variants), literals,
optionality, and ID table mappings. The closed exception list is:

1. draft entity `id` -> Convex `_id`/`_creationTime`;
2. branded references -> `Id<table>`;
3. user identity fields optional plus the added anonymizable `displayName`;
4. raw event/lobby bearer fields -> digest fields, and the flat invite
   `targetId`/optional-role/token shape -> the exact typed-target,
   issuer/revocation/use-bound variants above;
5. independent scorer fields -> required-revision claim object;
6. team tuple -> ID array, with one/two enforced by future mutations;
7. `AuditEntry.diff: unknown` -> Convex `v.any()`/`any`.

No other mismatch is allowed. A controlled ordinary-field edit must fail the
Convex typecheck and be restored.

## Runtime Test Matrix

| Surface                      | Valid/boundary and rejection evidence                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| users                        | active full row; anonymized row; missing required consent; invalid age literal; raw identity absent after deletion capability                                        |
| orgs/orgMembers              | personal/club and every role boundary; typed owner/member refs; missing/wrong-table refs rejected                                                                    |
| players/ratings/ratingEvents | unlinked/linked optionals; gender/age/discipline/weight boundaries; subject ID union; before/after objects; invalid literals                                         |
| events/divisions             | digest-only event; visibility/status; every format; scoring null-vs-number and literal bounds; eligibility/pool optionals; invalid raw code/union                    |
| teams/pools                  | singles/doubles examples; empty/three-player arrays explicitly accepted by schema but classified as mutation-invalid; typed registrations/team refs                  |
| matches                      | every source variant, result state, signature kind, outcome, optional claim with required revision, corrections/resolution; incomplete claim and wrong refs rejected |
| rallyLogs/liveScores         | nested rally service literals, chunks, current projection, missing/invalid nested values                                                                             |
| eventRoles/lobbies           | every role/status, typed refs, digest-only lobby, raw code rejected                                                                                                  |
| invites                      | claim/team/scorer/org variants with typed targets, fixed roles, issuer/expiry/revocation/use; wrong role/target/raw token rejected                                   |
| duprOutbox/auditLog          | all outbox statuses, optional error, ordering fields, flexible audit diff, typed actor; invalid status/missing fields rejected                                       |
| indexes                      | declared-field/index manifest plus functional reads for identity/tenant, bracket, replay, digest, rally, and outbox groups                                           |
| 127-row division             | 127 target matches plus decoys in another division; one `withIndex("by_divisionId")` query asserts exact count and membership                                        |

## Compatibility, Rollout, and Recovery

The production database is expected to have no domain rows because SPE-103
introduced no schema. That expectation must be inspected, not assumed. Schema
addition needs no backfill. If preview validation fails, leave production
untouched and correct the schema. After any authorized production deployment,
forward repair is preferred; rollback is safe only while no new table writes
exist and must use the prior exact source revision.

No feature flag, public API, scheduled job, timeout, retry, timezone, locale,
or UI behavior applies in this declaration-only slice. Convex deployment and
hosted CI provide operational evidence; they do not prove later authorization
or business-rule behavior.

## Acceptance to Evidence

| Criterion                            | Evidence                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| 18 typed tables and required indexes | schema inspection, generated data model, backend schema tests                  |
| Field/union/optional validation      | valid minimum/typical rows and rejected missing/invalid/extra values           |
| Deletion and digest representations  | focused anonymized-user and raw-field rejection tests                          |
| Draft conformance                    | compile-time mapped equality assertions plus controlled mismatch failure       |
| 127-row indexed read                 | deterministic `convex-test` run using `withIndex("by_divisionId")`             |
| Existing behavior                    | `status.health`, canonical tests, build, and `./scripts/verify --full`         |
| Deployment safety                    | target identity/data inspection and development/preview deploy evidence        |
| Delivery                             | independent reviews, exact-head CI, merge SHA, post-merge verification/hygiene |

## Delivery Order

1. Independently review this contract against SPE-104, PLAN, ADR-0009/0010,
   and SPE-93; resolve findings before code.
2. Add schema validators/indexes and the narrow authorized draft corrections.
3. Add conformance and backend validation/index tests without a production
   bracket endpoint.
4. Generate Convex types, run focused checks, controlled negative proof, and
   canonical full verification.
5. Obtain independent implementation review and reconcile findings.
6. Commit the verified candidate, then inspect/deploy that exact SHA to an
   authorized non-production Convex target. Missing credentials remain an
   explicit blocker; anonymous local development is not deployment evidence.
7. Push, open PR, obtain exact-head CI, pass protected merge/production gates,
   then run post-merge checks, hygiene, Linear evidence, and Engineering OS
   feedback.
