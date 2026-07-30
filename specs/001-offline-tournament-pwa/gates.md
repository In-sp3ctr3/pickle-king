# Gate Matrix

| Gate         | Required artifact                         | Pass condition                                  |
| ------------ | ----------------------------------------- | ----------------------------------------------- |
| Product      | `spec.md`                                 | Requirements and non-goals are testable         |
| Architecture | `plan.md`, ADRs                           | Local-first boundaries and Vinext risk recorded |
| Starter      | `docs/architecture/starter-evaluation.md` | Adopt/replace decisions recorded                |
| Security     | `docs/security/threat-model.md`           | Data flow and abuse cases mitigated             |
| Frontend     | `docs/frontend/*`                         | Contract ready before route implementation      |
| Domain       | Unit and property tests                   | All tournament invariants pass for 4–16         |
| Integration  | Component/workflow tests                  | Setup through results and Quick Match pass      |
| Browser      | Playwright evidence                       | Mobile/desktop, keyboard, Axe, console pass     |
| PWA          | Manifest/SW smoke                         | Install metadata and offline reopening pass     |
| Quality      | CI                                        | lint, typecheck, test, build, line limit pass   |
| Release      | `verification.md`                         | Exact merged commit verified and deployed       |
