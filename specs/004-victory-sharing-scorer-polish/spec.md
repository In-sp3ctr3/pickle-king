# Feature Specification: Victory, sharing, and scorer polish

## Goal

Make a finished match feel worth sharing while keeping the live scorer fully
usable on the court's primary phone and iPad orientations.

## Requirements

1. Result review uses the crowned-ball mark, one visible crown, dominant scores,
   truthful victory context, and a one-shot confetti burst.
2. Reduced-motion users receive a static celebration with identical content and
   controls.
3. Tournament results use the same identity and show the champion's record and
   point differential.
4. Quick-result PNGs stay 1080×1350; bracket PNGs stay 1600×1000. Both contain
   the local brand mark, deterministic static confetti, and no invented metrics.
5. Image generation remains on device, waits for local assets, prevents duplicate
   generation, and exposes success, cancellation, and failure states.
6. An idle scorer presents a centered Start match action, blocks score entry,
   and does not expose the active-scoring hint.
7. Idle and active scorer controls fit without page scrolling at 820×1180,
   1180×820, 390×844, and 844×390.
8. Edit draw and Share bracket live beside the Full draw heading.

## Non-functional constraints

- No persistence migration, remote asset request, analytics, or player-data
  transmission.
- Every hand-authored TypeScript/TSX file remains below 300 logical lines.
- Confetti is decorative, pointer-inert, cleaned up on unmount, and never blocks
  focus or result confirmation.
