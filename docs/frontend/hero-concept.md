# Bracket Viewport Signature Experience

Status: ready
Pipeline version: 2
Research required: yes
Motion required: yes
Motion reason: direct manipulation must keep the board coordinate beneath a
pinch midpoint or zoom control stable while moving between overview and detail.

## Product Story

Experience type: functional

- Input: a player pinches, drags, or uses explicit zoom controls on Full draw.
- Transformation: the connected bracket scales around the gesture while
  remaining inside finite board bounds.
- Output: either a fitted complete-draw overview or readable interactive cards.
- User value demonstrated: the whole tournament route can be understood at a
  glance without losing precise access to an individual match.

## Direction

The existing connected DOM bracket is placed inside a finite scaled stage.
Native Pointer Events support pinch and horizontal drag; explicit controls
cover zoom out, fit, reset, and zoom in. Fit remains actionable: tapping a
match centers it at readable size, where Play/Edit retains a safe 48px target.

## Storyboard

| Stage    | Time       | Visual state                                   | QA signal                      | Reduced motion |
| -------- | ---------- | ---------------------------------------------- | ------------------------------ | -------------- |
| Overview | immediate  | Complete draw fitted; tap-to-inspect nodes     | `data-bracket-mode="overview"` | same           |
| Readable | immediate  | Board at 100%; node actions restored           | `data-bracket-mode="readable"` | same           |
| Detail   | continuous | Pinch or controls enlarge around a fixed point | zoom percentage output         | same           |

## Implementation

- Selected rung: semantic DOM/CSS transforms with native Pointer Events.
- Why this rung is necessary: it preserves accessible match cards while adding
  bounded pinch, pan, fit, wheel, and keyboard interaction without a dependency.
- Rejected simpler options: horizontal scrolling cannot show the whole draw;
  browser page zoom changes the entire app instead of the bracket.
- Prototype required: yes
- Prototype route/artifact: isolated BracketTree viewport interaction.
- Prototype acceptance criteria: bounded fluid pinch/pan, fitted tap-to-inspect
  overview, gestures beginning over controls, centered 100% inspection,
  preserved taps, keyboard alternatives, and no starved animation frame.
- Prototype evidence: docs/frontend/evidence/bracket-zoom-prototype.md
- Prototype decision: passed
- Approved by: frontend prototype gate and targeted interaction tests.
- Desktop: 100% centered championship view with mouse, wheel, keyboard, Fit,
  and Reset controls.
- Mobile: 100% centered championship view with bounded drag, pinch, Fit, and
  48px toolbar controls.
- `prefers-reduced-motion` behavior: direct manipulation remains immediate;
  decorative transitions are removed.
- Static fallback: the existing semantic bracket remains horizontally
  scrollable when gestures are unavailable.
- Measurement: 0 ms longest task across 21 bracket viewport interactions at
  390×844.

## State Model

| State    | Entry                        | Behavior                          | Exit                         | Accessibility                           |
| -------- | ---------------------------- | --------------------------------- | ---------------------------- | --------------------------------------- |
| overview | Fit or zoom below 100%       | complete draw; inspect-only nodes | tap node centers it at 100%  | avoids undersized action targets        |
| readable | Reset or scale equals 100%   | normal scroll and match controls  | fit, pinch, or zoom controls | 48px targets restored                   |
| detail   | zoom above 100%              | anchored pan and magnification    | reset, fit, or zoom out      | percent output and controls             |
| panning  | pointer moves past threshold | bounded horizontal stage pan      | pointer up/cancel            | tap targets suppressed only during drag |

## Performance Budget

- No new runtime dependency, bitmap canvas, WebGL, or generated asset.
- One transform and one layout-sized stage; React updates only the scale.
