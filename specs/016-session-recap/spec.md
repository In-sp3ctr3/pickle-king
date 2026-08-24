# Session Recap / Receipts

Status: implemented; repository-level release exceptions are recorded in verification.md

## Problem

Friend groups often play several independent Quick Matches during one court
session. The Match Ledger preserves each score, but it cannot summarize the
selected run of games or produce the shareable Singles and Doubles "Receipts"
users currently assemble manually.

## Product Decisions

- A recap is an ephemeral calculation over user-selected Quick Match records;
  it is not a tournament, rating, persisted session, or new game mode.
- The latest local calendar day's Quick Matches are preselected, and users may
  freely change the selection across dates.
- Singles and Doubles produce separate recap sections and images.
- A format needs at least two selected matches. One-match formats continue to
  use the existing individual result share.
- Point differential appears only when every match in that format uses the same
  target and finished normally at the target.
- Recap images use the supplied cream, black, and lime Receipts direction with
  the existing fonts and crowned Pickle King mark.
- Player rows paginate at six per image. Multi-page native sharing is attempted
  per format and falls back to one-page-at-a-time export.

## Functional Requirements

1. Match Ledger exposes Create recap when at least two Quick Matches exist.
2. Selection mode is keyboard and touch operable, announces its selected count,
   and preserves normal history actions after cancellation.
3. Preview is enabled when Singles or Doubles has at least two selected records.
4. Player records group trimmed names case-insensitively, preserve the newest
   spelling, and credit full team points to each participant.
5. Records show games played and W-L; compatible sections also show point
   differential.
6. Doubles show a Top Pair only for a unique best pair that played together at
   least twice.
7. Recap pages contain at most six player rows without losing or duplicating a
   player.
8. Post output is 1080x1350 and Story / Reel output is 1080x1920.
9. The recap dialog separates Singles and Doubles, switches image format,
   navigates pages, and shares every page in the active format when supported.
10. Failure to build an additional page never shares a partial set and never
    removes access to the visible page.
11. Names, scores, images, and selection state remain on device until an
    explicit share or download.

## Non-goals

- Persisted sessions, custom recap titles, permanent player identities, global
  standings, ratings, scheduling, King/Queen of Court, AI generation, accounts,
  databases, analytics, or new routes.
- ZIP creation or automatic bursts of browser downloads.

## Acceptance Scenarios

- Selecting the supplied Aug 22 Doubles results reproduces every player W-L and
  differential plus Shevar + Kaodi as the unique 3-0 Top Pair.
- Selecting the supplied Singles results reproduces Jadan at 4-0 and +11.
- Reversing sides, reordering records, or changing name case leaves the numeric
  recap unchanged.
- A mixed target, buzzer, golden point, ended-early, or operator-selected result
  removes differential from only the affected format.
- Seven or more players produce balanced continuation pages with six or fewer
  rows each.
- Unsupported multi-file sharing retains per-page share/download controls.

## Success Criteria

- An operator can create a two-format recap from the populated ledger without
  re-entering a player or score.
- Every generated page is branded, legible, correctly sized, and available
  offline.
- Existing Quick Match, tournament history, individual share, removal, and
  recovery workflows continue to pass.
