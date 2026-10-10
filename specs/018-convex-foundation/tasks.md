# Tasks

- [x] T001 Reconcile live Linear/Git, hygiene, harness, architecture, security, and dependency baseline.
- [x] T002 Complete independent design review and resolve its three P1 and two P2 findings in the contract.
- [x] T003 Install the minimal Convex runtime/test dependencies and generate the backend boundary.
- [x] T004 Add backend and optional-provider/config regression tests.
- [x] T005 Implement the deterministic query and non-blocking browser diagnostic.
- [x] T006 Extend environment documentation and the existing canonical check path.
- [ ] T007 Provision development/production deployments and verify exact-candidate preview and post-merge production bindings.
- [x] T008 Run full verification and independent implementation and visual reviews.
- [ ] T009 Commit, publish PR, obtain exact-head CI, merge, and run post-merge gates.

## Current handoff

Local implementation and `./scripts/verify --full` are complete. T007 is
blocked because this environment has no authenticated Convex CLI session,
`CONVEX_DEPLOY_KEY`, or repository Convex secret/variable. Independent reviews
are complete. Next, obtain an approved development login and separate
preview/production deploy keys before provisioning or publishing the candidate.
