# Session Recap / Receipts

Status: implemented and verified

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
- Recap images reference-lock the supplied cream, black, and lime Receipts
  posters. User-authorized stable artwork is preserved in local templates;
  dates, records, pagination, and notices remain deterministic Canvas text.
- Player rows paginate in strict chunks of twelve per image. Multi-page native sharing is attempted
  per format and falls back to one-page-at-a-time export.
- Recap tables use the reference columns: Player, W-L, and conditional +/-.
  Games played remains calculated but is not rendered as a fourth column.
- Individual Quick Match sharing offers three treatments: Poster (the supplied
  black stacked-score/oversized-mascot design) by default, then Frame and
  Receipt. Every treatment retains both sides, exact scores, winner, format,
  and date. Quick exports never invent `FINAL` and never render redundant
  `FIRST TO`, target, or finish-reason copy.
- Legacy arena-based tournament share artwork is replaced atomically with the
  same poster family; Champion, Player stats, and Full bracket flows remain.
- New player entry is capped at 16 trimmed characters. Existing saved names up
  to the persisted 40-character ceiling remain readable and are never mutated.

## Functional Requirements

1. Match Ledger exposes Create recap when at least two Quick Matches exist.
2. Selection mode is keyboard and touch operable, announces its selected count,
   and preserves normal history actions after cancellation.
3. Preview is enabled when Singles or Doubles has at least two selected records.
4. Player records group trimmed names case-insensitively, preserve the newest
   spelling, and credit full team points to each participant.
5. Records show W-L; compatible sections also show point differential.
6. Doubles show a Top Pair only for a unique best pair that played together at
   least twice.
7. Recap pages contain at most twelve player rows without losing or duplicating a
   player.
8. Post output is 1080x1350 and Story / Reel output is 1080x1920.
9. The recap dialog separates Singles and Doubles, switches image format,
   navigates pages, and shares every page in the active format when supported.
10. Failure to build an additional page never shares a partial set and never
    removes access to the visible page.
11. Names, scores, images, and selection state remain on device until an
    explicit share or download.
12. Quick Match share previews expose Poster, Frame, and Receipt as
    keyboard-operable treatments and lazily render only the selected treatment.
13. Every share image contains the crowned mascot plus Pickle King wordmark and
    no meaningless filler copy.
14. Export generation verifies every required local font and fails clearly
    instead of silently rendering a fallback face.
15. Stable shaded artwork may use the supplied pixels, but no player name,
    score, date, standing, opponent, page label, or rules notice is baked into a
    template.

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
- Thirteen or more players produce strict continuation pages with twelve or fewer
  rows each.
- Seven and eight rows use the dense composition; nine through twelve use a
  lighter compact composition in both Post and Story.
- One through six rows use fixed regular profiles sized to their visible rows;
  they are never compressed using the twelve-row page capacity.
- `PLAYER STANDINGS` and `ROTATING PARTNERS` use the same uncompressed,
  broken-rule subtitle treatment. Table text is visually centered between row
  rules.
- Every valid new 16-character winner name remains complete across Poster,
  Frame, and Receipt; persisted 17–40-character names remain loadable and may
  ellipsize only after two-line measured fitting fails.
- Unsupported multi-file sharing retains per-page share/download controls.
- The five reference fixtures produce matched-data source/render/difference
  boards with no font fallback, no text/score overlap, and the contracted
  masthead, row-rule, score-gap, and footer geometry.

## Success Criteria

- An operator can create a two-format recap from the populated ledger without
  re-entering a player or score.
- Every generated page is branded, legible, correctly sized, and available
  offline.
- Existing Quick Match, tournament history, individual share, removal, and
  recovery workflows continue to pass.
