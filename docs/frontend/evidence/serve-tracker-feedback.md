# Serve Tracker Browser Feedback

Resolved screenshot comments from the 319–342px scorer review:

- Replaced the half-court highlight with a horizontal 44:20 full court, both
  kitchens, four service boxes, and one active legal box.
- Mirrored the active end after side out and kept the server marker outside
  either baseline.
- Replaced the glowing marker plate with a solid lime head-and-torso marker.
- Reflowed the server copy, server number, player labels, centered scores, and
  rally controls for narrow phones.
- Added a one-tap Swap sides control that preserves team, score, and service
  identity while reversing the visible court orientation.
- Grouped the desktop server copy and mini-court in one bounded 720px row.

Verification is retained in `tests/playwright/serve-tracker.spec.ts` and the
current quick-live desktop, mobile, and swapped-mobile captures.
