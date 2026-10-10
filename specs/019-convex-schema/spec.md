# Convex Platform Schema

Status: approved for implementation by SPE-104

## Outcome

Declare the platform domain's 18 Convex tables and the indexes needed by the
ticketed read paths, reconciling only the security-sensitive persisted
representations superseded by SPE-93.

## Requirements

1. `convex/schema.ts` declares `users`, `orgs`, `orgMembers`, `players`,
   `ratings`, `ratingEvents`, `events`, `divisions`, `teams`, `pools`,
   `matches`, `rallyLogs`, `liveScores`, `eventRoles`, `lobbies`, `invites`,
   `duprOutbox`, and `auditLog` with Convex validators and typed references.
2. Required/optional fields, literals, unions, result states, rating history,
   separate rally/live-score documents, and I1-I11/T1-T28 rationale remain
   aligned with `platform-domain.draft.ts`.
3. Convex `_id` replaces writable branded entity IDs. Account identity fields
   are optional only so deleted rows can be anonymized; future mutations must
   require `clerkId`, `email`, and `displayName` on active rows.
4. Event/lobby join codes and invite/claim tokens persist only as scoped
   digests. Invite variants persist typed targets, issuer, fixed role where
   applicable, expiry, revocation, and single-use state. A match claim is one
   optional object whose holder/times always include a server-issued revision.
5. Declared indexes cover Clerk/user/membership, organization/player,
   division/match, result/finalization, rating replay, rally chunks,
   digest lookup, and DUPR outbox processing without speculative indexes.
6. Executable tests cover every table, validation boundaries, typed IDs,
   anonymized users, digest-only fields, indexed reads, and a 127-match
   division query through `matches.by_divisionId`.
7. A type-level conformance check covers mapped draft fields, optionality, and
   unions while explicitly documenting the authorized representation changes.
   Team cardinality remains `[one] | [one,two]` in the domain draft but is a
   later mutation invariant because Convex 1.46 has no tuple validator.

## Non-goals

No Clerk integration, onboarding, authorization, CRUD, invite/claim issuance,
match submission, ratings logic, tournament endpoints, DUPR processing,
account deletion workflow, frontend hosting work, or production seed data.
The existing `status.health` query and offline guest application stay intact.

## Acceptance

- Convex schema validation, backend tests, Convex/root typechecks, product
  tests, production build, and canonical full verification pass.
- A controlled ordinary-field mismatch fails the conformance typecheck and is
  restored.
- The test-only indexed query returns exactly 127 matches for one division in
  one `.withIndex("by_divisionId")` query.
- An authorized development or isolated preview deployment accepts the schema
  after its identity and existing data are inspected. Production deployment
  remains a separately gated action.
- Independent plan and implementation reviews have no unresolved in-scope
  findings; exact-head hosted CI and post-merge checks are recorded before Done.
