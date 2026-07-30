# Home Hero Artwork

Status: ready  
Research required: yes  
Motion required: yes  
Motion reason: a staged impact makes the generated image feel painted into the
court surface instead of placed inside a rectangular hero card.

## Product Story

- Input: a friend group that still has an unresolved “best player” argument.
- Transformation: players become a seeded, rested, one-court tournament.
- Output: one completed draw and one crowned winner.
- User value demonstrated: the app turns informal court time into a fair result
  without sending names or scores off the device.

## Direction

The hero uses original, text-free editorial artwork: one acid-lime pickleball
crosses a worn night court toward a gold crown. The same aligned image sits
behind several alpha masks. A large organic blot lands first, a smaller splash
follows, and detached droplets finish the reveal. Because only the masked pixels
appear, there is never a rectangular image edge against the near-black page.

This visual is not a bracket, scoreboard, stock sports photograph, dashboard
panel, or UI mockup. It reduces the product promise to one courtside idea: play
through the draw and claim the crown.

## Storyboard

| Stage    | Time       | Visual state                                        | Product meaning                   | QA signal                      |
| -------- | ---------- | --------------------------------------------------- | --------------------------------- | ------------------------------ |
| Impact   | 0–150ms    | Small central paint contact and soft impact bloom   | The challenge lands on court      | `data-motion-state="impact"`   |
| Spread   | 150–430ms  | Main wet-paint silhouette expands and settles       | The session takes shape           | `data-motion-state="spread"`   |
| Droplets | 430–1050ms | Secondary splash and detached drops arrive          | Energy without a decorative loop  | `data-motion-state="droplets"` |
| Settled  | 1050ms+    | One continuous image remains inside irregular edges | The primary actions stay readable | `data-motion-state="settled"`  |

## Implementation

- Selected rung: locally hosted raster artwork, one generated alpha matte,
  CSS mask layers, and Motion for the impact pulse.
- Why this rung is necessary: CSS `mask-image` switching is discrete, while
  animating the size and opacity of separate mask layers creates a continuous
  spread without canvas or video.
- Desktop: asymmetric 7/5 composition with copy and actions first.
- Mobile: stacked copy and actions followed by a full-width masked image that
  retains the ball and crown in the crop.
- `prefers-reduced-motion` behavior: skip every impact stage and render the
  settled masked artwork immediately.
- Static fallback: the final alpha-masked composition remains understandable
  without animation support.
- Measurement: route harness observes the droplet and settled states and
  captures 1440×1000 and 390×844 conditions.

## Performance Budget

- WebP, 1536×1024, about 272KB.
- Indexed alpha mask, 1536×1024, about 16KB.
- Local requests only; no video, remote font, canvas renderer, or idle loop.
