# Product Specification: Offline Tournament PWA

Status: approved for implementation  
Owner: In-sp3ctr3  
Date: 2026-07-30

## Problem

A weekly pickleball group needs a fairer answer to “who is the best?” than king
of the hill. Consecutive winners should not be forced into back-to-back games,
and the final match must finish inside a booked court session.

## Users and outcomes

- An organizer enters 4–16 unique players and self-ratings from 2.5 to 5.5+.
- The app creates a standard seeded single-elimination bracket with byes.
- One court is scheduled round by round with rest-aware ordering.
- Every match has a touch-first scorekeeper and an optional wall-clock-safe
  timer.
- The app produces a podium, standings, statistics, and upset highlights.
- A player can run a separate singles or doubles Quick Match.

## Functional requirements

### Tournament setup

- Ratings seed the bracket only; tied ratings are shuffled by a stored seed.
- Defaults: 120-minute booking, 10-minute warm-up, 60-second transitions,
  target score 11. Target presets are 7 and 11; custom targets are 1–99.
- An untimed mode removes booking, warm-up, transition, and match-cap
  requirements. One target score applies consistently throughout a tournament.
- The match cap equals available play time divided by all bracket matches,
  including the mandatory third-place match and transitions.
- Impossible schedules are rejected with a specific correction.

### Bracket and schedule

- Every entrant appears exactly once in the bracket.
- High seeds occupy separated bracket regions; byes go to the highest seeds.
- A round completes before the next round begins.
- Ready matches prefer the participants who have rested longest.
- The bronze match runs before the final.
- Early finishes add rest buffer. When the session is behind schedule, only
  remaining unstarted caps are reduced, evenly, to protect the booking deadline.

### Live match

- Score controls include large add zones and explicit subtract controls.
- A burst of taps cannot move the persisted score beyond the first legal
  winning point. Number motion follows the value direction; countdown digits
  move downward without cycling through unrelated values.
- The operator can pause, resume, or reset.
- A side wins only after reaching the target with at least a two-point lead.
- At the deadline the leader wins; a tie enters golden point.
- A result is confirmed before advancement.
- Choosing Edit score enters a dedicated correction state. Score taps remain
  editable without repeatedly reopening the result dialog; the operator reviews
  the corrected result once when finished.
- Restart requires confirmation and resets the score and match clock.
- Ending early may keep the current score or discard the attempt. A leader wins
  when the score is kept; a tied score requires the operator to select a
  winner. Discarding returns the tournament match to ready without advancing.
- A correction is allowed until a dependent match starts. A later correction
  requires confirmation and clears all affected downstream results.
- Match and session timers derive from deadlines, not interval counts.
- Quick Match supports either a time cap or no match clock.

### Results and recovery

- Results show champion, runner-up, third place, elimination groups, record,
  points for/against, differential, match history, and upset wins.
- Results never claim a new official pickleball skill rating.
- State is schema validated and versioned in localStorage.
- Corrupt state shows a recoverable reset screen.

### PWA and privacy

- The root app shell and same-origin assets work offline after first load.
- Service-worker activation is deferred during live play.
- Wake Lock is requested during live matches when available.
- Timer completion has visible, audible, and vibration feedback with fallbacks.
- No player or score data leaves the device.

## Non-goals

Accounts, cloud sync, live multi-device rooms, analytics, public leaderboards,
multiple courts, doubles tournaments, and an ongoing rating engine are excluded.

## Acceptance

The feature is accepted only when `verification.md` records passing domain,
workflow, browser, accessibility, security, PWA, file-length, and production
build gates with no open P0/P1/P2 findings.
