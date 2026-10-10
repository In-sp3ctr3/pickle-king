# Verification

Status: implementation review

## Baseline

- Live SPE-104 and its 2026-10-09 control-plane clarification read on
  2026-10-09 America/Jamaica; status moved from Todo to In Progress.
- Canonical start and branch base:
  `dabdc75693195784b2e982611b0dd4e4a2b1b1f9`.
- Fetch showed no remote SPE-104 branch. Open GitHub PRs are dependency-only.
  The preserved architecture branch contains the draft/ADRs but no schema.
- Start tree was clean. The stale local SPE-103 worktree is patch-equivalent to
  merged main and was preserved; unrelated architecture/dependency work was
  not modified.
- Exact adopted harness provenance gate passed with `action:
no_action_required`, no relevant shared delta, and no local drift.

## Independent plan review

The first review returned HOLD with four P1 and four P2 findings: Convex has no
tuple-length validator; account display name was absent; invites lacked typed
target/issuer/revocation/fixed-role binding; scorer claim fields did not require
a revision; index query shapes were unspecified; conformance exceptions and
nested coverage were vague; the runtime matrix/127-row decoys were underspecified;
and deployment preceded an immutable commit despite missing credentials. The
contract resolved each finding. Two rechecks found three remaining consistency
gaps, then returned GO after exact invite variants/conformance exceptions,
display-name scrubbing, and task order were aligned.

## Planned evidence

See `plan.md` acceptance mapping. Commands, exact revision, environment,
fixtures, results, skipped checks, review findings, deployment identities, PR
head, merge SHA, post-merge checks, hygiene, Linear state, and Engineering OS
feedback will be recorded here as they become authoritative.

## Current-tree evidence

- `npm run check` passed on the working tree: lint, root/Convex typechecks,
  300-line gate, spec integrity, 63 Vitest files/336 tests, and production build.
- Twelve focused schema tests insert and read every table, exercise every declared
  index, reject missing/invalid fields, wrong-table IDs, raw bearer fields,
  mismatched invite variants, illegal owner grants, incomplete claim revisions,
  and invalid state values. The expanded boundary suite covers all planned
  formats, sources, result/signature/outcome values, rally turns/teams, roles,
  lobby states, and outbox states. It also records that team array cardinality
  is a future mutation invariant rather than a Convex-validator capability.
- The 127-row test inserts 126 target rows plus the seeded target row and nine
  decoys, then uses one `matches.by_divisionId` query and asserts exact count,
  identity set, and decoy exclusion.
- Per-table compile-time assertions compare exact keys, optionality, recursive
  ID mappings, nested unions, and the documented exception list. A controlled
  `Event.venue?: string` -> `number` drift failed `typecheck:convex` at the
  event assertion and passed again after restoration.
- The first development code-generation dry run rejected hyphens in deployable
  Convex module paths before applying a schema. Renaming only those modules to
  underscore paths fixed the deployability defect. A second dry run against
  `bold-mandrill-86` succeeded, regenerated schema-bound `dataModel.d.ts`, and
  removed its former permissive `AnyDataModel` fallback. No schema was deployed.
- `PICKLE_KING_VERIFY_PORT=43117 ./scripts/verify --full` passed on the current
  tree, including formatting, lint, both typechecks, the 300-line gate, spec
  integrity, 63 files/336 tests, production build, rendered HTML/PWA checks,
  five production-server browser cases, and deterministic recap-grid checks.
  The default-port attempt was invalid environment evidence because Chromium
  reached an unrelated local Paypa app on port 3000; no product assertion ran.
- The authorized target was resolved as development deployment
  `dev:bold-mandrill-86`. Pre-deploy inspection found all 18 domain tables and
  confirmed that each contained no documents, so no backfill or compatibility
  migration is required for this candidate.

## Independent implementation review

The first review returned HOLD with two P1 and one P2 finding: the shared test
fixture's filename was deployable, generated bindings were still permissive,
and the runtime matrix did not yet substantiate every promised literal/variant
boundary. The fixture now uses a dotted test filename, the development dry run
generated schema-bound bindings, and the compact table-driven boundary suite
closes the matrix. Independent re-review returned GO with no unresolved
in-scope findings after independently confirming the generated API exclusions,
schema-bound data model, 12 focused tests, `npm run check`, and the canonical
full verification result.
