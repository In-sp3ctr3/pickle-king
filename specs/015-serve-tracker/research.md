# Research: Serve tracker

## Decisions

### Standard side-out scoring only

- **Decision**: Live matches use standard side-out scoring for this feature.
- **Rationale**: It is the official baseline, directly matches the requested
  server indicator, and prevents the app from conflating the distinct doubles
  service sequences of side-out and rally scoring.
- **Evidence**: USA Pickleball defines the first-serving opening exception,
  two-server doubles sequence, and side-out sequence in its
  [2026 Official Rulebook](https://usapickleball.org/docs/rules/USAP-Official-Rulebook.pdf)
  and [rules summary](https://usapickleball.org/rules/).
- **Alternative rejected**: Keep the current both-sides-score behavior. It
  cannot truthfully identify a standard doubles Server 1 or Server 2.

### Derive legal positions; do not track stacking

- **Decision**: Store each doubles team's right-at-zero player and derive the
  active player and legal service side. Do not record player movement or a
  stacking toggle.
- **Rationale**: Stacking changes a partner's physical formation, not the
  server/receiver legal position.
- **Evidence**: USA Pickleball's [2026 stacking clarification](https://usapickleball.org/ref-notices/rule-5-b-3-explanation-stacking-players/)
  states that correct position applies to the active server/receiver while a
  partner may stand elsewhere.
- **Alternative rejected**: A court-position editor after every rally. It is
  extra scorer work and would represent non-rule information.

### Record rally winners and undo whole rallies

- **Decision**: The two large team targets mean “won rally”; retain an event
  history sufficient to undo a whole rally state.
- **Rationale**: A receiver winning a rally is valid, but it advances service
  instead of increasing its score. Whole-rally undo prevents score and serve
  state from drifting apart.
- **Evidence**: Pickleball Point Keeper describes a one-tap winning-team model
  that automatically progresses side-outs and supports immediate undo.
  [Product description](https://pickleballpointkeeper.com/our-scoring-solution)
- **Alternative rejected**: Reject receiver taps. It adds a separate loss
  control and makes the normal result look like an error.

### Compact guide in the existing scorer identity

- **Decision**: Add a small always-visible serving strip, with an outlined
  court and highlighted legal box, below the existing match top bar.
- **Rationale**: It provides glanceability without shrinking the primary
  scoring targets. Native DOM/CSS is the lowest faithful representation rung.
- **Alternative rejected**: A persistent full-court dashboard or generated
  visual. Neither is needed for a semantic, state-driven guide.

## Risks and mitigations

| Risk                                                    | Mitigation                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Pre-feature active sessions have no starting positions. | Persist a deliberately unconfigured service state and require setup before the next live rally; never guess. |
| The scorekeeper misses more than one no-point rally.    | Provide a secondary Fix serve control for Server 2 or side out; preserve scores.                             |
| Result editing invalidates event-derived service state. | Clear service tracking in result-edit mode; do not resume live scoring from it.                              |
| Serve feedback competes with score targets.             | Keep the guide read-only and compact; use a dialog only for initial setup and recovery.                      |
