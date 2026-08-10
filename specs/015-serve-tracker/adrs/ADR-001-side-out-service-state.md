# ADR-001: Deterministic standard side-out service state

**Status**: Accepted

## Context

The current live scorer permits either team to receive a point, but the serve
indicator requires the legal standard side-out sequence. The app must work
offline and survive interruption without asking the scorer to manually track
player movements.

## Decision

Add a pure service-state model to the existing match domain. Store starting
team, doubles right-at-zero anchors, serving team, and opening/first/second
turn. Derive active player and legal service side from those values and the
scores. Record reversible rally transitions. Do not add a stacking setting.

## Alternatives considered

1. Keep point-only score events and infer service later. Rejected because
   unscored faults cannot be recovered from scores alone.
2. Add manual player-switch controls. Rejected because it increases scorer work
   and tracks formation that stacking intentionally makes variable.
3. Implement rally and side-out scoring together. Rejected because their serve
   models differ and the product request is the standard server indicator.

## Consequences

The primary score targets change semantic meaning to rally winner. Existing
active persisted sessions require deliberate serve setup before continuation.
The domain remains pure and adds no runtime dependency or remote data flow.
