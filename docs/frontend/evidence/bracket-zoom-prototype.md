# Bracket viewport prototype

Status: passed

- Integrated artifact: `src/features/bracket/bracket-viewport.tsx`
- Representation: semantic DOM/CSS transform with native horizontal touch
  overflow, a two-touch pinch handler, and Pointer Events for mouse/pen; no
  bitmap canvas, WebGL, new package, or copied registry source.
- Dynamic fit: uses measured viewport and board dimensions, including a 24px
  inset, and clamps every scale to the computed fit value through 200%.
- Overview safety: the bracket opens centered and interactive at 100%. Fit is
  opt-in and inspect-only; the first node tap centers it at 100%, where its
  Play/Edit controls regain their full 48px touch targets.
- Direct manipulation: iPad one-finger pan stays in WebKit's accelerated
  overflow path instead of competing with page scroll. Exactly two touches
  retain the board coordinate under the moving pinch midpoint. Mouse/pen
  gestures may begin over match actions, a six-pixel threshold preserves taps,
  queued frames are coalesced without starvation, and every end/cancel path
  clears panning state.
- Alternatives: visible Fit, Reset, zoom-out, and zoom-in controls plus F, 0,
  +/−, and arrow-key equivalents. The current percentage remains visible
  without announcing every pinch update.
- Reduced motion: transforms update directly with no transition or animation.

## Runnable evidence

`npm test -- --run src/features/bracket/bracket-viewport.test.tsx`

The five focused checks cover complete-board fit, finite anchored bounds,
initial 100% centering, centered overview inspection, 200% clamping, pinch midpoint
anchoring, control-origin drag, frame coalescing, pointer-cancel/lost-capture
cleanup, stale-click cleanup, modifier-wheel input, and keyboard alternatives.

Decision: passed for integration into the existing `BracketTree` viewport.
