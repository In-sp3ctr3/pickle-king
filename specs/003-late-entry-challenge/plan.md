# Implementation Plan

## Architecture

- Add a pure late-entry planner that selects the repair method, protected route,
  restored lineage, source rewiring, and timing impact.
- Add a separate mutation module that creates challenge matches and records enough
  original state for a safe pre-start undo.
- Extend the existing bracket schema with a default-empty amendment ledger and a
  `challenge` match kind. Keep snapshot version 1 because parsing supplies the
  backward-compatible default.
- Integrate reducer actions for apply/undo and keep the original session deadline
  unless the operator explicitly removes remaining time caps.
- Add a focused review dialog and an animated challenge lane without changing the
  approved connected-bracket geometry.

## Development mode

- TDD for selection, rewiring, cutoff, scheduling, timing, persistence, and undo.
- ATDD for preview, cancel, apply, locked-state Quick Match handoff, and iPad flow.
- No generic state machine, service layer, database, or new dependency.

## Risks and mitigations

- **Strategic late arrival:** one amendment maximum; entrant is unseeded and earns
  missed depth.
- **Organizer favoritism:** deterministic branch choice and stored-seed tiebreak.
- **Podium corruption:** hard lock at the first placement match and bronze rewiring
  when the final route changes.
- **Correction invalidates lineage:** lineage-defining results require undoing an
  unstarted amendment before correction.
- **Booking overrun:** preview recalculates remaining caps; impossible schedules
  require explicit untimed continuation.
