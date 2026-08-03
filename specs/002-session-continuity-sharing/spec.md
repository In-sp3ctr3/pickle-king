# Session Continuity and Sharing

Status: accepted for implementation

## Problem

Courtside operators need to recover from a missed entrant, correct player
names without invalidating a draw, reuse familiar names across Quick Matches,
review a night's results, and share a polished result without exposing local
data to a server.

## Product Decisions

- Renaming a player preserves the player's stable ID, completed scores, and
  advancement path. Every rendered occurrence updates immediately.
- Adding, removing, or re-rating an entrant is a structural edit. Before play,
  it rebuilds the seeded draw. After any match starts, it requires explicit
  confirmation and rebuilds the entire draw with all scores cleared. The
  original booking deadline remains unchanged.
- The app must not imply that a late entrant can be inserted into an arbitrary
  live knockout draw while every completed result remains fair.
- Store the most recent 50 Quick Matches and 10 completed tournaments locally.
  This bounded record does not require SQLite, IndexedDB, a backend, or an
  account.
- Remembered-name suggestions are derived from local history and the active
  tournament. They never leave the device.
- Each result and completed bracket is individually shareable as a branded PNG.
  Use the platform share sheet when file sharing is supported; otherwise
  download the PNG.
- Screenshot interception is out of scope because browsers do not provide a
  dependable screenshot event. A visible Share control is the supported path.
- A selectable, multi-result “night card” is deferred until per-result sharing
  has been used in production.

## Functional Requirements

### Bracket editing

1. The bracket screen exposes an Edit draw action.
2. The editor distinguishes safe name corrections from structural changes.
3. Names are trimmed, non-empty, unique case-insensitively, and at most 40
   characters.
4. Renaming a finalist updates the source match, downstream match, result
   tables, live scorer labels, and future archive without changing scores.
5. Structural edits allow 4–16 entrants and required 2.5–5.5+ ratings.
6. A structural edit is blocked while a live scorer is open.
7. Once play has started, the destructive confirmation names the consequence:
   all match scores and results will be cleared and the draw reseeded.
8. A rebuild uses the existing deterministic random seed and tournament rules.

### Session history and remembered names

1. Confirming a Quick Match records it exactly once.
2. Completing a tournament records it exactly once.
3. Quick Match records include exact side membership, score, winner, format,
   target, finish reason, and completion time.
4. The history screen lists recent Quick Matches and completed tournaments,
   newest first.
5. History remains after the active tournament is reset.
6. Oldest entries are pruned beyond 50 Quick Matches or 10 tournaments.
7. Invalid stored history produces a recoverable local-history reset path; it
   is not silently discarded.
8. Quick Match name fields offer keyboard- and touch-operable suggestions and
   exclude names already selected for another slot.

### Celebration and sharing

1. The result confirmation surface retains large names and scores and adds a
   restrained crown-led celebration.
2. Sharing creates a text-free-image-safe, branded PNG entirely on device.
3. Quick Match cards are portrait social cards; tournament cards are landscape
   connected-bracket cards.
4. Native file sharing is feature-detected with `navigator.canShare` and falls
   back to a file download.
5. Sharing cancellation is not presented as an error.
6. Share controls remain usable offline and expose a concise live-region result.

## Non-functional Requirements

- No player data transmission, analytics, remote fonts, accounts, or database.
- Active-session persistence and history persistence remain separately
  versioned so clearing one does not erase the other.
- Domain and persistence code remains React- and browser-free.
- Every hand-authored TypeScript/TSX file stays below 300 logical lines.
- iPad portrait and landscape remain primary verification targets, followed by
  phone portrait/landscape and desktop.
- All new controls are at least 48px, keyboard reachable, visibly focused, and
  do not rely on color alone.

## Acceptance Scenarios

- Rename a semifinal winner after the final pairing resolves; every occurrence
  changes and all scores remain intact.
- Add a seventh entrant before any match starts; the draw reseeds with automatic
  advances and no score-loss warning.
- Add a seventh entrant after one completed match; the warning appears, cancel
  preserves the draw, and confirm rebuilds with zero completed matches.
- Complete the same Quick Match confirmation twice; exactly one record exists.
- Complete 51 Quick Matches; the newest 50 remain.
- Start a second doubles match and select names used in the first without
  retyping them.
- Share a completed result with file-sharing support and with only download
  fallback; both produce a non-empty PNG with the correct score.
