# Gate Matrix

| Gate        | Artifact                                | Pass condition                                            | Status |
| ----------- | --------------------------------------- | --------------------------------------------------------- | ------ |
| Product     | `spec.md`                               | Rename/rebuild/history/share semantics are testable       | passed |
| Decision    | `plan.md`, ADR 0005                     | Fairness and storage trade-offs are explicit              | passed |
| Frontend    | `docs/frontend/design-contract.md`      | New surfaces and anti-generic constraints recorded        | passed |
| Domain      | Unit tests                              | Rename propagation and structural rebuild invariants pass | passed |
| Persistence | Unit tests                              | Bounded, idempotent, corrupt-safe history passes          | passed |
| Workflow    | Component/Playwright                    | Edit, remember, archive, and share fallbacks pass         | passed |
| Visual      | Frontend evidence                       | Celebration, history, editor, and bracket card reviewed   | passed |
| Quality     | `npm run check`, `npm run format:check` | All repository gates pass                                 | passed |
| Release     | `verification.md`                       | Exact merged main commit is published                     | passed |
