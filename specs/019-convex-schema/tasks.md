# Tasks

- [x] T001 Reconcile live Linear/Git, overlap, hygiene, harness, SPE-103, architecture, and security authority.
- [x] T002 Complete independent plan review and resolve material findings.
- [x] T003 Implement the 18-table schema, indexes, and authorized draft corrections.
- [x] T004 Add schema validation, conformance, and 127-row indexed-query tests.
- [x] T005 Run focused negative proof and canonical full verification.
- [x] T006 Complete independent implementation review and resolve findings.
- [x] T007 Commit the verified candidate, then inspect and deploy that exact SHA to an authorized development/isolated preview target.
- [ ] T008 Push, open PR, obtain exact-head CI, and pass protected merge gates.
- [ ] T009 Run post-merge deployment/verification/hygiene and close Linear with feedback evidence.

## Current handoff

Schema, conformance, validation, generated bindings, and index tests are
implemented. `npm run check` passes with 63 files/336 tests and the production
build. The first independent implementation review returned HOLD; all three
findings were fixed, and independent re-review returned GO with no unresolved
in-scope findings. Reviewed commit `7d88aafa04373c91c9253f3488fd988ad9a701e0`
was deployed to development and passed its health probe. PR delivery is next.
