# Gate Matrix

| Gate                    | Artifact                                     | Pass condition                                                                 | Status         |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ | -------------- |
| Product                 | `spec.md`, ADR 0004                          | 4–6 threshold, placements, warning policy, and deferrals are explicit          | passed         |
| Engineering             | domain and integration tests                 | pairing, lifecycle, timing, correction, replay, and results pass               | passed         |
| Persistence             | V2 schema and round-trip tests               | 4–6 shapes validate; existing V1/V2 data remains compatible                    | passed         |
| Frontend                | design contract, route map, browser evidence | setup, rests, warning states, schedules, results, history, and sharing pass    | passed         |
| Accessibility           | component and browser checks                 | advisory semantics, rest labels, controls, focus, reduced motion, and Axe pass | passed         |
| Security                | existing local-only model                    | no new boundary, network, account, or transmission                             | not applicable |
| SEO                     | existing single public route                 | no public route or discoverability change                                      | not applicable |
| Repository architecture | existing feature/domain boundaries           | no tree, runtime, or dependency architecture change                            | not applicable |
| Quality                 | repository gates                             | check, format, frontend QA, responsive, audit, and smoke tests pass            | passed         |
