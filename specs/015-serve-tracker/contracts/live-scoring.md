# Live Scoring Interaction Contract

## Setup

The first Start match action opens a serve setup dialog. It requires:

- first-serving team for singles and doubles;
- for doubles, a right-at-zero selection for each named team.

Confirming setup starts the existing match timer and enables rally recording.

## Rally targets

Each large team target is labelled as a rally-winner action. Selecting the
serving team awards a point. Selecting the receiver records a service loss.
The polite live status announces the result, such as “Maya scores; still
serving from left” or “Side out; Jordan serves from right.”

## Serving guide

The guide is read-only and always includes:

- serving team;
- active player name;
- `Server 1` or `Server 2` in doubles, excluding the opening label's special
  display treatment;
- Left or Right text;
- a horizontal full-court diagram with the net, both kitchens, four service
  boxes, and exactly one legal service box highlighted;
- one solid lime head-and-torso marker for the server, positioned at the active
  box without a glow or background plate and without claiming to show the other
  players' live formation. The marker remains fully outside either baseline and
  never overlaps the playing surface.

The active box softly pulses from bright to muted lime and the server marker
transitions between boxes. Both effects are disabled for reduced motion. On a
320px-wide, 768px-tall phone, neither score may overlap the rally controls and
the complete scorer must remain usable without page scrolling.
Each mobile score zone places the team name and rally instruction first, then
uses the remaining space for a large centered score above the controls.

The teams occupy opposite ends of the diagram. A side out moves the highlight
and server marker to the other team's end; the Left/Right service box is mirrored
to remain correct from that server's perspective.

It describes a “legal serving position” and never claims to display current
post-serve formation.

## Recovery

`Undo last rally` restores the exact preceding scoring and service state.
`Fix serve` is secondary and changes no score. It offers the transitions legal
from the current state: advance to Server 2 where available, or side out.
The control confirms its selected outcome in the live status region.

`Swap sides` reverses the visible score-zone order and which team occupies each
court end. It must not reassign team identity, scores, service sequence, or
tournament results. The orientation persists with the scoring session.
