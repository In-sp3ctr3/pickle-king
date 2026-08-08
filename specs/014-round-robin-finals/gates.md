# Gate Matrix

| Gate                    | Artifact                                     | Pass condition                                                  | Status         |
| ----------------------- | -------------------------------------------- | --------------------------------------------------------------- | -------------- |
| Product                 | `spec.md`, ADR 0004                          | eight-match rules and deferrals are explicit                    | passed         |
| Engineering             | domain and integration tests                 | creation, ranking, lifecycle, correction, timing, results pass  | passed         |
| Persistence             | migration and round-trip tests               | V1 becomes knockout V2; round robin resumes safely              | passed         |
| Frontend                | design contract, route map, browser evidence | setup, schedule, standings, results, history, sharing pass      | passed         |
| Accessibility           | browser/component checks                     | semantic table, named controls, focus, reduced motion, Axe pass | passed         |
| Security                | existing local-only model                    | no new trust boundary, network, account, or data transmission   | not applicable |
| SEO                     | existing single public route                 | no public route or discoverability change                       | not applicable |
| Repository architecture | existing feature/domain boundaries           | no tree or dependency architecture change                       | not applicable |
| Quality                 | repository gates                             | check, format, frontend QA, responsive workflow pass            | passed         |
