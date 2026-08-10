# Gate Matrix: Serve tracker

| Harness                 | Phase                                  | Required artifact                | Acceptance criteria                                                      | Evidence                   | Status         |
| ----------------------- | -------------------------------------- | -------------------------------- | ------------------------------------------------------------------------ | -------------------------- | -------------- |
| Spec/Product            | Specify and clarify                    | `spec.md`, checklist             | Scenarios, assumptions, and scope are testable                           | Completed checklist        | complete       |
| Research                | Rules and competitor review            | `research.md`                    | Official rule source and UX decision recorded                            | Linked primary sources     | complete       |
| Frontend                | Reference-derived extension            | `docs/frontend/*`, gate receipts | Existing scorer identity, responsive layout, and all new controls mapped | Release receipt and review | complete       |
| System Design           | Local state model                      | `data-model.md`, ADR             | Service state is deterministic, offline, and recoverable                 | Plan review                | complete       |
| Security                | Local-only change                      | `research.md`, verification      | No account, network, or player-data transmission added                   | Repository review          | complete       |
| Repository Architecture | Existing modular feature/domain layout | `plan.md`                        | Domain stays React/browser-free                                          | Plan review                | complete       |
| Boilerplate             | Existing app                           | N/A                              | No starter or dependency required                                        | Existing repository        | not applicable |
| Engineering             | TDD behavior slices                    | `tasks.md`                       | Pure state transitions have tests before implementation                  | Unit and browser suites    | complete       |
| SEO                     | No public route/content change         | N/A                              | Existing public metadata unaffected                                      | Scope review               | not applicable |
| Repo Hygiene            | Existing repository                    | `verification.md`                | Required checks recorded                                                 | Release verification       | complete       |
