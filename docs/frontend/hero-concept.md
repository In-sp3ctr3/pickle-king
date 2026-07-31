# Home Kinetic Court

Status: ready  
Research required: yes  
Motion required: yes  
Motion reason: player positions visibly rotate between court and rest while the
crown resolves above the active court.

## Product Story

- Input: a friend group that still has an unresolved “best player” argument.
- Transformation: players become a seeded, rested, one-court tournament.
- Output: one completed draw and one crowned winner.
- User value demonstrated: the app turns informal court time into a fair result
  without sending names or scores off the device.

## Direction

The hero is an open DOM composition rather than an image. An angled pickleball
court sits behind four player names. Two names move into the active matchup,
two shift into a visible rest lane, a ball travels across the court, and the
crown resolves above the composition. The movement demonstrates the product's
fairness mechanism rather than decorating the page.

The previous night-court artwork and paint mask are rejected because the user
did not accept the image or the hero composition.

## Storyboard

| Stage   | Time       | Visual state                                  | Product meaning                  | QA signal                     |
| ------- | ---------- | --------------------------------------------- | -------------------------------- | ----------------------------- |
| Seeded  | 0–180ms    | Four names enter around an empty court        | Everyone starts in the draw      | `data-motion-state="seeded"`  |
| Rotate  | 180–620ms  | Two names move on court; two move to rest     | One match, protected recovery    | `data-motion-state="rotate"`  |
| Serve   | 620–1050ms | Ball travels and the active matchup brightens | The next match is ready          | `data-motion-state="serve"`   |
| Settled | 1050ms+    | Crown and court state remain legible          | Run the court and crown a winner | `data-motion-state="settled"` |

## Implementation

- Selected rung: semantic DOM/CSS plus Motion layout and spring transitions.
- Why this rung is necessary: it shows court rotation and protected rest as a
  spatial sequence without adding a decorative asset or heavy renderer.
- No bitmap, canvas, video, or artificial loading delay.
- Desktop: asymmetric 7/5 composition with copy and actions first.
- Mobile: stacked copy and actions followed by the same responsive court
  composition; short landscape screens switch to two columns.
- `prefers-reduced-motion` behavior: skip every impact stage and render the
  settled court immediately.
- Static fallback: the settled court/rest composition remains understandable.
- Measurement: route harness observes rotate/serve/settled states at desktop,
  tablet, phone portrait, and phone landscape viewports.

## Performance Budget

- Existing Motion dependency only.
- No hero raster download.
- One bounded entrance sequence; no idle loop.
