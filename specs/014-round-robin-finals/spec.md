# Feature Specification: Four-player round robin and finals

## Goal

Give exactly four players a participation-first alternative to the fast
knockout draw without changing the existing knockout default.

## Product decisions

1. **Fast knockout** remains the default for every field size.
2. **Round robin + finals** is available only with exactly four players.
3. The format contains six preliminary matches, a third-place match between
   preliminary ranks three and four, and a final between ranks one and two.
4. Every player plays four matches and every match uses the same score target
   and calculated time cap.
5. Preliminary standings rank by wins, two-way head-to-head, point
   differential, points scored, then stored player order.
6. Ranked order uses ratings. Random order uses the stored draw seed. Order
   affects schedule order and only the final standings tie-break.
7. The format has no late entry, structural in-progress roster editing, or
   in-progress tournament image.
8. Completed champion and player-stat sharing, history, replay, correction,
   resume, and local persistence remain supported.

## Requirements

- Generate each unordered player pairing exactly once across three rounds.
- Keep later preliminary rounds locked until the current round is complete.
- Resolve the placement participants only after all six preliminary results.
- Require third place to finish before the final.
- Show live semantic standings, the six-match schedule, and both placement
  cards on a dedicated tournament surface rather than a bracket tree.
- Correcting a preliminary preserves other preliminary scores, recalculates
  standings, and resets both placement matches after confirmation when either
  placement has started.
- Existing saved sessions and history migrate as knockout tournaments.
- Persist and validate new sessions and history with storage version 2.

## Non-functional constraints

- Keep framework code thin and domain code free of React/browser APIs.
- Keep hand-authored TypeScript and TSX files below 300 logical lines.
- Add no dependencies, analytics, accounts, remote fonts, or player-data
  transmission.
- Preserve the existing visual identity, scorer, knockout workflow, and local
  privacy promise.

## Acceptance criteria

- A four-player operator can choose the new format and complete eight matches.
- Every player appears in three preliminary matches and one placement match.
- The final and bronze participants match the deterministic standings.
- Timed sessions divide playable time across eight matches and seven changes.
- Refresh, replay, correction, history, and completed result sharing work.
- Knockout creation, play, sharing, and migration remain unchanged.

## Deferred

- Round robins above four players, pools, multiple courts, doubles teams,
  late entry, structural mid-event edits, and in-progress schedule images.
