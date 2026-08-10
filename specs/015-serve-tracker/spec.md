# Feature Specification: Serve tracker

**Feature Branch**: `serve-tracker`

**Created**: 2026-08-09

**Status**: Ready for planning

## Goal

Let a courtside scorer record each rally once and always see the team, player,
server turn, and legal service court for standard pickleball side-out scoring.
The score screen must remain fast and uncluttered on phones and tablets.

## User Scenarios & Testing

### User Story 1 - Record a rally with the correct serve (Priority: P1)

As the scorekeeper, I can tap the team that won a rally and the scorer updates
the score and service sequence correctly, so I do not have to remember who is
serving.

**Why this priority**: Accurate, low-attention scoring is the feature's core
value.

**Independent Test**: A complete singles or doubles service sequence can be
recorded without manually moving players or calculating a serving side.

**Acceptance Scenarios**:

1. **Given** a serving team wins a rally, **When** the scorekeeper taps that
   team, **Then** only that team's score increases and the same server moves to
   the opposite legal serving side.
2. **Given** the receiving team wins a rally in doubles, **When** the
   scorekeeper taps that team, **Then** its score is unchanged and service
   advances from Server 1 to Server 2 or to a side out as applicable.
3. **Given** a server loses a rally in singles, **When** the scorekeeper taps
   the receiver, **Then** the receiver gains service without gaining a point.

---

### User Story 2 - Glance at the next legal server (Priority: P1)

As a player or scorekeeper, I can see the active server, temporary server turn,
and legal left or right service box at a glance, so I can resume play without a
score discussion.

**Why this priority**: The visual cue is the requested way to reduce forgotten
servers without crowding the primary score targets.

**Independent Test**: At every service state, the compact guide identifies the
serving team, named server, server turn when applicable, and legal court side
without relying only on color.

**Acceptance Scenarios**:

1. **Given** a doubles rally is ready to serve, **When** the live scorer is
   visible, **Then** the guide labels the active player, Server 1 or Server 2,
   and Left or Right while highlighting that service box.
2. **Given** a singles rally is ready to serve, **When** the live scorer is
   visible, **Then** the guide labels the active player and Left or Right
   without a server-number label.
3. **Given** a team is stacking, **When** its legal server is shown, **Then**
   the guide describes a correct serving position rather than claiming to show
   live player formation.

---

### User Story 3 - Start and recover a service sequence (Priority: P2)

As a scorekeeper, I can configure the opening service and correct a missed
service transition, so the tracker stays trustworthy when I miss a rally.

**Why this priority**: Starting positions and occasional recovery are required
for a reliable doubles indicator.

**Independent Test**: A scorekeeper can start either team, establish each
doubles team's right-at-zero player, recover from a missed transition, and undo
the most recent rally without losing the service state.

**Acceptance Scenarios**:

1. **Given** a new doubles game, **When** the scorekeeper starts it, **Then**
   they choose the first-serving team and each team's player on the right at
   score zero; the first service is displayed as the opening `0–0–2` turn.
2. **Given** a missed service transition, **When** the scorekeeper uses Fix
   serve, **Then** they can advance to Server 2 or record a side out without
   changing either score.
3. **Given** the last rally was entered incorrectly, **When** the scorekeeper
   undoes it, **Then** both the scores and exact preceding service state return.

### Edge Cases

- The first serving doubles team loses its opening rally: service changes sides
  immediately because the opening sequence is the `0–0–2` exception.
- A game reaches the existing target, buzzer, golden-point, edit, or completed
  state: no new rally may be recorded, and existing completion behavior remains.
- A scorekeeper changes the score in result-edit mode: service tracking is
  cleared and must be deliberately re-established before live scoring resumes.
- Persisted sessions created before this feature remain recoverable and do not
  silently acquire an invented service state.
- Reduced-motion users receive the same guide and error feedback without a
  shake animation.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST use standard side-out scoring while a tracked
  match is live: only the serving team receives a point for a won rally.
- **FR-002**: The system MUST model the doubles opening `0–0–2` sequence,
  normal Server 1 and Server 2 sequence, and singles side-outs.
- **FR-003**: The system MUST derive the active server and legal service side
  from the scores, configured right-at-zero player(s), serving team, and
  current service turn.
- **FR-004**: The system MUST provide a compact, always-visible serving guide
  on the live scoring screen, with text and a court-box highlight.
- **FR-005**: The system MUST let the scorekeeper select the initial serving
  team before the first live rally and, for doubles, set each team's
  right-at-zero player.
- **FR-006**: The system MUST interpret either large team target as the team
  that won the rally, not as an unconditional score increment.
- **FR-007**: The system MUST offer a one-action undo that restores the full
  preceding rally state, including service state.
- **FR-008**: The system MUST offer a secondary Fix serve control that changes
  only the service sequence and makes the correction understandable.
- **FR-009**: The system MUST keep stacking out of the rule state and describe
  the guide as a legal serving position, not live formation tracking.
- **FR-010**: The system MUST preserve offline persistence and either migrate
  or safely recover older sessions that lack serve state.
- **FR-011**: The guide MUST place opposing teams on opposite court ends and
  move the active service box to the newly serving team's end after a side out.
- **FR-012**: The scorer MUST provide a one-tap Swap sides control that reverses
  score-zone order and court-end orientation without changing team identity,
  scores, service history, or tournament results, and persists that orientation.
- **FR-011**: The system MUST retain existing target, time-limit,
  golden-point, result-confirmation, and result-edit flows.
- **FR-012**: The system MUST provide keyboard access, visible focus, semantic
  labels, a status announcement for each rally outcome, and a reduced-motion
  alternative for transient feedback.

### Key Entities

- **Service state**: The active serving team and service turn for the rally.
- **Starting position**: The player who is on the right at score zero for one
  doubles team; this anchors legal player positions for the game.
- **Rally record**: One reversible outcome that changes a score, a service
  state, or both.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The app correctly handles every transition in the documented
  singles, doubles, opening-service, Server 1, Server 2, and side-out test
  scenarios.
- **SC-002**: A scorer can record a rally with one 48px-or-larger team target
  and see the next legal server without opening a dialog.
- **SC-003**: Undo restores score and service state for 100% of tested rally
  types.
- **SC-004**: The guide and score controls remain usable without vertical page
  scrolling at 390×844, 844×390, 820×1180, and 1180×820.

## Assumptions

- The feature uses standard side-out scoring only; rally scoring is intentionally
  deferred because it has a different service sequence.
- The existing first-to-target, timed, golden-point, and result-edit rules stay
  unchanged.
- Stacking is supported by showing legal service positions; no formation toggle
  or post-serve movement tracking is needed.
- Player names already associated with a match are available to identify a
  doubles team's right-at-zero player.
- No player data leaves the device.

## Out of Scope

- Rally-scoring formats, multiple games/sets, officiating fault adjudication,
  live player-position sensing, or tracking post-serve formations.
