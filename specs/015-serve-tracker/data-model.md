# Data Model: Serve tracker

## Service state

`ServiceState` is part of an in-progress scoring session.

| Field          | Meaning                                                                   | Validation                                            |
| -------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| `startingTeam` | Team selected to serve the opening rally.                                 | `A` or `B`                                            |
| `rightAtZero`  | For doubles, the member id on the right when that team has an even score. | One member from each doubles team; absent for singles |
| `servingTeam`  | Team that serves the next rally.                                          | `A` or `B`                                            |
| `turn`         | `opening`, `first`, or `second`; singles never uses `second`.             | Format-consistent                                     |

The active player and service side are derived values:

- In singles, an even own score serves from right; an odd own score serves from
  left.
- In doubles, the configured right-at-zero player is right when the team's own
  score is even and left when it is odd; their partner is opposite.
- A normal `first` turn selects the player legally on the right. A normal
  `second` turn selects their partner. The `opening` turn selects the starting
  team's configured player and is displayed as `2` for the `0–0–2` score call.

## Rally record

Each live scoring action creates a reversible record containing the previous
scoring and service state. A record may represent:

1. a serving team point;
2. a first-server fault moving to the second server;
3. an opening, second-server, or singles side out.

This replaces score-only undo while a tracked game is active.

## Persistence compatibility

Older persisted scoring sessions receive an explicit unconfigured service state.
Completed historical results retain their existing data. An active older session
cannot award another rally until the scorekeeper establishes the real serve
state, avoiding an invented server.
