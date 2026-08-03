# Gate Matrix

| Gate        | Artifact                                   | Pass condition                                               | Status  |
| ----------- | ------------------------------------------ | ------------------------------------------------------------ | ------- |
| Product     | `spec.md`                                  | hierarchy, cutoff, cancel, and fallback paths are explicit   | passed  |
| Decision    | ADR 0006                                   | procedural-fairness trade-off is recorded                    | passed  |
| Domain      | unit tests                                 | all repair methods, rewiring, decline, cutoff, and undo pass | passed  |
| Persistence | schema/storage tests                       | legacy v1 and amended sessions load safely                   | passed  |
| Frontend    | design contract and browser workflow       | review/lane/locked states work on iPad                       | passed  |
| Quality     | `npm run check`, `npm run format:check`    | repository gates pass                                        | pending |
| Visual      | browser captures and accessibility harness | zero open P0–P2 findings                                     | pending |
