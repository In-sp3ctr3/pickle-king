# Late Entry Challenge

Status: implemented

## Problem

Small social tournaments sometimes begin with a forgotten player. Resetting the
entire draw is unnecessarily destructive once useful matches have been played,
but giving the newcomer a free advanced slot is not procedurally fair.

## Product decisions

- A late entrant can be inserted until either the bronze match or final starts.
- The entrant is unseeded, receives no automatic advance, and must earn the
  bracket depth they missed.
- Only one late-entry amendment is allowed per tournament.
- Completed scores remain historical; the tournament is visibly marked amended.
- The app chooses the affected route deterministically. Organizers cannot choose
  the easiest opponent.
- The repair hierarchy is reversible bye, untouched preliminary, then branch
  gauntlet.
- A gauntlet restores players eliminated by the selected route in chronological
  order. Any restored player may decline without blocking the amendment.
- An amendment can be undone until its first challenge match starts.
- If a timed booking cannot fit the challenge, confirmation explicitly removes
  time caps from the remaining matches.
- When placement play locks the draw, offer Quick Match, full rebuild, finishing
  and starting another tournament, or cancelling and continuing unchanged.

## Functional requirements

1. Validate the entrant as a unique named player with a supported rating and
   enforce the 16-player maximum.
2. Reject insertion while a match is live, after placement begins, or after an
   earlier amendment.
3. Prefer an unused bye route; otherwise use an untouched opening match; otherwise
   choose the active player with the fewest completed matches and break ties with
   the stored tournament seed.
4. Preserve completed match objects and add explicit `challenge` matches.
5. Rewire only the selected unstarted source. If that source feeds the final,
   feed the final challenge loser into the corresponding bronze position.
6. Schedule every pending challenge before returning to the normal round order.
7. Preview protected/restored players, added matches, and match-cap impact before
   confirmation.
8. Keep cancel-and-continue available in both eligible and locked states.
9. Persist and migrate the amendment ledger without breaking saved v1 sessions.
10. Keep player data on device and out of URLs, analytics, and network requests.

## Acceptance scenarios

- Six-player draw: a seventh entrant challenges a deterministic bye recipient.
- Four-player untouched draw: a fifth entrant plays one preliminary.
- Completed opening round: restored branch players form a chronological gauntlet.
- Finalists resolved: final and matching bronze source wait on the challenge.
- A restored player declines: the route and timing preview shrink.
- Cancel from the preview: the bracket remains byte-for-byte unchanged.
- Undo before first challenge start: original sources, caps, players, and schedule
  return.
- Bronze completed: insertion is blocked, cancel keeps the 3-of-4 bracket, and
  Quick Match remembers the late player's name.

## Non-functional requirements

- Pure tournament logic has no React or browser dependencies.
- Hand-authored TypeScript/TSX files remain below 300 logical lines.
- The interaction is keyboard/touch operable with 48px minimum targets.
- iPad portrait and landscape are the primary visual verification sizes.
