# Verification

Status: implementation review

## Baseline

- Live SPE-107 and its owner/event-override clarification read on 2026-10-10
  America/Jamaica; issue moved from Todo to In Progress.
- Canonical start SHA: `475728cfe7702ddd0366778afc3ca026585af312`.
- Fresh fetch found no SPE-107 remote branch or PR; tracked tree was clean.
- Start hygiene had no ticket blocker. Preserved architecture/SPE-103 work and
  unrelated Dependabot branches/PRs remain outside scope.
- Harness provenance gate passed with `action: no_action_required`, no relevant
  shared delta, and no local drift.

## Planned evidence

See `plan.md` for the acceptance mapping. Record exact commands, revision,
fixtures, review findings/rechecks, deployment identity, PR head/CI, merge SHA,
post-merge verification, hygiene, Linear state, and feedback here as evidence
becomes authoritative.

## Independent plan review

The first review returned HOLD with four P1 and two P2 findings: canonical
ownership was undefined; duplicate membership/event-role rows had no fail-closed
rule; lobby host authority was missing; match capabilities could be mistaken for
final authorization; IDOR error equivalence was unspecified; and the negative
matrix was not exhaustive. The plan now makes `ownerUserId` canonical with a
consistent owner membership, rejects duplicate authority rows, validates
personal-org lobby host ownership, separates match role gates structurally from
final operation authorization, uses one resource-unavailable payload, and
requires the complete role/capability/target matrix.

The first re-review remained HOLD on one P1 lifecycle conflict: requiring a
canonical owner membership after deletion would make an intentionally archived
sole-owned club unreadable. The contract now requires strict owner agreement for
active orgs, permits a missing deleted-owner membership only after archival,
keeps existing member/event-role reads, and still removes every write and match
gate. Final re-review is pending.

The final independent re-review returned GO with no remaining material plan
findings. Implementation review remains required against the real Convex
boundary.

## Current-tree implementation evidence

- The kernel is implemented in `convex/lib/authz.ts` with the closed policy
  tables in `convex/lib/authz_policy.ts`; no schema, table, index, migration,
  frontend, or public status behavior changed.
- Test-only dotted modules exercise real Convex query/mutation contexts through
  `withIdentity`. Generated bindings contain the two library modules but no
  test harness or fixture module.
- `npx vitest run convex/authz.identity.test.ts convex/authz.roles.test.ts
convex/authz.resources.test.ts convex/authz.integrity.test.ts`: 4 files and
  33 tests passed.
- `npm run lint`, `npm run typecheck`, `npm run typecheck:convex`,
  `npm run check:lines`, `npm run test:specs`, and `npm test`: passed; the full
  reviewed-candidate suite has 67 files and 369 tests.
- `PICKLE_KING_VERIFY_PORT=43117 ./scripts/verify --full`: passed after rerun
  with permission to bind the isolated local port. This includes harness
  provenance tests, Vinext compatibility, formatting, lint/types, spec and
  unit checks, production build, generated offline service worker, rendered
  shell, all five Chromium share-image cases, and recap geometry assertions.
- `npx convex codegen`: passed against configured development deployment
  `dev:bold-mandrill-86` (project `pickle-king`), uploaded the current function
  set for development validation, generated TypeScript successfully, and did
  not expose test functions.
- Direct `harness-status --gate` at adopted/accepted OS SHA
  `e566213e527802f6ab305486bde26a10dfb07975`: `no_action_required`, with no
  relevant shared delta or local drift.
- The canonical full command was rerun after the implementation-review fixes
  and returned success on the reviewed candidate: 67/67 files and 369/369
  tests, production build/PWA assertions, 5/5 isolated-port Chromium visual
  cases, and recap geometry checks all passed.

## Acceptance mapping

| Acceptance criterion              | Current-tree evidence                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active server-derived identity    | Identity adapter tests cover absent, malformed, unprovisioned, incomplete, deleted, duplicate, and valid indexed subjects.                                          |
| Exact deny-by-default roles       | Table-driven tests cover every capability for every org role, all event-only roles, explicit override replacement, owner non-demotion, and preliminary match gates. |
| Trusted resource scope            | Event, division, match, lobby, pool/division mismatch, ambiguous/no scope, invalid kind, invalid host, and dangling relation tests pass.                            |
| Owner/archive integrity           | Missing/mistyped canonical membership, noncanonical owner, duplicate memberships/roles, active archive, and deletion-shaped archive tests pass.                     |
| IDOR-safe errors                  | A valid foreign org and its subsequently deleted ID return the same `RESOURCE_UNAVAILABLE` payload.                                                                 |
| No client authority/public bypass | Strict validators reject injected authority fields; the compile-time negative assertion rejects match gates as capabilities; `status.health` remains public.        |
| Existing behavior                 | Canonical full verification passed, including offline/PWA and existing visual regression gates.                                                                     |

## Independent implementation review

The first implementation review returned HOLD with one P1 and one P2. The P1
found that archived scope accepted a dangling canonical owner and an active
owner whose owner membership was absent. `getOrg` now always requires the
canonical user row and permits an absent archived owner membership only when
that user is deletion-marked; regressions cover both corrupt states and the
valid deletion-shaped archive. The P2 found missing active mutation and
division/match inheritance evidence; tests now deny active spectator and
cross-event player mutations and prove inherited and overridden authority on
both target types. Focused tests, Convex typecheck, line limits, and diff checks
pass after the fixes. Independent re-review returned GO with no remaining
in-scope security or correctness findings and confirmed test-only functions are
absent from generated API bindings.

The reviewed candidate is committed and the exact function set validated on
`dev:bold-mandrill-86`. No PR exists yet.
