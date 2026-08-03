# Implementation Plan

1. Extend the domain with draw styles, score-event history, comeback metrics,
   stage naming, replay helpers, and earliest-round match eligibility.
2. Add persistence defaults and reducer actions without changing the snapshot
   version or losing existing sessions.
3. Repair scorer controls, bracket cards, inline identity editing, final layout,
   results presentation, replay, and transient feedback.
4. Add focused tournament recap and player-stat share canvases plus a single
   share chooser.
5. Update the frontend contract, route map, asset/design records, tests, and
   responsive evidence before running repository, Vinext, and PWA gates.

## Development mode

Use TDD for seeding, score history, match eligibility, persistence, and replay.
Use browser acceptance tests for interaction, responsive layout, and generated
images. Keep UI modules cohesive and avoid generic service layers.
