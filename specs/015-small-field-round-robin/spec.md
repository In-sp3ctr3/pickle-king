# Feature Specification: Small-field round robin and finals

## Goal

Extend Round robin + finals from exactly four players to participation-first
fields of four, five, or six without changing Fast knockout as the default.

## Product decisions

1. Full round robin is available for 4–6 players and unavailable at 7–16.
2. Every unordered pairing is played once before bronze and final.
3. Preliminary ranks 3/4 play bronze before ranks 1/2 play the final. Lower
   ranks keep their frozen preliminary positions.
4. Five-player preliminary rounds identify the one resting player; no fake bye
   match is persisted.
5. Timed schedules remain buildable when their calculated cap is short. A cap
   below eight minutes produces a prominent advisory, not a validation error.
6. Untimed schedules show match and participation counts without duration or
   tight-schedule warnings.
7. Adding a seventh player while the format is selected returns setup to Fast
   knockout and announces the 4–6-player limit.
8. Late entry, structural in-progress roster edits, and in-progress schedule
   sharing remain unsupported.

## Requirements

- Preserve the existing four-player pairing order exactly.
- Generate every pairing once across three rounds for four players and five
  rounds for five or six players.
- Use ranked or stored-random order for schedule order and the last standings
  tie-break.
- Lock later preliminary rounds until the current round is complete; unlock
  bronze only after every preliminary and the final only after bronze.
- Persist the generalized shape in version 2 without migrating valid existing
  four-player tournaments.
- Recalculate placements after preliminary correction and reset both placement
  matches after confirmation when either has started.
- Preserve refresh, replay, history, completed sharing, scorer, rename, and
  deadline rebalancing behavior.

## Acceptance criteria

- Four, five, and six players produce 8, 12, and 17 matches respectively.
- Every player has exactly `n - 1` preliminary appearances and every pairing is
  unique.
- Five-player rounds expose one different resting player per round.
- Results place the podium from placement matches and all lower players in
  frozen preliminary order.
- Timed caps use every planned match and `matches - 1` transitions; only caps
  below eight minutes show the setup advisory.
- Untimed setup never displays a schedule-duration warning.
- Seven players reject the format and setup falls back accessibly.

## Constraints and deferred work

- One court, singles players, one score target, and one uniform timed cap.
- No new dependency, analytics, account, remote font, networking, or player-data
  transmission.
- Seven-player round robins, pools, multiple courts, classification matches,
  doubles teams, and late entry remain deferred.
