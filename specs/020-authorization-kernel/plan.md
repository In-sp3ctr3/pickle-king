# Implementation Plan

## Design Contract

The kernel is a server-side policy boundary, not a mutation framework. It reads
only authenticated identity and current persisted relationships, returns a
typed authorization context, and throws a safe Convex error on every unresolved
or unauthorized path.

Positive path:

`Convex function -> ctx.auth identity -> users.by_clerkId -> resource relations -> current roles -> capabilities -> caller performs separately validated operation`

Material negative paths:

- No or malformed subject, no unique user row, incomplete active identity, or
  deleted user -> deny before resource or role evaluation.
- Active-org canonical owner/membership disagreement or duplicate
  membership/event-role rows -> deny instead of choosing an authority row.
- Guessed/missing ID, dangling relation, conflicting pool/division, or a match
  carrying both tournament and lobby ownership -> deny without inferred scope.
- No membership/event role, wrong org/event, or insufficient capability -> deny.
- Archived owning org -> remove every write capability and match gate, including
  for owner.
- Client authority fields -> impossible because the API accepts only a typed
  resource target and required capability; caller and scope are server-derived.
- A future match mutation receives preliminary role gates, never a final match
  authorization result; a later operation authorizer must enforce the
  participant/claim/state/conflict rules.

No public function is added. Test-only dotted modules invoke the real Convex
query/mutation context with `withIdentity`; generated/deployed API remains free
of the harness.

## Capability Model

Organization capabilities:

- `org:read` — protected organization/member data for a current org member.
- `org:manage` — organization membership/settings and event creation.
- `org:transfer` — owner transfer/delete boundary; owner only.
- `org:dupr` — DUPR settings boundary; owner only.

Event capabilities:

- `event:read` — protected event data for an authorized org/event role.
- `event:manage` — draw, schedule, courts, and event settings.
- `event:register` — registration boundary.

Match role gates are a separate type and API:

- `staff-score` — caller's role may enter the later scorer-claim flow.
- `staff-record` — caller's role may enter later staff result recording.
- `staff-correct` — caller's role may enter the later correction flow.
- `participant-record-candidate` — later code must prove current participation.
- `participant-sign-candidate` — later code must prove current side/conflicts.

`requireCapability` cannot accept a match role gate. `resolveMatchRoleGates`
returns `{ roleGates, requiresOperationChecks: true }`; a compile-time negative
assertion proves its result is not a final operation authorization context.

The matrix is exact and deny-by-default:

| Effective role | Organization capabilities | Event capabilities             | Match role gates                               |
| -------------- | ------------------------- | ------------------------------ | ---------------------------------------------- |
| owner          | all four                  | all three                      | all five                                       |
| admin          | `org:read`, `org:manage`  | `event:read`, `event:manage`   | `staff-correct`                                |
| director       | `org:read`                | `event:read`, `event:manage`   | `staff-score`, `staff-record`, `staff-correct` |
| scorer         | `org:read`                | `event:read`                   | `staff-score`, `staff-record`                  |
| member         | `org:read`                | `event:read`, `event:register` | both participant candidates                    |
| event director | none                      | director event capabilities    | director gates                                 |
| event scorer   | none                      | scorer event capabilities      | scorer gates                                   |
| event player   | none                      | `event:read`, `event:register` | both participant candidates                    |
| spectator      | none                      | none                           | none                                           |

For a non-owner org member, an explicit `eventRoles` row selects the event-role
row exactly instead of unioning inherited event powers. Organization powers
always remain those of the org membership. Owners ignore an event override for
event resolution. Lobby scope uses the explicit host rule below. Archived orgs
preserve only `org:read`/`event:read` already granted by current relationships.

This matrix intentionally does not add hierarchical powers absent from D9:
admins do not silently become scorers, and directors do not gain org management.

## Identity and Data Boundaries

- Require a non-empty, unmodified `identity.subject` and look up at most two
  rows through `users.by_clerkId`; zero or duplicate rows fail closed.
- Active rows require non-empty `clerkId`, `email`, and `displayName`, exact
  subject equality, and no `deletedAt`.
- Return the persisted `users` document as caller identity. Never accept an
  authority-bearing user argument.
- Query at most two rows for `(orgId,userId)` and `(eventId,userId)`; duplicate
  rows, including identical roles, fail closed.
- `orgs.ownerUserId` is canonical and must resolve to a user row. An active org
  requires exactly one agreeing owner membership for that user; missing,
  duplicate, or differently-typed canonical membership makes the scope
  unavailable. An archived org may lack the canonical owner's membership only
  when that owner row is deletion-marked; if present it must still agree. A
  caller's noncanonical `owner` membership never grants owner authority.
- Authenticated resource failures use one externally visible
  `RESOURCE_UNAVAILABLE` payload for missing, dangling, foreign, unauthorized,
  and guessed targets. It contains no private row data.

## Resource Resolution

- org: row -> itself.
- event: event -> org.
- division: division -> event -> org.
- lobby: lobby -> org, then validate the lobby host rule.
- match/lobby: match -> lobby -> org only when no division or pool path exists.
- match/tournament: optional pool -> division plus optional direct division;
  both must agree, then division -> event -> org.
- Both lobby and tournament paths, no path, mismatched pool/division, or any
  missing link are ambiguous/dangling and denied.
- Lobby-backed matches require `kind: "lobby"`; tournament-backed matches reject
  that kind. This prevents malformed rows from switching authority models.

A lobby is valid only when the org is `personal`, `hostUserId` equals canonical
`ownerUserId`, and active-org canonical owner membership is consistent. Only the
host receives lobby event capabilities and staff match gates; other org roles
receive no lobby event/match authority. Organization-wide capabilities remain
membership-derived. Archived lobbies have no event writes or match gates.

The returned scope carries trusted `orgId`, optional `eventId`, target kind, and
optional validated lobby host. An event override is queried only when that
trusted event ID exists.

## Test Matrix

Tests use one compact fixture builder and test-only query/mutation adapters:

- unauthenticated; empty subject; missing, duplicate, incomplete, and deleted users;
- authorized org member and nonmember denial;
- canonical owner success; missing/mismatched owner membership; noncanonical
  owner row; duplicate identical/conflicting membership and event-role rows;
- org inheritance and exact non-owner override replacement;
- owner override cannot demote; event role cannot grant org capability;
- event-only player, director, and scorer confined to their event;
- cross-org target and copied/guessed IDs denied with the same error payload as
  a nonexistent target;
- archived org reads explicit and all writes/match gates denied;
- deletion-shaped archive with deleted canonical owner, no owner membership,
  and a surviving member/event role whose protected reads still succeed;
- event/division/tournament-match happy paths;
- valid personal-org lobby host and lobby-match happy paths;
- non-host org-role denial; malformed club lobby, host/owner mismatch,
  lobby-kind mismatch, and tournament-kind mismatch;
- missing and dangling resource chains, pool/division mismatch, no match scope,
  and lobby+tournament ambiguity denied;
- adapter args contain no user/role/org authority fields;
- compile-time proof that match gates are not accepted by `requireCapability`;
- public `status.health` remains unauthenticated and reachable.

Table-driven assertions cover every org/event role against every capability and
match role gate, each target kind (org, event, division, lobby, tournament match,
lobby match), override/no override, active/archived org, valid foreign and
missing IDs, duplicate relations, and every malformed match ownership shape.

## Compatibility, Rollout, and Recovery

No table, index, data migration, public endpoint, schedule, flag, frontend, or
personal-data write changes. Development/preview code validation is sufficient
to prove module deployability; no test accounts are created. Production deploy
is useful only to make the internal library available to future functions and
remains a separately protected exact-merge action. Rollback is redeploying the
prior exact source because this ticket writes no data.

## Acceptance to Evidence

| Criterion                      | Evidence                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------ |
| Active server-derived identity | authenticated Convex boundary tests and indexed lookup inspection              |
| Typed deny-by-default matrix   | compile-time capability types plus exhaustive positive/negative target tests   |
| Trusted resource scope         | relationship fixtures including dangling/mismatch/ambiguity failures           |
| Owner/override/archive rules   | matrix tests across two orgs/events plus duplicate/conflict fixtures           |
| Match role-gate boundary       | role tests plus compile-time/API-shape proof gates are not final authorization |
| IDOR-safe errors               | equal payload assertion for missing and real cross-org resources               |
| No public bypass               | generated API diff and deployed-module inspection                              |
| Existing behavior              | `status.health`, schema tests, build, and `./scripts/verify --full`            |

## Delivery Order

1. Independently review this design against live SPE-107, D2/D9, ADR-0009,
   SPE-93, the schema, and the security test plan; resolve findings.
2. Add the typed kernel and compact test-only authenticated adapters/tests.
3. Run focused tests, typechecks, schema/API consistency, and canonical full verification.
4. Obtain independent security-focused implementation review and resolve findings.
5. Commit and validate the exact reviewed candidate in development/preview.
6. Push, open PR, obtain exact-head CI, pass protected merge/release gates, and
   record post-merge verification, hygiene, Linear, and feedback evidence.
