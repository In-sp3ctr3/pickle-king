# Node Layout and Rename Labels

## Goal

Repair ordinary bracket-node balance, portrait bracket connectors, and
completed-tournament name corrections without changing tournament identity or
results.

## Requirements

- Ordinary match headers place the round at left, status at center, and edit
  action at right with equal outer padding.
- The start action aligns with the midpoint of the stacked participant rows,
  excluding the header.
- Post and Story / Reel exports show one readable connector route per real match
  dependency, without doubled rails.
- Renaming a player changes the single player record used by setup, every
  bracket round, results, history, and exports.
- A name-only edit never invokes result correction, clears a downstream score,
  reopens a match, or changes winner/loser identity.
- If either label in a two-name edit is invalid, neither label remains changed.
- Actual score edits retain the existing guarded downstream-reset behavior.

## Non-goals

- Replacing a participant with a different person.
- Rebuilding or reseeding a started tournament.
- Changing the champion-card composition.
