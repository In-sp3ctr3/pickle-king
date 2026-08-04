# Feature Specification: Bracket Balance and Story Tree

## Goal

Repair the remaining iPad match-card alignment defects and make the portrait
bracket export read as a complete tournament tree.

## Requirements

- Reset all sits immediately before `01 · The field`, not in the setup hero.
- Ordinary match nodes contain their header, two participant rows, start action,
  and 48px edit target without clipping or crowding.
- Edit controls use dark ink on lime states and warm white on dark states.
- The final uses equal participant lanes around one centered trophy. Header
  padding, status, scores, and edit action share a balanced alignment system.
- A current final is visually distinct with a warm-metal surface and readable
  dark content; no decorative ribbon or top stripe is introduced.
- Third place remains centered directly below the final without a connector.
- Post and Story / Reel bracket exports use descending, inward-converging round
  branches and occupy the available portrait height.
- The existing champion-card composition is unchanged in this feature.

## Non-goals

- Champion-card redesign.
- Tournament schema, scoring, persistence, or scheduling changes.
- New assets or dependencies.
